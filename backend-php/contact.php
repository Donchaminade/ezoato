<?php
// backend-php/contact.php — GET infos contact, POST message
declare(strict_types=1);
require __DIR__ . '/helpers.php';
cors();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
  json_out(contact_public());
}

$in = json_input();
$nom = trim($in['nom'] ?? '');
$email = trim($in['email'] ?? '');
$sujet = trim($in['sujet'] ?? '');
$message = trim($in['message'] ?? '');

if (strlen($nom) < 2) fail('Nom requis');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Email invalide');
if (strlen($sujet) < 3) fail('Sujet requis');
if (strlen($message) < 10) fail('Message trop court (10 caractères minimum)');

$userId = null;
$u = current_user();
if ($u) $userId = $u['id'];

$id = uuid();
db()->prepare('INSERT INTO contact_messages (id,user_id,nom,email,sujet,message) VALUES (?,?,?,?,?,?)')
    ->execute([$id, $userId, $nom, $email, $sujet, $message]);

json_out(['ok' => true, 'message' => 'Message envoyé. Nous vous répondrons sous 48h.']);
