<?php
// backend-php/config.php
declare(strict_types=1);

return [
  'db' => [
    'dsn'  => 'mysql:host=localhost;dbname=zovu;charset=utf8mb4',
    'user' => 'zovu_user',
    'pass' => 'CHANGE_ME',
  ],
  'jwt_secret' => 'CHANGE_ME_LONG_RANDOM_STRING',
  'uploads_dir' => __DIR__ . '/uploads',
  'api_base_url' => 'http://localhost/zovu-project/backend-php',
  'allowed_origins' => [
    'https://ezoa-to.tg',
    'https://tea.tg',
    'https://zovu.tg',
    'http://localhost:5173',
    'http://localhost:8000',
    'http://localhost:8080',
  ],
  'paiement' => [
    'montant_examen' => 100, // FCFA
    'montant_corrige' => 200, // FCFA — double du prix examen
    'devise' => 'XOF',
    'expiration_minutes' => 15,
    /** Durée d'accès après paiement confirmé (aperçu, téléchargement) */
    'access_months' => 6,
  ],
  'contributeur' => [
    'epreuves_par_recompense' => 50,
    'montant_recompense' => 1000, // FCFA
    'min_retrait' => 2000, // FCFA
  ],
  'app' => [
    'frontend_url' => 'http://localhost:5173',
    'mail_from_name' => 'EZOA-TO',
    'mail_from_address' => 'noreply@ezoa-to.tg',
  ],
  'dev' => [
    /** En local : renvoyer le lien de reset dans la réponse API (jamais en prod) */
    'expose_reset_links' => false,
  ],
  'contact' => [
    'email' => 'contact@ezoa-to.tg',
    'telephone' => '+228 90 00 00 00',
    'whatsapp' => '+22890000000',
    'adresse' => 'Lomé, Togo',
    'horaires' => 'Lun–Ven, 8h–18h (GMT)',
  ],
  /** Web Push (VAPID) — voir generate-vapid-keys.php en local */
  'push' => [
    'vapid_public_key' => null,
    'vapid_private_key' => null,
    'vapid_subject' => 'mailto:contact@tea.test',
  ],
];
