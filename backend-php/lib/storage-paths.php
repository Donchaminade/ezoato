<?php
declare(strict_types=1);

/** Dossiers type lisibles (année / sous-dossier). */
function type_folder(string $type): string {
  return match ($type) {
    'devoir' => 'devoir',
    'composition' => 'compos',
    'examen' => 'exam',
    'corrige' => 'corrige',
    default => preg_replace('/[^a-z0-9_-]/i', '', $type) ?: 'autre',
  };
}

function type_folder_label(string $folder): string {
  return match ($folder) {
    'devoir' => 'Devoirs',
    'compos' => 'Compositions',
    'exam' => 'Examens nationaux',
    'corrige' => 'Corrigés',
    default => ucfirst($folder),
  };
}

function slugify(string $s): string {
  $s = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s) ?: $s;
  $s = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $s) ?? '');
  return trim($s, '-') ?: 'document';
}

/** Racine uploads/soumissions/{annee}/{type}/{id}/ */
function soumission_dir(array $cfg, int $annee, string $type, string $id): string {
  $dir = "{$cfg['uploads_dir']}/soumissions/$annee/" . type_folder($type) . "/$id";
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  return $dir;
}

function soumission_images_dir(array $cfg, int $annee, string $type, string $id): string {
  $dir = soumission_dir($cfg, $annee, $type, $id) . '/images';
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  return $dir;
}

function soumission_preview_pdf(array $cfg, int $annee, string $type, string $id): string {
  return soumission_dir($cfg, $annee, $type, $id) . '/preview.pdf';
}

/** Racine uploads/epreuves/{annee}/{type}/{id}/ */
function epreuve_dir(array $cfg, int $annee, string $type, string $id): string {
  $dir = "{$cfg['uploads_dir']}/epreuves/$annee/" . type_folder($type) . "/$id";
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  return $dir;
}

function epreuve_pdf_path(array $cfg, int $annee, string $type, string $id): string {
  return epreuve_dir($cfg, $annee, $type, $id) . '/document.pdf';
}

/** Chemin de la page N (image) d'une épreuve publiée, si disponible. */
function epreuve_preview_image_path(array $ep, int $page = 1): ?string {
  $pdf = $ep['pdf_path'] ?? '';
  if ($pdf === '' || !is_file($pdf)) return null;
  $dir = dirname($pdf) . '/images';
  if (!is_dir($dir)) return null;
  $pad = str_pad((string)$page, 2, '0', STR_PAD_LEFT);
  foreach (['jpg', 'jpeg', 'png', 'webp'] as $ext) {
    $path = "$dir/$pad.$ext";
    if (is_file($path)) return $path;
  }
  return null;
}

function epreuve_images_dir(array $cfg, int $annee, string $type, string $id): string {
  $dir = epreuve_dir($cfg, $annee, $type, $id) . '/images';
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  return $dir;
}

/** Chemins autorisés pour l'explorateur admin (soumissions + epreuves). */
function archives_roots(array $cfg): array {
  return [
    ['id' => 'soumissions', 'label' => 'Soumissions en cours', 'path' => 'soumissions'],
    ['id' => 'epreuves', 'label' => 'Épreuves publiées', 'path' => 'epreuves'],
  ];
}

function archives_base_dir(array $cfg, string $root): ?string {
  if (!in_array($root, ['soumissions', 'epreuves'], true)) return null;
  $dir = "{$cfg['uploads_dir']}/$root";
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  return realpath($dir) ?: $dir;
}

/** Valide un chemin relatif (anti directory traversal). */
function archives_resolve_path(array $cfg, string $root, string $relative = ''): ?string {
  $base = archives_base_dir($cfg, $root);
  if (!$base) return null;
  $relative = str_replace('\\', '/', trim($relative, '/'));
  if ($relative === '' || $relative === '.') return $base;
  if (str_contains($relative, '..')) return null;
  $full = realpath("$base/$relative");
  if (!$full || !str_starts_with($full, $base)) return null;
  return $full;
}

/** Publie une soumission validée dans uploads/epreuves/{annee}/{type}/{id}/ */
function publish_soumission_to_epreuve(array $cfg, array $sub, string $newId): array {
  $annee = (int)$sub['annee'];
  $type = $sub['type'];
  $destPdf = epreuve_pdf_path($cfg, $annee, $type, $newId);
  $destImgDir = epreuve_images_dir($cfg, $annee, $type, $newId);

  if (!is_file($sub['pdf_preview_path'])) fail('PDF preview introuvable', 500);
  copy($sub['pdf_preview_path'], $destPdf);

  require_once __DIR__ . '/image-pdf.php';
  $images = $sub['images_json'] ?? '[]';
  if (is_string($images)) $images = json_decode($images, true) ?: [];
  $page = 0;
  foreach ($images as $src) {
    if (!is_file($src)) continue;
    $page++;
    $dest = "$destImgDir/" . str_pad((string)$page, 2, '0', STR_PAD_LEFT) . '.jpg';
    if (!fit_image_contain_a4_jpeg($src, $dest)) {
      $ext = pathinfo($src, PATHINFO_EXTENSION) ?: 'jpg';
      copy($src, "$destImgDir/" . str_pad((string)$page, 2, '0', STR_PAD_LEFT) . ".$ext");
    }
  }

  $pages = $page > 0 ? $page : pdf_page_count($destPdf);
  return [
    'pdf_path' => $destPdf,
    'pages' => $pages,
    'taille_ko' => (int)(filesize($destPdf) / 1024),
  ];
}

function list_archives_directory(array $cfg, string $root, string $relative = ''): array {
  $dir = archives_resolve_path($cfg, $root, $relative);
  $base = archives_base_dir($cfg, $root);
  if (!$dir || !$base || !is_dir($dir)) {
    return ['root' => $root, 'path' => $relative, 'folders' => [], 'files' => []];
  }

  $apiBase = rtrim($cfg['api_base_url'] ?? '', '/');
  $folders = [];
  $files = [];

  foreach (scandir($dir) ?: [] as $entry) {
    if ($entry === '.' || $entry === '..' || str_starts_with($entry, '.')) continue;
    $full = "$dir/$entry";
    $relPath = trim(($relative ? "$relative/" : '') . $entry, '/');
    if (is_dir($full)) {
      $label = ctype_digit($entry) ? "Année $entry" : type_folder_label($entry);
      $folders[] = ['name' => $entry, 'label' => $label, 'path' => $relPath];
    } else {
      $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
      $mimeType = match ($ext) {
        'pdf' => 'pdf',
        'jpg', 'jpeg', 'png', 'webp' => 'image',
        default => 'file',
      };
      $files[] = [
        'name' => $entry,
        'path' => "$root/$relPath",
        'relPath' => $relPath,
        'type' => $mimeType,
        'size' => (int)filesize($full),
        'url' => $apiBase . '/admin/archives/file?root=' . rawurlencode($root) . '&path=' . rawurlencode($relPath),
      ];
    }
  }

  usort($folders, function ($a, $b) {
    if (ctype_digit($a['name']) && ctype_digit($b['name'])) return (int)$b['name'] <=> (int)$a['name'];
    return strcasecmp($a['label'], $b['label']);
  });
  usort($files, fn($a, $b) => strcasecmp($a['name'], $b['name']));

  $breadcrumbs = [['label' => $root === 'epreuves' ? 'Épreuves publiées' : 'Soumissions', 'path' => '']];
  if ($relative !== '') {
    $parts = explode('/', $relative);
    $acc = '';
    foreach ($parts as $part) {
      $acc = $acc === '' ? $part : "$acc/$part";
      $label = ctype_digit($part) ? "Année $part" : type_folder_label($part);
      $breadcrumbs[] = ['label' => $label, 'path' => $acc];
    }
  }

  return [
    'root' => $root,
    'path' => $relative,
    'breadcrumbs' => $breadcrumbs,
    'folders' => $folders,
    'files' => $files,
  ];
}
