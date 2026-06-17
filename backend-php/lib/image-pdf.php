<?php
declare(strict_types=1);

/** A4 portrait (mm). */
const A4_MM_W = 210.0;
const A4_MM_H = 297.0;

/** A4 à 150 DPI — pour les miniatures JPEG. */
const A4_PX_W = 1240;
const A4_PX_H = 1754;

/** Marge blanche autour de l'image (comme CamScanner / iLovePDF). */
const A4_MARGIN_MM = 8.0;

/**
 * Charge une image (JPEG/PNG/WebP) via GD.
 * @return GdImage|null
 */
function gd_load_image(string $path) {
  if (!is_file($path)) return null;
  $info = @getimagesize($path);
  if (!$info) return null;
  return match ($info[2]) {
    IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
    IMAGETYPE_PNG => @imagecreatefrompng($path),
    IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : null,
    default => null,
  };
}

/**
 * Calcule position et taille (mm) pour afficher toute l'image sur A4 (object-fit: contain, centré).
 * @return array{x: float, y: float, w: float, h: float}
 */
function a4_contain_box(int $imgWPx, int $imgHPx, float $marginMm = A4_MARGIN_MM): array {
  if ($imgWPx < 1 || $imgHPx < 1) {
    return ['x' => $marginMm, 'y' => $marginMm, 'w' => A4_MM_W - 2 * $marginMm, 'h' => A4_MM_H - 2 * $marginMm];
  }

  $availW = A4_MM_W - 2 * $marginMm;
  $availH = A4_MM_H - 2 * $marginMm;
  $aspect = $imgWPx / $imgHPx;
  $availAspect = $availW / $availH;

  if ($aspect > $availAspect) {
    $w = $availW;
    $h = $availW / $aspect;
  } else {
    $h = $availH;
    $w = $availH * $aspect;
  }

  return [
    'x' => (A4_MM_W - $w) / 2,
    'y' => (A4_MM_H - $h) / 2,
    'w' => $w,
    'h' => $h,
  ];
}

/**
 * Génère une page A4 JPEG avec l'image entière centrée (sans rognage).
 */
function fit_image_contain_a4_jpeg(string $srcPath, string $destPath, int $quality = 92): bool {
  $src = gd_load_image($srcPath);
  if (!$src) return false;

  $sw = imagesx($src);
  $sh = imagesy($src);
  if ($sw < 1 || $sh < 1) { imagedestroy($src); return false; }

  $marginPx = (int)round(A4_MARGIN_MM / 25.4 * 150);
  $availW = A4_PX_W - 2 * $marginPx;
  $availH = A4_PX_H - 2 * $marginPx;
  $aspect = $sw / $sh;
  $availAspect = $availW / $availH;

  if ($aspect > $availAspect) {
    $dw = $availW;
    $dh = (int)round($availW / $aspect);
  } else {
    $dh = $availH;
    $dw = (int)round($availH * $aspect);
  }

  $dx = (int)round((A4_PX_W - $dw) / 2);
  $dy = (int)round((A4_PX_H - $dh) / 2);

  $dst = imagecreatetruecolor(A4_PX_W, A4_PX_H);
  imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));
  imagecopyresampled($dst, $src, $dx, $dy, 0, 0, $dw, $dh, $sw, $sh);
  imagedestroy($src);

  $ok = imagejpeg($dst, $destPath, $quality);
  imagedestroy($dst);
  return $ok;
}

/**
 * Assemble des images en PDF A4 multi-pages via FPDF (image entière, centrée).
 * @param string[] $imagePaths
 */
function images_to_pdf_a4(array $imagePaths, string $outPath): int {
  if (!$imagePaths) return 0;

  require_once __DIR__ . '/fpdf.php';
  $pdf = new FPDF('P', 'mm', 'A4');
  $count = 0;

  foreach ($imagePaths as $path) {
    if (!is_file($path)) continue;
    $info = @getimagesize($path);
    if (!$info || $info[0] < 1 || $info[1] < 1) continue;

    $box = a4_contain_box($info[0], $info[1]);
    $pdf->AddPage();
    $pdf->Image($path, $box['x'], $box['y'], $box['w'], $box['h']);
    $count++;
  }

  if ($count < 1) return 0;
  $pdf->Output('F', $outPath);
  return $count;
}

/** @deprecated Utiliser fit_image_contain_a4_jpeg — conservé pour compatibilité interne. */
function fit_image_to_a4_jpeg(string $srcPath, string $destPath, int $quality = 92): bool {
  return fit_image_contain_a4_jpeg($srcPath, $destPath, $quality);
}

/** Estime le nombre de pages d'un PDF (sans dépendance externe). */
function pdf_page_count(string $path): int {
  if (!is_file($path)) return 1;
  $content = @file_get_contents($path);
  if ($content === false || $content === '') return 1;
  if (preg_match('/\/Type\s*\/Pages[^s].*?\/Count\s+(\d+)/s', $content, $m)) {
    return max(1, (int)$m[1]);
  }
  $n = preg_match_all('/\/Type\s*\/Page[^s]/', $content);
  return max(1, $n ?: 1);
}

/** Vérifie qu'un fichier uploadé est un PDF valide. */
function validate_uploaded_pdf(array $file, int $maxBytes = 15 * 1024 * 1024): void {
  if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) fail('Fichier PDF invalide');
  $tmp = $file['tmp_name'] ?? '';
  if (!$tmp || !is_uploaded_file($tmp)) fail('Fichier PDF invalide');
  $mime = mime_content_type($tmp) ?: '';
  $name = strtolower((string)($file['name'] ?? ''));
  if (!str_contains($mime, 'pdf') && !str_ends_with($name, '.pdf')) fail('Le fichier doit être un PDF');
  $head = @file_get_contents($tmp, false, null, 0, 5);
  if ($head !== '%PDF-') fail('Le fichier doit être un PDF valide');
  if (($file['size'] ?? 0) > $maxBytes) fail('PDF trop lourd (15 Mo max)');
}
