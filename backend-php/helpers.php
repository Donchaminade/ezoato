<?php
// backend-php/helpers.php
declare(strict_types=1);

ini_set('default_charset', 'UTF-8');
if (function_exists('mb_internal_encoding')) {
  mb_internal_encoding('UTF-8');
}

function load_config(): array {
  $local = __DIR__ . '/config.local.php';
  return require (is_file($local) ? $local : __DIR__ . '/config.php');
}

function db(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;
  $cfg = load_config();
  $pdo = new PDO($cfg['db']['dsn'], $cfg['db']['user'], $cfg['db']['pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci',
  ]);
  return $pdo;
}

/** Nettoie et normalise le texte UTF-8 (espaces, forme Unicode). */
function normalize_text(string $text): string {
  $text = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
  if ($text === '') return '';
  if (class_exists('Normalizer')) {
    $n = Normalizer::normalize($text, Normalizer::FORM_C);
    if (is_string($n) && $n !== '') $text = $n;
  }
  return $text;
}

/** Noms de villes souvent saisis sans accent. */
function repair_ville_display(string $ville): string {
  $ville = repair_mojibake($ville);
  if ($ville === '') return '';
  $aliases = [
    'lome' => 'Lomé',
    'lomé' => 'Lomé',
    'sokode' => 'Sokodé',
    'sokodé' => 'Sokodé',
    'aneho' => 'Aného',
    'aného' => 'Aného',
    'kara' => 'Kara',
    'dapaong' => 'Dapaong',
  ];
  $key = mb_strtolower($ville, 'UTF-8');
  return $aliases[$key] ?? $ville;
}

/** Remplace les « ? » qui ont effacé des accents (import CSV / charset). */
function repair_lost_accent_marks(string $text): string {
  if (!str_contains($text, '?')) return $text;
  $pairs = [
    'Lyc?e' => 'Lycée',
    'Coll?ge' => 'Collège',
    'F?vrier' => 'Février',
    'Ani?' => 'Anié',
    'Adidogom?' => 'Adidogomé',
    'Sokod?' => 'Sokodé',
    'Lom?' => 'Lomé',
    'An?ho' => 'Aného',
    'Ts?vi?' => 'Tsévié',
    'K?v?' => 'Kévé',
    'Atakpam?' => 'Atakpamé',
    'Kpalim?' => 'Kpalimé',
    'Math?matiques' => 'Mathématiques',
    'Math?ºmatiques' => 'Mathématiques',
    'Fran?ais' => 'Français',
    'Fran?ºais' => 'Français',
    'Histoire-G?ographie' => 'Histoire-Géographie',
    'Histoire-G?ºographie' => 'Histoire-Géographie',
    '1?re' => '1ère',
    '1?ºre' => '1ère',
  ];
  foreach ($pairs as $bad => $good) {
    $text = str_replace($bad, $good, $text);
  }
  return $text;
}

/**
 * Corrige le mojibake « console » (UTF-8 importé avec mauvais charset MySQL).
 * Motif typique : ├® → é, ├ë → É, Ô£ô → ✓ (octets UTF-8 affichés en box-drawing).
 */
function repair_console_utf8_mojibake(string $text): string {
  static $pairs = [
    '├®' => 'é',
    '├ë' => 'É',
    '├¨' => 'è',
    '├¿' => 'è',
    '├ª' => 'ê',
    '├¬' => 'ê',
    '├½' => 'ë',
    '├§' => 'ç',
    '├º' => 'ç',
    '├«' => 'î',
    '├»' => 'ï',
    '├ ' => 'à',
    '├á' => 'à',
    '├ó' => 'â',
    '├┤' => 'ô',
    '├¶' => 'ö',
    '├╗' => 'û',
    '├╣' => 'ù',
    'ÔåÆ' => '→',
    'ÔÇÖ' => "'",
    'ÔÇô' => '–',
    'Ô£ô' => '✓',
    '┬½' => '«',
    '┬╗' => '»',
    "┬\u{2557}" => '»',
    'ÔÇö' => '—',
    'ÔÇ£' => '«',
    'ÔÇ¥' => '»',
    'ÔÇ™' => "'",
  ];
  return str_replace(array_keys($pairs), array_values($pairs), $text);
}

/** Nettoie les résidus d'une conversion mojibake partielle (?®, é®, etc.). */
function repair_mojibake_artifacts(string $text): string {
  $text = repair_console_utf8_mojibake($text);
  $text = preg_replace('/\?®/u', 'é', $text) ?? $text;
  $text = preg_replace('/é®/u', 'é', $text) ?? $text;
  // Résidus lossy : « ├X » dont le ├ est devenu « ? » lors d'une conversion partielle.
  $lossy = [
    '?¿' => 'è',
    '?º' => 'ç',
    '?«' => 'î',
    '?á' => 'à',
    '?¬' => 'ê',
    '?ó' => 'â',
    '?»' => 'ï',
  ];
  $text = str_replace(array_keys($lossy), array_values($lossy), $text);
  $text = preg_replace('/(?<=[A-Za-zÀ-ÿ])\®/u', '', $text) ?? $text;
  $pairs = [
    'Ô£ô' => '✓',
    'â€™' => "'",
    'â€œ' => '«',
    'â€\x9d' => '»',
    'â€"' => '—',
    'â€"' => '–',
  ];
  return str_replace(array_keys($pairs), array_values($pairs), $text);
}

/** Indique si une chaîne ressemble à du mojibake (UTF-8 mal interprété). */
function looks_like_mojibake(string $text): bool {
  return (bool)preg_match('/├|┬|Ã|Â|Ô|â€™|â€"|â€"|ï¿½|¬½|¶|½/u', $text);
}

/** UTF-8 lu comme Latin-1 : chaque caractère U+00xx redevient un octet, puis décodé en UTF-8. */
function repair_utf8_as_latin1_bytes(string $text): ?string {
  $bytes = '';
  $len = mb_strlen($text, 'UTF-8');
  for ($i = 0; $i < $len; $i++) {
    $code = mb_ord(mb_substr($text, $i, 1, 'UTF-8'), 'UTF-8');
    if ($code === false || $code > 255) return null;
    $bytes .= chr($code);
  }
  return mb_check_encoding($bytes, 'UTF-8') ? $bytes : null;
}

/** Corrige le mojibake courant (UTF-8 lu comme Latin-1 / CP1252) et les « ? » accentués. */
function repair_mojibake(string $text): string {
  $text = trim($text);
  if ($text === '') return '';
  $text = repair_console_utf8_mojibake($text);
  if (looks_like_mojibake($text)) {
    $fromBytes = repair_utf8_as_latin1_bytes($text);
    if (is_string($fromBytes) && $fromBytes !== '' && !looks_like_mojibake($fromBytes)) {
      $text = $fromBytes;
    } else {
      foreach (['ISO-8859-1', 'Windows-1252'] as $enc) {
        $bytes = @mb_convert_encoding($text, $enc, 'UTF-8');
        if (!is_string($bytes) || $bytes === '') continue;
        $repaired = @mb_convert_encoding($bytes, 'UTF-8', $enc);
        if (!is_string($repaired) || $repaired === '') continue;
        $repaired = repair_mojibake_artifacts($repaired);
        if (!looks_like_mojibake($repaired)) {
          $text = $repaired;
          break;
        }
      }
      if (looks_like_mojibake($text)) {
        foreach (['Windows-1252', 'ISO-8859-1'] as $enc) {
          $repaired = @mb_convert_encoding($text, 'UTF-8', $enc);
          if (!is_string($repaired) || $repaired === '' || $repaired === $text) continue;
          $repaired = repair_mojibake_artifacts($repaired);
          if (!looks_like_mojibake($repaired)) {
            $text = $repaired;
            break;
          }
        }
      }
    }
  }
  $text = repair_mojibake_artifacts($text);
  $text = repair_lost_accent_marks($text);
  return normalize_text($text);
}

function repair_display_text(?string $text): ?string {
  if ($text === null || $text === '') return $text;
  return repair_mojibake($text);
}

/** Nom canonique UTF-8 pour stockage / comparaison des référentiels. */
function canonical_referentiel_nom(string $nom, bool $ville = false): string {
  $nom = normalize_text($nom);
  if ($nom === '') return '';
  return $ville ? repair_ville_display($nom) : (repair_display_text($nom) ?? $nom);
}

/**
 * Résout le nom brut en base à partir d'une clé API ou d'un libellé affiché.
 * Indispensable quand l'UI envoie le texte réparé alors que la BDD contient du mojibake.
 */
function resolve_referentiel_nom(string $table, string $inputNom, ?string $niveau = null): ?string {
  if (!in_array($table, ['matieres', 'villes', 'classes'], true)) return null;
  $inputNom = normalize_text($inputNom);
  if ($inputNom === '') return null;
  $inputCanon = canonical_referentiel_nom($inputNom, $table === 'villes');

  if ($table === 'classes') {
    if ($niveau === null || !in_array($niveau, ['college', 'lycee'], true)) return null;
    $stmt = db()->prepare('SELECT nom FROM classes WHERE niveau = ?');
    $stmt->execute([$niveau]);
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
  } else {
    $rows = db()->query("SELECT nom FROM {$table}")->fetchAll(PDO::FETCH_COLUMN);
  }

  $exactRaw = null;
  $canonRaw = null;
  foreach ($rows as $raw) {
    if (normalize_text((string)$raw) === $inputNom) {
      $exactRaw = (string)$raw;
    }
    $canon = canonical_referentiel_nom((string)$raw, $table === 'villes');
    if ($canon === $inputCanon) {
      $canonRaw = (string)$raw;
    }
  }
  return $exactRaw ?? $canonRaw;
}

/** { key: nom brut BDD, label: libellé affiché } — déduplique les variantes d'encodage. */
function map_referentiel_items(array $rawNames, bool $ville = false): array {
  $byLabel = [];
  foreach ($rawNames as $raw) {
    $raw = (string)$raw;
    $label = $ville ? repair_ville_display($raw) : (repair_display_text($raw) ?? $raw);
    $labelKey = mb_strtolower(normalize_text($label), 'UTF-8');
    $canonical = canonical_referentiel_nom($raw, $ville);
    $score = ($raw === $canonical) ? 2 : (str_contains($raw, '?') ? 0 : 1);
    if (!isset($byLabel[$labelKey]) || $score > $byLabel[$labelKey]['score']) {
      $byLabel[$labelKey] = ['key' => $raw, 'label' => $label, 'score' => $score];
    }
  }
  $items = array_values($byLabel);
  usort($items, fn($a, $b) => strcmp($a['label'], $b['label']));
  return array_map(fn($x) => ['key' => $x['key'], 'label' => $x['label']], $items);
}

/** Ville : saisie libre normalisée (l'admin peut corriger à la validation). */
function normalize_ville(string $ville): string {
  return normalize_text($ville);
}

/** Classes par défaut si la table n'existe pas encore. */
function default_meta_classes(): array {
  return [
    'college' => ['6e', '5e', '4e', '3e'],
    'lycee' => [
      '2nde A', '2nde C', '1ère A', '1ère C', '1ère D', 'Tle A1', 'Tle A2', 'Tle C', 'Tle D',
      '2nde E', '1ère E', 'Tle E',
      '2nde F1', '1ère F1', 'Tle F1',
      '2nde F2', '1ère F2', 'Tle F2',
      '2nde F3', '1ère F3', 'Tle F3',
      '2nde F4', '1ère F4', 'Tle F4',
      '2nde H', '1ère H', 'Tle H',
      '2nde TI', '1ère TI', 'Tle TI',
      '2nde G1', '1ère G1', 'Tle G1',
      '2nde G2', '1ère G2', 'Tle G2',
      '2nde G3', '1ère G3', 'Tle G3',
    ],
  ];
}

/** Liste des classes depuis la base (collège / lycée). */
function load_meta_classes(): array {
  if (!table_exists('classes')) {
    return default_meta_classes();
  }
  $rows = db()->query('SELECT nom, niveau FROM classes ORDER BY ordre ASC, nom ASC')->fetchAll();
  $out = ['college' => [], 'lycee' => []];
  foreach ($rows as $row) {
    $niveau = $row['niveau'] ?? '';
    if (!isset($out[$niveau])) continue;
    $out[$niveau][] = repair_display_text($row['nom'] ?? '') ?? $row['nom'];
  }
  if (!$out['college'] && !$out['lycee']) {
    return default_meta_classes();
  }
  return $out;
}

/** Toutes les classes valides (collège + lycée). */
function all_meta_class_names(): array {
  $classes = load_meta_classes();
  return array_values(array_unique(array_merge(
    $classes['college'] ?? [],
    $classes['lycee'] ?? [],
  )));
}

/** Valide et normalise la classe utilisateur contre les référentiels. */
function validate_user_classe(?string $classe, bool $required = false): ?string {
  $classe = trim((string)($classe ?? ''));
  if ($classe === '') {
    if ($required) fail('Classe requise');
    return null;
  }
  foreach (all_meta_class_names() as $allowed) {
    if ($allowed === $classe) return $classe;
  }
  fail('Classe invalide');
}

/** Valide et normalise l'établissement utilisateur (texte libre). */
function validate_user_etablissement(?string $etablissement, bool $required = false): ?string {
  $etablissement = trim((string)($etablissement ?? ''));
  if ($etablissement === '') {
    if ($required) fail('Établissement requis');
    return null;
  }
  if (mb_strlen($etablissement) > 180) fail('Établissement trop long (180 caractères max)');
  return repair_display_text($etablissement) ?? $etablissement;
}

/** Représentation publique d'un utilisateur (auth / profil). */
function map_auth_user(array $u): array {
  return [
    'id' => $u['id'],
    'nom' => $u['nom'],
    'email' => $u['email'],
    'telephone' => $u['telephone'] ?? null,
    'role' => $u['role'],
    'ville' => $u['ville'] ?? null,
    'classe' => isset($u['classe']) ? (repair_display_text($u['classe'] ?? '') ?: null) : null,
    'etablissement' => isset($u['etablissement']) ? (repair_display_text($u['etablissement'] ?? '') ?: null) : null,
  ];
}

/** Classes admin avec clé brute + libellé affiché. */
function load_admin_class_items(): array {
  if (!table_exists('classes')) {
    $defaults = default_meta_classes();
    $map = fn(array $names, string $niveau) => array_map(
      fn($nom) => ['key' => $nom, 'label' => repair_display_text($nom) ?? $nom],
      $names,
    );
    return [
      'college' => $map($defaults['college'], 'college'),
      'lycee' => $map($defaults['lycee'], 'lycee'),
    ];
  }
  $rows = db()->query('SELECT nom, niveau FROM classes ORDER BY ordre ASC, nom ASC')->fetchAll();
  $rawByNiveau = ['college' => [], 'lycee' => []];
  foreach ($rows as $row) {
    $niveau = $row['niveau'] ?? '';
    if (!isset($rawByNiveau[$niveau])) continue;
    $rawByNiveau[$niveau][] = $row['nom'];
  }
  return [
    'college' => map_referentiel_items($rawByNiveau['college']),
    'lycee' => map_referentiel_items($rawByNiveau['lycee']),
  ];
}

/** Référentiels admin (matières, villes, classes). */
function load_admin_referentiels(): array {
  $db = db();
  $villes = $db->query('SELECT nom FROM villes ORDER BY nom')->fetchAll(PDO::FETCH_COLUMN);
  $matieres = $db->query('SELECT nom FROM matieres ORDER BY nom')->fetchAll(PDO::FETCH_COLUMN);
  return [
    'villes' => map_referentiel_items($villes, true),
    'matieres' => map_referentiel_items($matieres),
    'classes' => load_admin_class_items(),
    'dbReady' => table_exists('classes'),
  ];
}

/** Applique les corrections admin sur une soumission avant publication. */
function apply_soumission_corrections(string $id, array $sub, array $body): array {
  $updates = [];
  if (array_key_exists('ville', $body)) {
    $v = normalize_ville((string)$body['ville']);
    if ($v !== '' && $v !== ($sub['ville'] ?? '')) {
      $updates['ville'] = $v;
      $sub['ville'] = $v;
    }
  }
  if (array_key_exists('titre', $body)) {
    $t = normalize_text((string)$body['titre']);
    if ($t !== '' && $t !== ($sub['titre'] ?? '')) {
      $updates['titre'] = $t;
      $sub['titre'] = $t;
    }
  }
  if ($updates) {
    $sets = [];
    $params = [];
    foreach ($updates as $col => $val) {
      $sets[] = "$col=?";
      $params[] = $val;
    }
    $params[] = $id;
    db()->prepare('UPDATE soumissions SET ' . implode(', ', $sets) . ' WHERE id=?')->execute($params);
  }
  return $sub;
}

function cors(): void {
  $cfg = load_config();
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if (in_array($origin, $cfg['allowed_origins'], true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
  }
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
  if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
}

function json_input(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw ?: '[]', true);
  return is_array($data) ? $data : [];
}

function json_out($data, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function fail(string $msg, int $code = 400): void { json_out(['error' => $msg], $code); }

function table_exists(string $table): bool {
  if (!preg_match('/^[a-z_][a-z0-9_]*$/', $table)) return false;
  $pdo = db();
  $schema = $pdo->query('SELECT DATABASE()')->fetchColumn();
  if (is_string($schema) && $schema !== '') {
    $stmt = $pdo->prepare(
      'SELECT COUNT(*) FROM information_schema.tables
       WHERE table_schema = ? AND table_name = ?'
    );
    $stmt->execute([$schema, $table]);
    if ((int)$stmt->fetchColumn() > 0) return true;
  }
  $stmt = $pdo->query('SHOW TABLES LIKE ' . $pdo->quote($table));
  return (bool)$stmt->fetchColumn();
}

/** Numéro togolais normalisé (8 chiffres locaux, ex. 90123456). */
function normalize_phone(string $raw): string {
  $digits = preg_replace('/\D/', '', $raw);
  if (str_starts_with($digits, '00228') && strlen($digits) >= 13) {
    $digits = substr($digits, 5);
  } elseif (str_starts_with($digits, '228') && strlen($digits) >= 11) {
    $digits = substr($digits, 3);
  }
  return $digits;
}

function uuid(): string {
  $d = random_bytes(16);
  $d[6] = chr((ord($d[6]) & 0x0f) | 0x40);
  $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
}

function generate_temp_password(int $length = 12): string {
  $chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  $max = strlen($chars) - 1;
  $pwd = '';
  for ($i = 0; $i < $length; $i++) {
    $pwd .= $chars[random_int(0, $max)];
  }
  return $pwd;
}

function log_admin_action(string $actorId, string $action, ?string $targetId = null, ?string $details = null): void {
  if (!table_exists('admin_actions')) return;
  db()->prepare('INSERT INTO admin_actions (id, actor_id, target_id, action, details) VALUES (?,?,?,?,?)')
      ->execute([uuid(), $actorId, $targetId, $action, $details]);
}

// --- JWT minimal HS256 ---
function jwt_encode(array $payload): string {
  $cfg = require __DIR__ . '/config.php';
  $h = b64u(json_encode(['alg'=>'HS256','typ'=>'JWT']));
  $p = b64u(json_encode($payload));
  $s = b64u(hash_hmac('sha256', "$h.$p", $cfg['jwt_secret'], true));
  return "$h.$p.$s";
}
function jwt_decode(string $token): ?array {
  $cfg = require __DIR__ . '/config.php';
  $parts = explode('.', $token);
  if (count($parts) !== 3) return null;
  [$h,$p,$s] = $parts;
  $expected = b64u(hash_hmac('sha256', "$h.$p", $cfg['jwt_secret'], true));
  if (!hash_equals($expected, $s)) return null;
  $payload = json_decode(b64u_dec($p), true);
  if (!is_array($payload)) return null;
  if (isset($payload['exp']) && $payload['exp'] < time()) return null;
  return $payload;
}
function b64u(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function b64u_dec(string $s): string {
  return base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4));
}

/** Récupère l'en-tête Authorization (Apache/XAMPP ne le passe pas toujours à PHP). */
function auth_bearer_header(): string {
  if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
    return (string)$_SERVER['HTTP_AUTHORIZATION'];
  }
  if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    return (string)$_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
  }
  if (function_exists('getallheaders')) {
    foreach (getallheaders() ?: [] as $key => $value) {
      if (strcasecmp((string)$key, 'Authorization') === 0) {
        return (string)$value;
      }
    }
  }
  if (function_exists('apache_request_headers')) {
    foreach (apache_request_headers() ?: [] as $key => $value) {
      if (strcasecmp((string)$key, 'Authorization') === 0) {
        return (string)$value;
      }
    }
  }
  return '';
}

function current_user(): ?array {
  $h = auth_bearer_header();
  if (!preg_match('/Bearer\s+(.+)/i', $h, $m)) return null;
  $payload = jwt_decode($m[1]);
  if (!$payload) return null;
  $stmt = db()->prepare('SELECT id, nom, email, telephone, role, ville, classe, etablissement FROM users WHERE id = ?');
  $stmt->execute([$payload['sub']]);
  $row = $stmt->fetch();
  return $row ? map_auth_user($row) : null;
}

function require_user(array $roles = []): array {
  $u = current_user();
  if (!$u) fail('Non authentifié', 401);
  if ($roles && !in_array($u['role'], $roles, true)) fail('Accès refusé', 403);
  return $u;
}

function cfg(): array {
  static $c = null;
  return $c ??= load_config();
}

function map_epreuve(array $row): array {
  $cfg = cfg();
  $base = rtrim($cfg['api_base_url'] ?? '', '/');
  require_once __DIR__ . '/lib/storage-paths.php';
  $mapped = [
    'id' => $row['id'],
    'titre' => repair_display_text($row['titre'] ?? '') ?? '',
    'matiere' => repair_display_text($row['matiere'] ?? '') ?? '',
    'niveau' => $row['niveau'],
    'classe' => repair_display_text($row['classe'] ?? '') ?? '',
    'annee' => (int)$row['annee'],
    'type' => $row['type'],
    'periode' => $row['periode'] ?? null,
    'examen' => $row['examen'] ?? null,
    'etablissement' => repair_display_text($row['etablissement'] ?? null),
    'ville' => repair_ville_display($row['ville'] ?? ''),
    'pdfUrl' => $base . '/epreuves/' . $row['id'] . '/download',
    'pdfPreviewUrl' => $base . '/epreuves/' . $row['id'] . '/preview?full=1',
    'pages' => (int)($row['pages'] ?? 0),
    'tailleKo' => (int)($row['taille_ko'] ?? $row['tailleKo'] ?? 0),
    'telechargements' => (int)($row['telechargements'] ?? 0),
    'soumisPar' => $row['soumis_par'] ?? $row['soumisPar'] ?? '',
    'soumisLe' => isset($row['soumis_le']) ? date('c', strtotime($row['soumis_le'])) : ($row['soumisLe'] ?? ''),
    'valideLe' => isset($row['valide_le']) && $row['valide_le'] ? date('c', strtotime($row['valide_le'])) : ($row['valideLe'] ?? null),
    'statut' => $row['statut'],
    'epreuveParentId' => $row['epreuve_parent_id'] ?? null,
  ];
  if (epreuve_preview_image_path($row, 1)) {
    $mapped['thumbnailUrl'] = $base . '/epreuves/' . $row['id'] . '/preview';
  }
  $mapped['requiresPayment'] = requires_payment($row);
  $mapped['prixFcfa'] = prix_epreuve($row);
  return $mapped;
}

/** Paramètres plateforme (DB platform_settings ou config.php). */
function platform_settings_defaults(): array {
  $cfg = cfg();
  $contact = $cfg['contact'] ?? [];
  $examen = (int)$cfg['paiement']['montant_examen'];
  return [
    'prix_examen_national' => $examen,
    'prix_corrige_type' => (int)($cfg['paiement']['montant_corrige'] ?? ($examen * 2)),
    'epreuves_par_recompense' => (int)$cfg['contributeur']['epreuves_par_recompense'],
    'montant_recompense' => (int)$cfg['contributeur']['montant_recompense'],
    'min_retrait' => (int)$cfg['contributeur']['min_retrait'],
    'promo_active' => false,
    'promo_libelle' => null,
    'promo_pourcentage' => null,
    'promo_prix_fixe' => null,
    'promo_debut' => null,
    'promo_fin' => null,
    'promo_applique_examens' => true,
    'promo_applique_corriges' => false,
    'contact_email' => (string)($contact['email'] ?? ''),
    'contact_telephone' => (string)($contact['telephone'] ?? ''),
    'contact_whatsapp' => (string)($contact['whatsapp'] ?? ''),
    'contact_adresse' => (string)($contact['adresse'] ?? ''),
    'contact_horaires' => (string)($contact['horaires'] ?? ''),
    'updated_at' => null,
    'updated_by' => null,
  ];
}

function load_platform_settings(): array {
  $settings = platform_settings_defaults();
  if (!table_exists('platform_settings')) {
    return $settings;
  }

  $row = db()->query('SELECT * FROM platform_settings WHERE id = 1')->fetch();
  if (!$row) return $settings;

  $examen = (int)$row['prix_examen_national'];
  return array_merge($settings, [
    'prix_examen_national' => $examen,
    'prix_corrige_type' => $row['prix_corrige_type'] !== null
      ? (int)$row['prix_corrige_type']
      : $examen * 2,
    'epreuves_par_recompense' => (int)$row['epreuves_par_recompense'],
    'montant_recompense' => (int)$row['montant_recompense'],
    'min_retrait' => (int)$row['min_retrait'],
    'promo_active' => (bool)$row['promo_active'],
    'promo_libelle' => $row['promo_libelle'],
    'promo_pourcentage' => $row['promo_pourcentage'] !== null ? (int)$row['promo_pourcentage'] : null,
    'promo_prix_fixe' => $row['promo_prix_fixe'] !== null ? (int)$row['promo_prix_fixe'] : null,
    'promo_debut' => $row['promo_debut'],
    'promo_fin' => $row['promo_fin'],
    'promo_applique_examens' => (bool)$row['promo_applique_examens'],
    'promo_applique_corriges' => (bool)$row['promo_applique_corriges'],
    'contact_email' => array_key_exists('contact_email', $row)
      ? (string)($row['contact_email'] ?? '')
      : $settings['contact_email'],
    'contact_telephone' => array_key_exists('contact_telephone', $row)
      ? (string)($row['contact_telephone'] ?? '')
      : $settings['contact_telephone'],
    'contact_whatsapp' => array_key_exists('contact_whatsapp', $row)
      ? (string)($row['contact_whatsapp'] ?? '')
      : $settings['contact_whatsapp'],
    'contact_adresse' => array_key_exists('contact_adresse', $row)
      ? (string)($row['contact_adresse'] ?? '')
      : $settings['contact_adresse'],
    'contact_horaires' => array_key_exists('contact_horaires', $row)
      ? (string)($row['contact_horaires'] ?? '')
      : $settings['contact_horaires'],
    'updated_at' => $row['updated_at'],
    'updated_by' => $row['updated_by'],
  ]);
}

function contact_public(): array {
  $s = load_platform_settings();
  return [
    'email' => (string)($s['contact_email'] ?? ''),
    'telephone' => (string)($s['contact_telephone'] ?? ''),
    'whatsapp' => (string)($s['contact_whatsapp'] ?? ''),
    'adresse' => (string)($s['contact_adresse'] ?? ''),
    'horaires' => (string)($s['contact_horaires'] ?? ''),
  ];
}

function promo_is_active(array $settings): bool {
  if (empty($settings['promo_active'])) return false;
  $now = time();
  if (!empty($settings['promo_debut']) && strtotime((string)$settings['promo_debut']) > $now) return false;
  if (!empty($settings['promo_fin']) && strtotime((string)$settings['promo_fin']) < $now) return false;
  return true;
}

function effective_price(int $base, array $settings, string $kind): int {
  if ($base <= 0) return 0;
  if (!promo_is_active($settings)) return $base;
  if ($kind === 'examen' && empty($settings['promo_applique_examens'])) return $base;
  if ($kind === 'corrige' && empty($settings['promo_applique_corriges'])) return $base;

  if (!empty($settings['promo_prix_fixe'])) {
    return max(1, (int)$settings['promo_prix_fixe']);
  }
  $pct = (int)($settings['promo_pourcentage'] ?? 0);
  if ($pct > 0 && $pct < 100) {
    return max(1, (int)round($base * (100 - $pct) / 100));
  }
  return $base;
}

function pricing_public(): array {
  $s = load_platform_settings();
  $baseExamen = (int)$s['prix_examen_national'];
  $baseCorrige = (int)$s['prix_corrige_type'];
  $effExamen = effective_price($baseExamen, $s, 'examen');
  $effCorrige = effective_price($baseCorrige, $s, 'corrige');
  $promoOn = promo_is_active($s);

  $promo = null;
  if ($promoOn) {
    $promo = [
      'active' => true,
      'label' => $s['promo_libelle'],
      'pourcentage' => $s['promo_pourcentage'],
      'prixFixe' => $s['promo_prix_fixe'],
      'fin' => $s['promo_fin'] ? date('c', strtotime((string)$s['promo_fin'])) : null,
      'appliqueExamens' => (bool)$s['promo_applique_examens'],
      'appliqueCorriges' => (bool)$s['promo_applique_corriges'],
    ];
  }

  return [
    'prixExamenNational' => $baseExamen,
    'prixCorrigeType' => $baseCorrige,
    'prixExamenEffectif' => $effExamen,
    'prixCorrigeEffectif' => $effCorrige,
    'promo' => $promo,
    'epreuvesParRecompense' => (int)$s['epreuves_par_recompense'],
    'montantRecompense' => (int)$s['montant_recompense'],
    'minRetrait' => (int)$s['min_retrait'],
    'abonnementMontant' => subscription_price(),
    'abonnementDureeMois' => subscription_duration_months(),
  ];
}

function map_platform_settings_admin(array $s): array {
  return [
    'prixExamenNational' => (int)$s['prix_examen_national'],
    'prixCorrigeType' => (int)$s['prix_corrige_type'],
    'epreuvesParRecompense' => (int)$s['epreuves_par_recompense'],
    'montantRecompense' => (int)$s['montant_recompense'],
    'minRetrait' => (int)$s['min_retrait'],
    'promo' => [
      'active' => (bool)$s['promo_active'],
      'label' => $s['promo_libelle'],
      'pourcentage' => $s['promo_pourcentage'],
      'prixFixe' => $s['promo_prix_fixe'],
      'debut' => $s['promo_debut'] ? date('c', strtotime((string)$s['promo_debut'])) : null,
      'fin' => $s['promo_fin'] ? date('c', strtotime((string)$s['promo_fin'])) : null,
      'appliqueExamens' => (bool)$s['promo_applique_examens'],
      'appliqueCorriges' => (bool)$s['promo_applique_corriges'],
    ],
    'pricingEffectif' => pricing_public(),
    'contact' => contact_public(),
    'updatedAt' => $s['updated_at'] ? date('c', strtotime((string)$s['updated_at'])) : null,
  ];
}

function public_stats(): array {
  $db = db();
  return [
    'epreuvesValidees' => (int)$db->query("SELECT COUNT(*) FROM epreuves WHERE statut='validee' AND type != 'corrige'")->fetchColumn(),
    'etablissements' => (int)$db->query('SELECT COUNT(*) FROM etablissements')->fetchColumn(),
    'telechargements' => (int)$db->query('SELECT COUNT(*) FROM telechargements')->fetchColumn(),
    'contributeurs' => (int)$db->query("SELECT COUNT(DISTINCT soumis_par) FROM soumissions WHERE statut='validee'")->fetchColumn(),
  ];
}

function prix_epreuve(array $epreuve): int {
  $s = load_platform_settings();
  $type = $epreuve['type'] ?? '';
  if ($type === 'corrige') {
    $base = (int)$s['prix_corrige_type'];
    return effective_price($base, $s, 'corrige');
  }
  if (requires_payment($epreuve)) {
    $base = (int)$s['prix_examen_national'];
    return effective_price($base, $s, 'examen');
  }
  return 0;
}

function requires_payment(array $epreuve): bool {
  if (($epreuve['type'] ?? '') === 'corrige') return true;
  return ($epreuve['type'] ?? '') === 'examen' && !empty($epreuve['examen']);
}

function get_corrige_type(string $parentId): ?array {
  $stmt = db()->prepare("SELECT e.*, et.nom AS etablissement FROM epreuves e
    LEFT JOIN etablissements et ON et.id = e.etablissement_id
    WHERE e.epreuve_parent_id = ? AND e.type = 'corrige' AND e.statut = 'validee' LIMIT 1");
  $stmt->execute([$parentId]);
  $row = $stmt->fetch();
  if (!$row) return null;
  $m = map_epreuve($row);
  return [
    'id' => $m['id'],
    'titre' => $m['titre'],
    'pages' => $m['pages'],
    'tailleKo' => $m['tailleKo'],
    'prixFcfa' => $m['prixFcfa'],
    'requiresPayment' => true,
    'telechargements' => $m['telechargements'],
  ];
}

function map_soumission(array $row): array {
  $cfg = cfg();
  $base = rtrim($cfg['api_base_url'] ?? '', '/');
  $doublons = $row['doublons_json'] ?? null;
  if (is_string($doublons)) $doublons = json_decode($doublons, true);
  $imagesRaw = $row['images_json'] ?? '[]';
  if (is_string($imagesRaw)) $imagesRaw = json_decode($imagesRaw, true) ?: [];
  $imageUrls = [];
  foreach ($imagesRaw as $path) {
    $name = basename((string)$path);
    $imageUrls[] = $base . '/admin/soumissions/' . $row['id'] . '/image/' . rawurlencode($name);
  }
  $pageCount = count($imageUrls);
  if ($pageCount === 0 && !empty($row['pdf_preview_path']) && is_file($row['pdf_preview_path'])) {
    require_once __DIR__ . '/lib/image-pdf.php';
    $pageCount = pdf_page_count($row['pdf_preview_path']);
  }
  $annee = (int)$row['annee'];
  $type = $row['type'] ?? '';
  require_once __DIR__ . '/lib/storage-paths.php';
  return [
    'id' => $row['id'],
    'titre' => repair_display_text($row['titre'] ?? '') ?? '',
    'matiere' => repair_display_text($row['matiere'] ?? '') ?? '',
    'niveau' => $row['niveau'],
    'classe' => repair_display_text($row['classe'] ?? '') ?? '',
    'annee' => $annee,
    'type' => $type,
    'periode' => $row['periode'] ?? null,
    'examen' => $row['examen'] ?? null,
    'etablissement' => repair_display_text($row['etablissement'] ?? null),
    'ville' => repair_ville_display($row['ville'] ?? ''),
    'images' => $imageUrls,
    'pages' => $pageCount ?: null,
    'storagePath' => "soumissions/$annee/" . type_folder($type) . '/' . $row['id'],
    'pdfPreviewUrl' => $base . '/admin/soumissions/' . $row['id'] . '/preview',
    'soumisPar' => $row['auteur'] ?? $row['soumis_par'] ?? '',
    'soumisLe' => date('c', strtotime($row['soumis_le'])),
    'statut' => $row['statut'],
    'motifRejet' => $row['motif_rejet'] ?? null,
    'doublonsPotentiels' => $doublons ?: null,
  ];
}

function paid_access_months(): int {
  $months = (int)(cfg()['paiement']['access_months'] ?? 6);
  return max(1, min(24, $months));
}

function subscription_price(): int {
  return (int)(cfg()['abonnement']['montant'] ?? 1000);
}

function subscription_duration_months(): int {
  return max(1, min(24, (int)(cfg()['abonnement']['duree_mois'] ?? 6)));
}

function expire_stale_abonnements(?string $userId = null): void {
  if (!table_exists('abonnements')) return;
  if ($userId) {
    db()->prepare("UPDATE abonnements SET statut='expire'
      WHERE user_id=? AND statut='actif' AND date_fin IS NOT NULL AND date_fin <= NOW()")
        ->execute([$userId]);
    return;
  }
  db()->exec("UPDATE abonnements SET statut='expire'
    WHERE statut='actif' AND date_fin IS NOT NULL AND date_fin <= NOW()");
}

function user_active_abonnement(string $userId): ?array {
  if (!table_exists('abonnements')) return null;
  expire_stale_abonnements($userId);
  $stmt = db()->prepare("SELECT * FROM abonnements
    WHERE user_id=? AND statut='actif' AND date_fin > NOW()
    ORDER BY date_fin DESC LIMIT 1");
  $stmt->execute([$userId]);
  $row = $stmt->fetch();
  return $row ?: null;
}

function user_has_active_subscription(string $userId): bool {
  return user_active_abonnement($userId) !== null;
}

function map_subscription_status(string $userId): array {
  $ab = user_active_abonnement($userId);
  $base = [
    'actif' => false,
    'expire' => false,
    'dateDebut' => null,
    'dateFin' => null,
    'joursRestants' => 0,
    'montant' => subscription_price(),
    'dureeMois' => subscription_duration_months(),
  ];
  if (!$ab) {
    if (!table_exists('abonnements')) return $base;
    expire_stale_abonnements($userId);
    $stmt = db()->prepare("SELECT * FROM abonnements
      WHERE user_id=? AND statut IN ('actif','expire')
        AND date_fin IS NOT NULL AND date_fin <= NOW()
      ORDER BY date_fin DESC LIMIT 1");
    $stmt->execute([$userId]);
    $expired = $stmt->fetch();
    if ($expired) {
      $base['expire'] = true;
      $base['dateFin'] = date('c', strtotime((string)$expired['date_fin']));
      if (!empty($expired['date_debut'])) {
        $base['dateDebut'] = date('c', strtotime((string)$expired['date_debut']));
      }
    }
    return $base;
  }

  $fin = new DateTimeImmutable($ab['date_fin']);
  $now = new DateTimeImmutable('now');
  $jours = max(0, (int)ceil(($fin->getTimestamp() - $now->getTimestamp()) / 86400));

  return [
    'actif' => true,
    'expire' => false,
    'dateDebut' => date('c', strtotime((string)$ab['date_debut'])),
    'dateFin' => $fin->format('c'),
    'joursRestants' => $jours,
    'montant' => (int)$ab['montant'],
    'dureeMois' => subscription_duration_months(),
  ];
}

function build_mobile_money_instructions(string $methode, string $ref, int $montant): array {
  if ($methode === 'flooz') {
    return [
      'titre' => 'Payer avec Flooz (Moov)',
      'etapes' => [
        "Composez *155*1# sur votre téléphone Flooz",
        "Sélectionnez « Payer un marchand »",
        "Entrez le code marchand EZOA-TO et le montant {$montant} FCFA",
        "Confirmez avec votre code PIN",
        "Référence : {$ref}",
      ],
      'ussd' => '*155*1#',
    ];
  }
  return [
    'titre' => 'Payer avec T-Money (Togocom)',
    'etapes' => [
      "Composez *144*1# sur votre téléphone T-Money",
      "Sélectionnez « Payer » puis « Marchand »",
      "Entrez le montant {$montant} FCFA",
      "Confirmez avec votre code PIN",
      "Référence : {$ref}",
    ],
    'ussd' => '*144*1#',
  ];
}

/** Paiement confirmé encore valide (fenêtre d'accès post-achat). */
function user_access_record(string $userId, string $epreuveId): ?array {
  $months = paid_access_months();
  $stmt = db()->prepare("SELECT confirme_le FROM paiements
    WHERE user_id=? AND epreuve_id=? AND statut='confirme'
    AND confirme_le IS NOT NULL
    AND confirme_le > DATE_SUB(NOW(), INTERVAL ? MONTH)
    LIMIT 1");
  $stmt->execute([$userId, $epreuveId, $months]);
  $row = $stmt->fetch();
  return $row ?: null;
}

function user_has_access(string $userId, string $epreuveId): bool {
  if (user_has_active_subscription($userId)) return true;
  return user_access_record($userId, $epreuveId) !== null;
}

function user_access_expires_at(string $userId, string $epreuveId): ?string {
  $ab = user_active_abonnement($userId);
  if ($ab && !empty($ab['date_fin'])) {
    return date('c', strtotime((string)$ab['date_fin']));
  }
  $row = user_access_record($userId, $epreuveId);
  if (!$row || empty($row['confirme_le'])) return null;
  $dt = new DateTimeImmutable($row['confirme_le']);
  return $dt->modify('+' . paid_access_months() . ' months')->format('c');
}

function payment_reference(): string {
  return 'EZOA-TO-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
}

function get_or_create_wallet(string $userId): array {
  $stmt = db()->prepare('SELECT * FROM portefeuilles WHERE user_id = ?');
  $stmt->execute([$userId]);
  $w = $stmt->fetch();
  if ($w) return $w;
  db()->prepare('INSERT INTO portefeuilles (user_id) VALUES (?)')->execute([$userId]);
  return ['user_id' => $userId, 'solde' => 0, 'paliers_verses' => 0, 'epreuves_validees' => 0];
}

function map_wallet(array $w): array {
  $cfg = cfg()['contributeur'];
  $parPalier = (int)$cfg['epreuves_par_recompense'];
  $validees = (int)$w['epreuves_validees'];
  $prochainPalier = ($w['paliers_verses'] + 1) * $parPalier;
  return [
    'solde' => (int)$w['solde'],
    'epreuvesValidees' => $validees,
    'paliersVerses' => (int)$w['paliers_verses'],
    'prochainPalier' => $prochainPalier,
    'progressionPalier' => $validees % $parPalier,
    'epreuvesParRecompense' => $parPalier,
    'montantRecompense' => (int)$cfg['montant_recompense'],
    'minRetrait' => (int)$cfg['min_retrait'],
    'peutRetirer' => (int)$w['solde'] >= (int)$cfg['min_retrait'],
  ];
}

function credit_wallet(string $userId, int $montant, string $description, ?string $ref = null): void {
  db()->prepare('UPDATE portefeuilles SET solde = solde + ? WHERE user_id = ?')
      ->execute([$montant, $userId]);
  db()->prepare('INSERT INTO portefeuille_transactions (id,user_id,type,montant,description,reference)
    VALUES (?,?,?,?,?,?)')
      ->execute([uuid(), $userId, 'credit', $montant, $description, $ref]);
}

function debit_wallet(string $userId, int $montant, string $description, ?string $ref = null): bool {
  $w = get_or_create_wallet($userId);
  if ((int)$w['solde'] < $montant) return false;
  db()->prepare('UPDATE portefeuilles SET solde = solde - ? WHERE user_id = ?')
      ->execute([$montant, $userId]);
  db()->prepare('INSERT INTO portefeuille_transactions (id,user_id,type,montant,description,reference)
    VALUES (?,?,?,?,?,?)')
      ->execute([uuid(), $userId, 'debit', $montant, $description, $ref]);
  return true;
}

function reward_contributor(string $userId): array {
  $cfg = cfg()['contributeur'];
  $parPalier = (int)$cfg['epreuves_par_recompense'];
  $montantPalier = (int)$cfg['montant_recompense'];

  $stmt = db()->prepare("SELECT COUNT(*) FROM soumissions WHERE soumis_par=? AND statut='validee'");
  $stmt->execute([$userId]);
  $count = (int)$stmt->fetchColumn();

  $wallet = get_or_create_wallet($userId);
  db()->prepare('UPDATE portefeuilles SET epreuves_validees = ? WHERE user_id = ?')
      ->execute([$count, $userId]);

  $paliersDus = intdiv($count, $parPalier);
  $paliersVerses = (int)$wallet['paliers_verses'];
  $nouveauxPaliers = $paliersDus - $paliersVerses;
  $credite = 0;

  if ($nouveauxPaliers > 0) {
    $credite = $nouveauxPaliers * $montantPalier;
    credit_wallet($userId, $credite, "Récompense : {$nouveauxPaliers}×{$parPalier} épreuves validées", "reward-{$count}");
    db()->prepare('UPDATE portefeuilles SET paliers_verses = ? WHERE user_id = ?')
        ->execute([$paliersDus, $userId]);
  }

  return ['credite' => $credite, 'epreuvesValidees' => $count];
}

function map_soumission_detail(array $row, bool $forOwner = false): array {
  $cfg = cfg();
  $base = rtrim($cfg['api_base_url'] ?? '', '/');
  $m = map_soumission($row);
  $m['niveau'] = $row['niveau'];
  $m['periode'] = $row['periode'] ?? null;
  $m['epreuveId'] = $row['epreuve_id'] ?? null;
  $images = $row['images_json'] ?? '[]';
  if (is_string($images)) $images = json_decode($images, true) ?: [];
  if (is_array($images) && count($images) > 0) {
    $m['pages'] = count($images);
  } elseif (!empty($row['pdf_preview_path']) && is_file($row['pdf_preview_path'])) {
    require_once __DIR__ . '/lib/image-pdf.php';
    $m['pages'] = pdf_page_count($row['pdf_preview_path']);
  } else {
    $m['pages'] = null;
  }
  if ($forOwner) {
    $m['pdfPreviewUrl'] = $base . '/account/soumissions/' . $row['id'] . '/preview';
  }
  return $m;
}

require_once __DIR__ . '/lib/notifications.php';
require_once __DIR__ . '/lib/abonnement-rappels.php';
