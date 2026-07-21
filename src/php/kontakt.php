<?php
/**
 * Kontaktskjema for sandmoen.com.
 * Tar imot POST fra /kontakt/, sender e-post til MOTTAKER med den besøkendes
 * adresse som Reply-To. Svarer med JSON ved AJAX, ellers en enkel takke-side.
 * Krever ingen tredjepart — bruker Domeneshops egen e-postsending (PHP mail()).
 *
 * Spamvern (se SPAMVERN.md):
 *   1. Honeypot-felt (nettsted).
 *   2. Cloudflare Turnstile — aktiveres når TURNSTILE_SECRET settes ved deploy.
 *   3. Innholdsfiltre — avviser lenker, ikke-latinsk skrift og spam-nøkkelord.
 */

const MOTTAKER = 'post@sandmoen.com';
const AVSENDER = 'noreply@sandmoen.com';

// Settes inn ved deploy til Domeneshop fra GitHub-secret TURNSTILE_SECRET.
// Plassholder/tom = Turnstile av (skjemaet virker som før). Aldri i en offentlig fil.
const TURNSTILE_SECRET = '@@TURNSTILE_SECRET@@';

function er_ajax(): bool {
  $xrw = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
  $acc = $_SERVER['HTTP_ACCEPT'] ?? '';
  return strtolower($xrw) === 'xmlhttprequest' || strpos($acc, 'application/json') !== false;
}

function svar(bool $ok, string $melding, int $kode = 200): void {
  http_response_code($kode);
  if (er_ajax()) {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['ok' => $ok, 'melding' => $melding]);
    exit;
  }
  $tittel = $ok ? 'Takk for interessen' : 'Noe gikk galt';
  header('Content-Type: text/html; charset=UTF-8');
  echo '<!DOCTYPE html><html lang="no"><head><meta charset="utf-8">'
     . '<meta name="viewport" content="width=device-width, initial-scale=1">'
     . '<meta name="robots" content="noindex"><title>' . $tittel . ' — Sandmoen</title>'
     . '<link rel="stylesheet" href="/css/style.css"></head><body><div class="page"><main>'
     . '<section class="notfound-section"><div class="wrap"><div class="notfound">'
     . '<span class="eyebrow">Kontakt</span><h1>' . $tittel . '</h1>'
     . '<p>' . htmlspecialchars($melding, ENT_QUOTES, 'UTF-8') . '</p>'
     . '<div class="notfound-cta"><a class="btn btn-primary" href="/">Til forsiden</a>'
     . '<a class="btn btn-sand" href="/kontakt/">Tilbake til kontakt</a></div>'
     . '</div></div></section></main></div></body></html>';
  exit;
}

// Bekreft Turnstile-token mot Cloudflare. Avviser kun når Cloudflare svarer
// eksplisitt «success: false»; ved nettverksfeil slippes henvendelsen gjennom
// (heller litt spam enn å miste en ekte kunde).
function turnstile_ok(string $token, string $ip): bool {
  $felt = http_build_query(['secret' => TURNSTILE_SECRET, 'response' => $token, 'remoteip' => $ip]);
  $url  = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  $svar = false;
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => $felt,
      CURLOPT_TIMEOUT => 5,
    ]);
    $svar = curl_exec($ch);
    $feil = curl_errno($ch);
    curl_close($ch);
    if ($feil || $svar === false) return true; // når vi ikke kan verifisere: slipp gjennom
  } else {
    $ctx = stream_context_create(['http' => [
      'method'  => 'POST',
      'header'  => 'Content-Type: application/x-www-form-urlencoded',
      'content' => $felt,
      'timeout' => 5,
    ]]);
    $svar = @file_get_contents($url, false, $ctx);
    if ($svar === false) return true;
  }
  $data = json_decode((string) $svar, true);
  return !empty($data['success']);
}

// Enkle innholdsheuristikker mot typisk skjema-spam.
function ser_ut_som_spam(string $navn, string $tomt, string $melding): bool {
  $alt = $navn . ' ' . $tomt . ' ' . $melding;
  // 1. Lenker — nesten all skjema-spam inneholder en URL.
  if (preg_match('#https?://|www\.#i', $alt)) return true;
  if (preg_match('#\b[a-z0-9-]+\.(com|net|org|ru|top|xyz|io|info|biz|shop|online|site|club|link)\b#i', $alt)) return true;
  // 2. Ikke-latinsk skrift (armensk, kyrillisk, kinesisk, arabisk osv.).
  //    En norsk/svensk hytteside får kun latinsk tekst (æøåäö ligger i Latin-1).
  if (preg_match('/[\p{Armenian}\p{Cyrillic}\p{Arabic}\p{Han}\p{Hiragana}\p{Katakana}\p{Hangul}\p{Hebrew}\p{Greek}\p{Thai}\p{Devanagari}]/u', $melding)) return true;
  // 3. Typiske spam-nøkkelord i meldingsteksten.
  $lav = mb_strtolower($melding, 'UTF-8');
  foreach (['backlink', 'ranking', 'guest post', 'link building', 'link-building',
            'digital marketing', 'web design service', 'web development service',
            'crypto', 'bitcoin', 'casino'] as $ord) {
    if (strpos($lav, $ord) !== false) return true;
  }
  if (preg_match('/\bseo\b/i', $melding)) return true;
  return false;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  header('Location: /kontakt/');
  exit;
}

// Honeypot: skjult felt som ekte brukere aldri fyller ut. Slipp bots stille.
if (!empty($_POST['nettsted'])) {
  svar(true, 'Takk for interessen. Vi tar kontakt så snart vi kan.');
}

// Cloudflare Turnstile — kun når en ekte secret er satt inn ved deploy
// (plassholderen starter med «@@», da er Turnstile av).
if (TURNSTILE_SECRET !== '' && strncmp(TURNSTILE_SECRET, '@@', 2) !== 0) {
  $token = (string) ($_POST['cf-turnstile-response'] ?? '');
  $ip    = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
  if ($token === '' || !turnstile_ok($token, $ip)) {
    svar(false, 'Vi klarte ikke å bekrefte at du er et menneske. Last siden på nytt og prøv igjen.', 422);
  }
}

$en_linje = static fn($s): string => trim(preg_replace('/[\r\n]+/', ' ', (string) ($s ?? '')));

$navn    = $en_linje($_POST['navn'] ?? '');
$epost   = $en_linje($_POST['epost'] ?? '');
$tlf     = $en_linje($_POST['tlf'] ?? '');
$tomt    = $en_linje($_POST['tomt'] ?? '');
$melding = trim((string) ($_POST['melding'] ?? ''));

if ($navn === '' || !filter_var($epost, FILTER_VALIDATE_EMAIL)) {
  svar(false, 'Fyll ut navn og en gyldig e-postadresse, så prøver du igjen.', 422);
}

// Enkel misbruksbrems.
$navn    = mb_substr($navn, 0, 120);
$tlf     = mb_substr($tlf, 0, 40);
$tomt    = mb_substr($tomt, 0, 80);
$melding = mb_strcut($melding, 0, 1000, 'UTF-8'); // 1000 bytes, uten å dele et tegn

// Innholdsfilter mot typisk skjema-spam. Ekte feiltreff får en vei videre.
if (ser_ut_som_spam($navn, $tomt, $melding)) {
  svar(false, 'Meldingen kunne dessverre ikke sendes automatisk. Ring oss gjerne på '
    . '472 774 42, eller send e-post direkte til ' . MOTTAKER . '.', 422);
}

$emne     = $tomt !== '' ? "Interesse for $tomt" : 'Henvendelse fra sandmoen.com';
$emne_enc = '=?UTF-8?B?' . base64_encode($emne) . '?=';
$navn_hdr = preg_replace('/["<>]/', '', $navn); // trygt visningsnavn i Reply-To

$kropp = "Ny henvendelse fra sandmoen.com\n\n"
       . "Navn:     $navn\n"
       . "Telefon:  $tlf\n"
       . "E-post:   $epost\n"
       . "Tomt:     $tomt\n\n"
       . "Melding:\n$melding\n";

$headers = [
  'From: Sandmoen <' . AVSENDER . '>',
  'Reply-To: ' . $navn_hdr . ' <' . $epost . '>',
  'Content-Type: text/plain; charset=UTF-8',
  'MIME-Version: 1.0',
  'X-Mailer: sandmoen-kontakt',
];

$sendt = mail(MOTTAKER, $emne_enc, $kropp, implode("\r\n", $headers), '-f' . AVSENDER);

if ($sendt) {
  svar(true, 'Takk for interessen! Vi tar kontakt så snart vi kan.');
}
svar(false, 'Beklager, meldingen kunne ikke sendes akkurat nå. Ring oss gjerne, eller send e-post direkte til ' . MOTTAKER . '.', 500);
