<?php
/**
 * Transcription audio derrière une interface.
 * Fournisseur prévu : Whisper chez Groq (GROQ_API_KEY), modèle whisper-large-v3.
 * Les tests injectent $deps['transcribe'].
 */
declare(strict_types=1);

function correction_transcrire(string $path, array $deps = []): string
{
  if ($path === '' || !is_file($path)) {
    throw new RuntimeException('Fichier audio introuvable');
  }
  $injecte = $deps['transcribe'] ?? null;
  if (is_callable($injecte)) {
    $texte = trim((string)$injecte($path));
    if ($texte === '') {
      throw new RuntimeException('Transcription vide');
    }
    return $texte;
  }
  $key = (string)(getenv('GROQ_API_KEY') ?: '');
  if ($key === '') {
    throw new RuntimeException('Transcription audio indisponible : fournisseur non configuré');
  }
  return correction_transcrire_groq($path, $key);
}

function correction_transcrire_groq(string $path, string $apiKey): string
{
  if (!function_exists('curl_init')) {
    throw new RuntimeException('Extension cURL requise pour la transcription');
  }
  $model = getenv('EZOATO_WHISPER_MODEL') ?: 'whisper-large-v3';
  $mime = function_exists('mime_content_type') ? (mime_content_type($path) ?: 'application/octet-stream') : 'application/octet-stream';
  $file = new CURLFile($path, $mime, basename($path));
  $ch = curl_init('https://api.groq.com/openai/v1/audio/transcriptions');
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $apiKey],
    CURLOPT_POSTFIELDS => ['file' => $file, 'model' => $model, 'language' => 'fr'],
  ]);
  $raw = curl_exec($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($raw === false || $code >= 400) {
    throw new RuntimeException('Transcription refusée par le fournisseur');
  }
  $json = json_decode((string)$raw, true);
  $texte = trim((string)($json['text'] ?? ''));
  if ($texte === '') {
    throw new RuntimeException('Transcription vide');
  }
  return $texte;
}
