<?php
declare(strict_types=1);

function tea_send_mail(string $to, string $subject, string $htmlBody, string $textBody = ''): bool {
  $cfg = cfg();
  $from = $cfg['app']['mail_from_address'] ?? 'noreply@ezoa-to.tg';
  $fromName = $cfg['app']['mail_from_name'] ?? 'EZOA-TO';
  $textBody = $textBody !== '' ? $textBody : strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $htmlBody));

  $headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    "From: {$fromName} <{$from}>",
    'X-Mailer: EZOA-TO-PHP',
  ]);

  $ok = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $htmlBody, $headers);

  if (!$ok) {
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
      @mkdir($logDir, 0775, true);
    }
    @file_put_contents(
      $logDir . '/mail.log',
      '[' . date('c') . "] TO: {$to}\nSUBJECT: {$subject}\n{$textBody}\n---\n",
      FILE_APPEND,
    );
  }

  return $ok;
}

function tea_send_password_reset_email(string $to, string $nom, string $resetUrl): bool {
  $subject = 'Réinitialisation de votre mot de passe EZOA-TO';
  $html = <<<HTML
<!DOCTYPE html>
<html lang="fr">
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#006A4E;margin:0 0 16px">EZOA-TO — Archives scolaires du Togo</h2>
  <p>Bonjour <strong>{$nom}</strong>,</p>
  <p>Tu as demandé la réinitialisation de ton mot de passe. Clique sur le bouton ci-dessous (lien valide <strong>1 heure</strong>) :</p>
  <p style="margin:28px 0">
    <a href="{$resetUrl}" style="display:inline-block;background:#006A4E;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600">
      Réinitialiser mon mot de passe
    </a>
  </p>
  <p style="font-size:13px;color:#555">Si tu n'as pas fait cette demande, ignore cet email. Ton mot de passe reste inchangé.</p>
  <p style="font-size:12px;color:#888;word-break:break-all">Lien direct : {$resetUrl}</p>
</body>
</html>
HTML;

  return tea_send_mail($to, $subject, $html);
}
