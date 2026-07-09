<?php
/**
 * Kontaktskjema for sandmoen.com.
 * Tar imot POST fra /kontakt/, sender e-post til MOTTAKER med den besøkendes
 * adresse som Reply-To. Svarer med JSON ved AJAX, ellers en enkel takke-side.
 * Krever ingen tredjepart — bruker Domeneshops egen e-postsending (PHP mail()).
 */

const MOTTAKER = 'post@sandmoen.com';
const AVSENDER = 'noreply@sandmoen.com';

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

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  header('Location: /kontakt/');
  exit;
}

// Honeypot: skjult felt som ekte brukere aldri fyller ut. Slipp bots stille.
if (!empty($_POST['nettsted'])) {
  svar(true, 'Takk for interessen. Vi tar kontakt så snart vi kan.');
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
$melding = mb_substr($melding, 0, 4000);

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
