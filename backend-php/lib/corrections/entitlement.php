<?php
/**
 * Point de branchement freemium / Pro.
 * feat/freemium-paiement-mobile-money peut remplacer le corps de ces deux fonctions.
 * Le reste du module ne lit pas la table des abonnements directement.
 */
declare(strict_types=1);

function correction_eleve_est_pro(array $user): bool
{
  $role = (string)($user['role'] ?? '');
  if (in_array($role, ['admin', 'gestionnaire'], true)) {
    return true;
  }
  if (!function_exists('user_has_active_subscription')) {
    return false;
  }
  return user_has_active_subscription((string)$user['id']);
}

function correction_reglement_secret(): string
{
  if (function_exists('ezoa_env')) {
    $v = ezoa_env('EZOATO_CORRECTIONS_REGLEMENT_SECRET');
    return is_string($v) ? $v : '';
  }
  $g = getenv('EZOATO_CORRECTIONS_REGLEMENT_SECRET');
  return ($g === false || $g === '') ? '' : (string)$g;
}

/** Même contrôle que l'en-tête X-Ezoato-Reglement (hash_equals). */
function correction_reglement_header_valide(?string $given): bool
{
  $secret = correction_reglement_secret();
  $given = (string)$given;
  return $secret !== '' && $given !== '' && hash_equals($secret, $given);
}

function correction_periode_pro(array $user): string
{
  $userId = (string)($user['id'] ?? '');
  if ($userId !== '' && function_exists('user_active_abonnement')) {
    $ab = user_active_abonnement($userId);
    if (is_array($ab) && !empty($ab['date_debut'])) {
      return 'abo:' . substr((string)$ab['date_debut'], 0, 19);
    }
  }
  $mois = function_exists('subscription_duration_months') ? subscription_duration_months() : 6;
  $slot = intdiv(((int)date('n')) - 1, max(1, $mois));
  return 'cal:' . date('Y') . ':' . $slot;
}
