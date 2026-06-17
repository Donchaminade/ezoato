<?php
// backend-php/epreuves.php — GET /epreuves , GET /epreuves/{id}
declare(strict_types=1);
require __DIR__ . '/helpers.php';
cors();

$id = $_GET['id'] ?? null;
if ($id) {
  $stmt = db()->prepare("SELECT e.*, et.nom AS etablissement FROM epreuves e
    LEFT JOIN etablissements et ON et.id = e.etablissement_id
    WHERE e.id = ? AND e.statut = 'validee'");
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  if (!$row) fail('Introuvable', 404);
  $mapped = map_epreuve($row);

  if ($row['type'] !== 'corrige') {
    $corrige = get_corrige_type($id);
    if ($corrige) $mapped['corrigeType'] = $corrige;
  }

  if ($row['type'] === 'corrige' && !empty($row['epreuve_parent_id'])) {
    $parent = db()->prepare("SELECT id, titre FROM epreuves WHERE id = ? AND statut = 'validee'");
    $parent->execute([$row['epreuve_parent_id']]);
    $p = $parent->fetch();
    if ($p) {
      $mapped['epreuveParent'] = ['id' => $p['id'], 'titre' => $p['titre']];
    }
  }

  json_out($mapped);
}

$where = ["statut = 'validee'", "type != 'corrige'"];
$args  = [];

$bind = function(string $col, string $key) use (&$where, &$args) {
  if (!empty($_GET[$key])) { $where[] = "$col = ?"; $args[] = $_GET[$key]; }
};
$bind('matiere','matiere'); $bind('niveau','niveau'); $bind('classe','classe');
$bind('type','type'); $bind('ville','ville'); $bind('examen','examen');
if (!empty($_GET['annee'])) { $where[] = 'annee = ?'; $args[] = (int)$_GET['annee']; }

if (!empty($_GET['q'])) {
  $q = '%' . $_GET['q'] . '%';
  $where[] = '(titre LIKE ? OR matiere LIKE ? OR ville LIKE ?)';
  array_push($args, $q, $q, $q);
}

$page    = max(1, (int)($_GET['page'] ?? 1));
$perPage = min(100, max(1, (int)($_GET['perPage'] ?? 50)));
$offset  = ($page - 1) * $perPage;

$cond = implode(' AND ', $where);

$stmtCount = db()->prepare("SELECT COUNT(*) FROM epreuves WHERE $cond");
$stmtCount->execute($args);
$total = (int)$stmtCount->fetchColumn();

$stmt = db()->prepare("SELECT e.*, et.nom AS etablissement
                       FROM epreuves e LEFT JOIN etablissements et ON et.id = e.etablissement_id
                       WHERE $cond ORDER BY e.valide_le DESC LIMIT $perPage OFFSET $offset");
$stmt->execute($args);
$items = array_map('map_epreuve', $stmt->fetchAll());

json_out(['items' => $items, 'total' => $total, 'page' => $page, 'perPage' => $perPage]);
