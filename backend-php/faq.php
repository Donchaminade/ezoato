<?php
// backend-php/faq.php — FAQ publique + votes utiles
declare(strict_types=1);
require __DIR__ . '/helpers.php';
cors();

const FAQ_CATEGORIES = [
  'general' => 'Général',
  'telechargement' => 'Téléchargements',
  'paiement' => 'Paiements',
  'contribution' => 'Contributions',
  'compte' => 'Compte & sécurité',
];

$action = $_GET['action'] ?? '';

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && $action === 'vote') {
  $in = json_input();
  $faqId = trim($in['faqId'] ?? '');
  $voterId = trim($in['voterId'] ?? '');
  $helpful = filter_var($in['helpful'] ?? true, FILTER_VALIDATE_BOOLEAN);

  if (!preg_match('/^[a-f0-9-]{36}$/', $faqId)) fail('FAQ invalide');
  if (strlen($voterId) < 8 || strlen($voterId) > 64) fail('Identifiant votant invalide');

  $db = db();
  $item = $db->prepare('SELECT id, helpful_yes, helpful_no FROM faq_items WHERE id=? AND actif=1');
  $item->execute([$faqId]);
  $row = $item->fetch();
  if (!$row) fail('Question introuvable', 404);

  $prev = $db->prepare('SELECT helpful FROM faq_votes WHERE faq_id=? AND voter_id=?');
  $prev->execute([$faqId, $voterId]);
  $existing = $prev->fetch();

  if ($existing) {
    $wasHelpful = (bool)$existing['helpful'];
    if ($wasHelpful === $helpful) {
      json_out([
        'ok' => true,
        'helpfulYes' => (int)$row['helpful_yes'],
        'helpfulNo' => (int)$row['helpful_no'],
        'yourVote' => $helpful,
      ]);
    }
    $db->prepare('UPDATE faq_votes SET helpful=? WHERE faq_id=? AND voter_id=?')
        ->execute([(int)$helpful, $faqId, $voterId]);
    if ($wasHelpful) {
      $db->prepare('UPDATE faq_items SET helpful_yes=GREATEST(0, helpful_yes-1), helpful_no=helpful_no+1 WHERE id=?')
          ->execute([$faqId]);
    } else {
      $db->prepare('UPDATE faq_items SET helpful_no=GREATEST(0, helpful_no-1), helpful_yes=helpful_yes+1 WHERE id=?')
          ->execute([$faqId]);
    }
  } else {
    $db->prepare('INSERT INTO faq_votes (faq_id, voter_id, helpful) VALUES (?,?,?)')
        ->execute([$faqId, $voterId, (int)$helpful]);
    $col = $helpful ? 'helpful_yes' : 'helpful_no';
    $db->prepare("UPDATE faq_items SET $col = $col + 1 WHERE id=?")->execute([$faqId]);
  }

  $counts = $db->prepare('SELECT helpful_yes, helpful_no FROM faq_items WHERE id=?');
  $counts->execute([$faqId]);
  $updated = $counts->fetch();

  json_out([
    'ok' => true,
    'helpfulYes' => (int)$updated['helpful_yes'],
    'helpfulNo' => (int)$updated['helpful_no'],
    'yourVote' => $helpful,
  ]);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
  fail('Méthode non autorisée', 405);
}

$db = db();
$q = trim($_GET['q'] ?? '');
$category = trim($_GET['category'] ?? '');
$limit = isset($_GET['limit']) ? max(1, min(50, (int)$_GET['limit'])) : 0;

$sql = 'SELECT id, category, question, answer, helpful_yes, helpful_no, ordre
        FROM faq_items WHERE actif=1';
$params = [];

if ($category !== '' && isset(FAQ_CATEGORIES[$category])) {
  $sql .= ' AND category=?';
  $params[] = $category;
}

if ($q !== '') {
  $sql .= ' AND (question LIKE ? OR answer LIKE ?)';
  $like = '%' . $q . '%';
  $params[] = $like;
  $params[] = $like;
}

$sql .= ' ORDER BY ordre ASC, question ASC';

if ($limit > 0) {
  $sql .= ' LIMIT ' . $limit;
}

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$catSql = 'SELECT category, COUNT(*) AS cnt FROM faq_items WHERE actif=1 GROUP BY category';
$catRows = $db->query($catSql)->fetchAll();

$categories = [];
$totalAll = 0;
foreach ($catRows as $c) {
  $slug = $c['category'];
  if (!isset(FAQ_CATEGORIES[$slug])) continue;
  $cnt = (int)$c['cnt'];
  $totalAll += $cnt;
  $categories[] = [
    'slug' => $slug,
    'label' => FAQ_CATEGORIES[$slug],
    'count' => $cnt,
  ];
}
usort($categories, fn($a, $b) => strcmp($a['label'], $b['label']));

$voterId = trim($_GET['voterId'] ?? '');
$votes = [];
if ($voterId !== '' && strlen($voterId) >= 8 && count($rows) > 0) {
  $ids = array_column($rows, 'id');
  $placeholders = implode(',', array_fill(0, count($ids), '?'));
  $voteStmt = $db->prepare("SELECT faq_id, helpful FROM faq_votes WHERE voter_id=? AND faq_id IN ($placeholders)");
  $voteStmt->execute(array_merge([$voterId], $ids));
  foreach ($voteStmt->fetchAll() as $v) {
    $votes[$v['faq_id']] = (bool)$v['helpful'];
  }
}

$items = array_map(function ($r) use ($votes) {
  return [
    'id' => $r['id'],
    'category' => $r['category'],
    'categoryLabel' => FAQ_CATEGORIES[$r['category']] ?? $r['category'],
    'question' => repair_display_text($r['question'] ?? '') ?? '',
    'answer' => repair_display_text($r['answer'] ?? '') ?? '',
    'helpfulYes' => (int)$r['helpful_yes'],
    'helpfulNo' => (int)$r['helpful_no'],
    'yourVote' => $votes[$r['id']] ?? null,
  ];
}, $rows);

json_out([
  'categories' => $categories,
  'items' => $items,
  'total' => count($items),
  'totalAll' => $totalAll,
]);
