<?php
/**
 * Demandes de correction — machine à états, paiements, délai, IA, attestation.
 * Usage : php backend-php/tests/test-demandes-correction.php
 */
declare(strict_types=1);

$failed = 0;
$passed = 0;

function assert_true(bool $cond, string $msg): void
{
  global $failed, $passed;
  if ($cond) {
    echo "  OK  $msg\n";
    $passed++;
  } else {
    echo " FAIL $msg\n";
    $failed++;
  }
}

require dirname(__DIR__) . '/lib/corrections/bootstrap.php';

function nouveau_pdo(): PDO
{
  $pdo = new PDO('sqlite::memory:');
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
  correction_sqlite_schema($pdo);
  return $pdo;
}

function planter(PDO $pdo, string $id, string $role, string $nom = 'Test'): void
{
  $pdo->prepare('INSERT INTO users (id, nom, role) VALUES (?,?,?)')->execute([$id, $nom, $role]);
}

$credits = [];
function ctx_test(array $user, array $extra = []): array
{
  global $credits;
  return array_merge([
    'user' => $user,
    'is_pro' => true,
    'periode' => 'test-periode',
    'now' => '2026-10-09 12:00:00',
    'credit' => function (string $userId, int $montant, string $description, string $ref) use (&$credits) {
      $credits[] = ['user' => $userId, 'montant' => $montant, 'ref' => $ref, 'description' => $description];
    },
  ], $extra);
}

function versements(PDO $pdo, string $role): array
{
  $stmt = $pdo->prepare('SELECT * FROM correction_versements WHERE role_versement=?');
  $stmt->execute([$role]);
  return $stmt->fetchAll();
}

echo "\n=== Heuristique énoncé / attestation ===\n";
$scan = correction_detecter_corrige('Composition de mathématiques — proposition de corrigé');
assert_true($scan['signale'] === true, 'un texte de corrigé est signalé');
assert_true(correction_detecter_corrige('Énoncé de mathématiques, trimestre 2')['signale'] === false, 'un énoncé ordinaire n\'est pas signalé');
assert_true(correction_attestation_requise('1') === null, 'attestation acceptée');
assert_true(correction_attestation_requise(null) !== null, 'attestation absente refusée');

echo "\n=== IA : pas de réponse directe ===\n";
$guide = correction_guider([
  'blocage' => 'explique la proportionnalité',
  'matiere' => 'Mathématiques',
  'exercices' => ['exercice 2'],
], [
  'complete' => function () {
    return [
      'classe' => 'comprehension',
      'explications' => 'La réponse est 42. Regarde ensuite les données du tableau.',
      'exemples' => ['Un marchand vend 3 cahiers.'],
      'qcm' => [[
        'id' => 'q1',
        'prompt' => 'La réponse est 7.',
        'choices' => ['souligner les données', 'x = 7'],
        'correctIndex' => 0,
      ]],
    ];
  },
]);
$public = correction_guide_public($guide);
$blob = json_encode($public, JSON_UNESCAPED_UNICODE);
assert_true($guide['donneReponseDirecte'] === false, 'le guide affirme ne pas donner la réponse');
assert_true($guide['fuiteBloquee'] === true, 'la fuite du modèle simulé est bloquée');
assert_true(!str_contains(mb_strtolower($blob), 'réponse est'), 'la phrase « réponse est » ne sort pas');
assert_true(!str_contains($blob, '42'), 'le résultat 42 du modèle simulé est retiré');
assert_true(!isset($public['qcm'][0]['correctIndex']), 'l\'index de la bonne réponse n\'est pas public');
assert_true(correction_classer_blocage('donne-moi la réponse de l\'exercice') === 'humaine', 'une demande de solution part vers un humain');
assert_true(correction_classer_blocage('je ne comprends pas la notion de proportionnalité') === 'comprehension', 'une demande de compréhension reste à l\'IA');

echo "\n=== Machine : confirmation avant assignation, auto-validation, paiement ===\n";
$base = [
  'id' => 'd1',
  'eleve_id' => 'eleve',
  'statut' => 'en_attente_admin',
  'correcteur_id' => null,
  'format_eleve' => 'pedagogique',
  'correction' => null,
];
$tropTot = correction_transition($base, 'assigner', ['id' => 'admin', 'role' => 'admin'], [
  'correcteur_id' => 'corr',
  'now' => '2026-10-09 12:00:00',
]);
assert_true($tropTot['ok'] === false, 'assignation refusée tant que l\'admin n\'a pas confirmé');

$conf = correction_transition($base, 'confirmer', ['id' => 'admin', 'role' => 'admin'], []);
assert_true($conf['ok'] && $conf['demande']['statut'] === 'confirmee_admin', 'l\'admin confirme');
$ass = correction_transition($conf['demande'], 'assigner', ['id' => 'admin', 'role' => 'admin'], [
  'correcteur_id' => 'corr',
  'now' => '2026-10-09 12:00:00',
  'delai_heures' => 48,
]);
assert_true($ass['ok'] && $ass['demande']['statut'] === 'assignee', 'assignation après confirmation');
assert_true($ass['demande']['echeance_le'] === '2026-10-11 12:00:00', 'échéance à 48 h');

$dep = correction_transition($ass['demande'], 'soumettre_correction', ['id' => 'corr', 'role' => 'utilisateur'], [
  'contenu' => 'Démarche commentée : on identifie les données puis on justifie chaque étape du calcul demandé.',
  'correction_id' => 'c1',
]);
assert_true($dep['ok'] && $dep['demande']['statut'] === 'en_revue', 'la correction part en revue');

$auto = correction_transition($dep['demande'], 'revue', ['id' => 'corr', 'role' => 'utilisateur'], [
  'decision' => 'approuvee',
  'revue_id' => 'r-auto',
  'nombre_validateurs' => 1,
]);
assert_true($auto['ok'] === false && str_contains((string)$auto['error'], 'propre'), 'auto-validation interdite');
assert_true($auto['effects'] === [], 'aucun effet si auto-validation');

$partiel = correction_transition($dep['demande'], 'revue', ['id' => 'val1', 'role' => 'utilisateur'], [
  'decision' => 'approuvee',
  'revue_id' => 'r1',
  'nombre_validateurs' => 2,
  'remuneration_correcteur' => 500,
  'forfait_validateur' => 200,
]);
assert_true($partiel['ok'] && $partiel['demande']['statut'] === 'en_revue', 'il manque encore un validateur');
assert_true(!correction_a_effet($partiel['effects'], 'payer_correcteur'), 'le correcteur n\'est pas payé avant la validation complète');
assert_true(correction_a_effet($partiel['effects'], 'payer_validateur'), 'le validateur est payé pour la revue');

$final = correction_transition($partiel['demande'], 'revue', ['id' => 'val2', 'role' => 'utilisateur'], [
  'decision' => 'approuvee',
  'revue_id' => 'r2',
  'nombre_validateurs' => 2,
  'remuneration_correcteur' => 500,
  'forfait_validateur' => 200,
  'format_eleve' => 'pedagogique',
]);
assert_true($final['ok'] && $final['demande']['statut'] === 'livree', 'N validations livrent la demande');
assert_true(correction_a_effet($final['effects'], 'payer_correcteur'), 'le correcteur est payé seulement après validation');

$rej = correction_transition($dep['demande'], 'revue', ['id' => 'val1', 'role' => 'utilisateur'], [
  'decision' => 'rejetee',
  'revue_id' => 'r-rejet',
  'nombre_validateurs' => 1,
]);
assert_true($rej['ok'] && $rej['demande']['statut'] === 'rejetee', 'un rejet renvoie l\'état rejeté');
assert_true(!correction_a_effet($rej['effects'], 'payer_correcteur'), 'un rejet ne paie pas le correcteur');

$totTot = correction_transition($ass['demande'], 'timeout', ['id' => null, 'role' => 'systeme'], [
  'now' => '2026-10-10 12:00:00',
]);
assert_true($totTot['ok'] === false, 'pas de réassignation avant l\'échéance');
$tot = correction_transition($ass['demande'], 'timeout', ['id' => null, 'role' => 'systeme'], [
  'now' => '2026-10-11 12:00:00',
]);
assert_true($tot['ok'] && $tot['demande']['statut'] === 'en_attente_admin', 'échéance dépassée : retour administration');
assert_true($tot['demande']['correcteur_id'] === null, 'le correcteur est retiré');
assert_true(correction_a_effet($tot['effects'], 'notify_admin'), 'l\'administration est notifiée du délai');

$ia = correction_transition([
  'statut' => 'recue',
  'eleve_id' => 'eleve',
  'format_eleve' => 'pedagogique',
], 'triage', ['role' => 'systeme'], ['classe' => 'comprehension', 'guide' => ['explications' => 'notion']]);
assert_true($ia['ok'] && $ia['demande']['statut'] === 'traitee_ia', 'compréhension traitée par l\'IA');
assert_true((int)$ia['demande']['admin_notifie'] === 1 && correction_a_effet($ia['effects'], 'notify_admin'), 'l\'IA notifie l\'administration même seule');

echo "\n=== Idempotence du versement ===\n";
$pdoPay = nouveau_pdo();
$spy = [];
$payer = function (string $userId, int $montant, string $description, string $ref) use (&$spy) {
  $spy[] = $ref;
};
$rowPay = [
  'idempotency_key' => 'correcteur:c1',
  'user_id' => 'corr',
  'montant' => 500,
  'role_versement' => 'correcteur',
  'demande_id' => 'd1',
  'description' => 'Correction validée',
];
$a = correction_verser_idempotent($pdoPay, $rowPay, $payer);
$b = correction_verser_idempotent($pdoPay, $rowPay, $payer);
assert_true($a['applied'] === true && $b['duplicate'] === true, 'le second versement est un doublon');
assert_true(count($spy) === 1, 'le portefeuille n\'est crédité qu\'une fois');
assert_true(count(versements($pdoPay, 'correcteur')) === 1, 'une seule ligne de versement');

echo "\n=== Service : parcours, quota, réutilisation, délai, notification ===\n";
$pdo = nouveau_pdo();
$credits = [];
$eleve = '11111111-1111-4111-8111-111111111111';
$autre = '22222222-2222-4222-8222-222222222222';
$admin = '33333333-3333-4333-8333-333333333333';
$corr = '44444444-4444-4444-8444-444444444444';
$val = '55555555-5555-4555-8555-555555555555';
planter($pdo, $eleve, 'utilisateur', 'Afi');
planter($pdo, $autre, 'utilisateur', 'Kofi');
planter($pdo, $admin, 'admin', 'Admin');
planter($pdo, $corr, 'utilisateur', 'Ama');
planter($pdo, $val, 'utilisateur', 'Yao');
$now = '2026-10-09 12:00:00';
$ins = $pdo->prepare('INSERT INTO correcteur_profils
  (id, user_id, qualite, statut, matieres_json, niveaux_json, fiabilite, piece_identite_path, preuve_enseignement_path, cree_le, maj_le)
  VALUES (?,?,?,?,?,?,?,?,?,?,?)');
$ins->execute([correction_uuid(), $corr, 'enseignant', 'valide', '["Mathématiques"]', '["college"]', 80, 'piece', 'preuve', $now, $now]);
$ins->execute([correction_uuid(), $val, 'repetiteur', 'valide', '["Mathématiques"]', '["college"]', 70, 'piece', 'preuve', $now, $now]);

$humaine = ctx_test(['id' => $eleve, 'role' => 'utilisateur'], [
  'complete' => fn() => ['classe' => 'humaine', 'explications' => '', 'exemples' => [], 'qcm' => []],
]);
$creee = correction_service_creer($pdo, [
  'epreuve' => ['id' => 'ep-1', 'titre' => 'Mathématiques 4e — 2e trimestre', 'matiere' => 'Mathématiques', 'niveau' => 'college', 'type' => 'composition'],
  'exercices' => ['Exercice 2', 'Exercice 1'],
  'blocage_texte' => 'Je n\'y arrive pas, je veux la solution complète de ces exercices.',
], $humaine);
assert_true($creee['ok'] && $creee['demande']['statut'] === 'en_attente_admin', 'demande humaine escaladée');
assert_true($creee['demande']['adminNotifie'] === true, 'notification admin enregistrée sur la demande');
$inbox = (int)$pdo->query('SELECT COUNT(*) FROM notification_inbox')->fetchColumn();
assert_true($inbox >= 1, 'l\'administration a une notification en boîte');

$id = $creee['demande']['id'];
$adminUser = ['id' => $admin, 'role' => 'admin'];
$okConf = correction_service_appliquer($pdo, $id, 'confirmer', $adminUser, [], ctx_test($adminUser));
assert_true($okConf['ok'] && $okConf['demande']['statut'] === 'confirmee_admin', 'confirmation admin');
$okAss = correction_service_assigner($pdo, $id, $adminUser, $corr, ctx_test($adminUser));
assert_true($okAss['ok'] && $okAss['demande']['statut'] === 'assignee', 'assignation au correcteur suggéré');
$contenu = 'On relie les données de l\'énoncé à la proportionnalité, puis on justifie chaque étape sans sauter au résultat.';
$okDep = correction_service_appliquer($pdo, $id, 'soumettre_correction', ['id' => $corr, 'role' => 'utilisateur'], [
  'contenu' => $contenu,
  'correction_id' => correction_uuid(),
], ctx_test(['id' => $corr, 'role' => 'utilisateur']));
assert_true($okDep['ok'] && $okDep['demande']['statut'] === 'en_revue', 'dépôt correcteur');
$avant = count(versements($pdo, 'correcteur'));
$okRev = correction_service_appliquer($pdo, $id, 'revue', ['id' => $val, 'role' => 'utilisateur'], [
  'decision' => 'approuvee',
  'commentaire' => 'Démarche solide',
  'revue_id' => correction_uuid(),
  'suite' => 'renvoyer',
], ctx_test(['id' => $val, 'role' => 'utilisateur']));
assert_true($okRev['ok'] && $okRev['demande']['statut'] === 'livree', 'livraison après l\'unique validateur');
assert_true(count(versements($pdo, 'correcteur')) === $avant + 1, 'un versement correcteur de 500');
assert_true((int)versements($pdo, 'correcteur')[0]['montant'] === 500, 'montant correcteur 500 FCFA');
assert_true((int)versements($pdo, 'validateur')[0]['montant'] === 200, 'forfait validateur 200 FCFA');
$liv = correction_livraison_derniere($pdo, $id);
assert_true($liv && str_contains($liv['contenu'], 'Correction commentée et pédagogique'), 'format pédagogique par défaut');
$vueEleve = correction_vue($pdo, correction_charger($pdo, $id), ['id' => $eleve, 'role' => 'utilisateur']);
assert_true(!isset($vueEleve['correction']), 'l\'élève ne reçoit pas la correction brute');
assert_true(isset($vueEleve['livraison']), 'l\'élève reçoit la version commentée');

$reutilisee = correction_service_creer($pdo, [
  'epreuve' => ['id' => 'ep-1', 'titre' => 'Mathématiques 4e — 2e trimestre', 'matiere' => 'Mathématiques', 'niveau' => 'college', 'type' => 'composition'],
  'exercices' => ['Exercice 1', 'Exercice 2'],
  'blocage_texte' => 'Je ne comprends pas non plus ces deux exercices.',
], ctx_test(['id' => $autre, 'role' => 'utilisateur'], [
  'complete' => fn() => ['classe' => 'comprehension', 'explications' => 'La réponse est 42.', 'exemples' => [], 'qcm' => []],
]));
assert_true($reutilisee['ok'] && $reutilisee['demande']['statut'] === 'livree', 'réutilisation d\'une correction validée');
assert_true($reutilisee['demande']['origine'] === 'reutilisation', 'origine réutilisation');
assert_true(count(versements($pdo, 'reutilisation')) === 1, 'un versement de réutilisation');
assert_true((int)versements($pdo, 'reutilisation')[0]['montant'] === 100, 'réutilisation à 100 FCFA');
$inboxApres = (int)$pdo->query('SELECT COUNT(*) FROM notification_inbox')->fetchColumn();
assert_true($inboxApres > $inbox, 'l\'administration est aussi notifiée lors d\'une réutilisation');

$quota = correction_service_creer($pdo, [
  'epreuve' => ['id' => 'ep-2', 'titre' => 'SVT 3e', 'matiere' => 'SVT', 'niveau' => 'college', 'type' => 'devoir'],
  'exercices' => ['1'],
  'blocage_texte' => 'Je ne comprends pas le schéma de la cellule.',
], ctx_test(['id' => $eleve, 'role' => 'utilisateur']));
assert_true($quota['ok'] && $quota['demande']['statut'] === 'en_attente_reglement', 'au-delà du quota Pro, la demande attend le règlement');
assert_true($quota['demande']['montant'] === 1500, 'prix unitaire prudent 1500 FCFA');

$pdo->prepare('UPDATE correction_demandes SET echeance_le=? WHERE id=?')->execute(['2026-10-08 08:00:00', $id]);
$pdo->prepare('UPDATE correction_demandes SET statut=?, correcteur_id=? WHERE id=?')->execute(['assignee', $corr, $id]);
$echues = correction_service_reassigner_echues($pdo, ctx_test($adminUser, ['now' => '2026-10-09 18:00:00']));
assert_true(in_array($id, $echues['reassignees'], true), 'réassignation automatique après le délai');
$apresDelai = correction_charger($pdo, $id);
assert_true($apresDelai['statut'] === 'en_attente_admin' && $apresDelai['correcteur_id'] === null, 'la demande échue revient à l\'administration');

echo "\n=== IA seule notifie toujours ===\n";
$pdoIa = nouveau_pdo();
planter($pdoIa, $admin, 'admin', 'Admin');
planter($pdoIa, $eleve, 'utilisateur', 'Afi');
$iaSeule = correction_service_creer($pdoIa, [
  'epreuve' => ['id' => 'ep-3', 'titre' => 'Français 5e', 'matiere' => 'Français', 'niveau' => 'college', 'type' => 'devoir'],
  'exercices' => ['texte'],
  'blocage_texte' => 'Je ne comprends pas ce qu\'est un complément d\'objet.',
], ctx_test(['id' => $eleve, 'role' => 'utilisateur'], [
  'complete' => fn() => [
    'classe' => 'comprehension',
    'explications' => 'La réponse est 42. Un complément précise le verbe.',
    'exemples' => ['Dans « Afi lit un conte », le conte complète le verbe.'],
    'qcm' => [],
  ],
]));
assert_true($iaSeule['ok'] && $iaSeule['demande']['statut'] === 'traitee_ia', 'l\'IA traite la compréhension');
assert_true(!str_contains(json_encode($iaSeule['demande']['guide'], JSON_UNESCAPED_UNICODE), '42'), 'même en service, 42 ne sort pas');
$notifs = (int)$pdoIa->query("SELECT COUNT(*) FROM correction_evenements WHERE type='notify_admin'")->fetchColumn();
$boite = (int)$pdoIa->query('SELECT COUNT(*) FROM notification_inbox')->fetchColumn();
assert_true($notifs >= 1 && $boite >= 1, 'notification admin systématique quand l\'IA traite seule');

echo "\n=== Divergence ===\n";
$div = correction_detecter_divergence(
  'proportionnalité données cahiers prix unité',
  ['cellule membrane noyau cytoplasme observation microscope']
);
assert_true($div['signalee'] === true, 'l\'IA signale une divergence, le validateur reste décideur');

echo "\n=== Vocabulaire ===\n";
$roots = [
  dirname(__DIR__) . '/lib/corrections',
  dirname(__DIR__) . '/corrections.php',
  dirname(__DIR__) . '/migration-demandes-correction.sql',
];
$interdit = false;
$mot = 'ann' . 'ales';
foreach ($roots as $root) {
  $files = is_dir($root) ? glob($root . '/*.php') : [$root];
  foreach ($files as $file) {
    $txt = file_get_contents($file) ?: '';
    if (stripos($txt, $mot) !== false) {
      $interdit = true;
      echo " FAIL vocabulaire dans $file\n";
    }
  }
}
assert_true($interdit === false, 'le module parle d\'épreuves, pas de l\'ancien synonyme');

echo "\n=== Résultat : $passed OK, $failed échec(s) ===\n";
exit($failed > 0 ? 1 : 0);
