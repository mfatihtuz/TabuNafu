/**
 * Zorluk dagilimini hedefe yaklastirir.
 *
 * NEDEN GEREKLI
 * Toplu kart yazarken etiketler kacinilmaz olarak kolaya kayiyor -
 * insan da makine de tanidik kelimeye "kolay" demeye egilimli. Oysa
 * destenin tadi zorluk cesitliliginden geliyor: hepsi kolaysa oyun
 * sikici, hepsi zorsa moral bozucu.
 *
 * YONTEM
 * Seviye 1 (cok kolay) elle kuratorlu bir listeye indirgenir - bunlar
 * bir cocugun aninda bilecegi kelimelerdir. Geri kalan seviyelerde
 * fazlalik bir ust seviyeye tasinir. Tasinacak kartlar rastgele degil,
 * ANA KELIME UZUNLUGUNA gore secilir: uzun kelimeler genelde daha az
 * dogrudan tahmin edilir, dolayisiyla bir ust seviyeye daha yakindir.
 *
 * Kullanim:
 *   node scripts/zorluk-dengele.mjs genel
 *   node scripts/zorluk-dengele.mjs genel --uygula
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { AYRAC, BOM, BASLIK, csvAyristir } from './build-words.mjs';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const HEDEF = { 1: 0.10, 2: 0.35, 3: 0.35, 4: 0.15, 5: 0.05 };

/**
 * Seviye 1'de kalmayi hak eden kelimeler.
 * Olcut: yedi yasindaki bir cocuk ilk yasakli kelimede bilir.
 */
const COK_KOLAY = new Set([
  'SU', 'EKMEK', 'SÜT', 'ÇAY', 'ELMA', 'MUZ', 'ŞEKER', 'TUZ',
  'ANNE', 'BABA', 'KARDEŞ', 'DEDE', 'ARKADAŞ',
  'GÜNEŞ', 'YILDIZ', 'AĞAÇ', 'YAPRAK', 'GÜL', 'ORMAN', 'RÜZGÂR',
  'KUŞ', 'ARI', 'KELEBEK', 'FİL', 'ASLAN', 'MAYMUN', 'TAVŞAN', 'YILAN',
  'İNEK', 'TAVUK', 'KOYUN', 'EŞEK',
  'KAPI', 'LAMBA', 'KALEM', 'KİTAP', 'SAAT', 'MASA ÖRTÜSÜ', 'TOP',
  'OKUL', 'PARK', 'SOKAK', 'PARA', 'TELEFON', 'OYUNCAK',
  'KIRMIZI', 'MAVİ', 'YEŞİL', 'SARI', 'SİYAH', 'BEYAZ',
  'YAZ', 'KIŞ', 'GECE', 'SABAH', 'TATİL',
  'UÇAK', 'TREN', 'OTOBÜS', 'BİSİKLET',
  'KOŞMAK', 'YÜRÜMEK', 'YÜZMEK', 'GÜLMEK', 'AĞLAMAK', 'UYKU',
  'SICAK', 'SOĞUK', 'ÇORBA', 'DONDURMA', 'ÇİKOLATA',
]);

const kategori = process.argv[2];
const uygula = process.argv.includes('--uygula');
if (!kategori) {
  console.error('Kullanim: node scripts/zorluk-dengele.mjs <kategori> [--uygula]');
  process.exit(1);
}

const yol = join(KOK, 'icerik', 'kelimeler', `${kategori}.csv`);
const { kartlar } = csvAyristir(readFileSync(yol, 'utf-8'));
const toplam = kartlar.length;

// 1. Seviye 1'i kuratorlu listeye indirge, kalani 2'ye tasi
for (const k of kartlar) {
  if (k.zorluk === 1 && !COK_KOLAY.has(k.kelime)) k.zorluk = 2;
}

// 2. Fazlaligi asagidan yukari kaydir
for (const seviye of [2, 3, 4]) {
  const hedefAdet = Math.round(toplam * HEDEF[seviye]);
  const buSeviye = kartlar.filter((k) => k.zorluk === seviye);
  const fazla = buSeviye.length - hedefAdet;
  if (fazla <= 0) continue;

  // Uzun kelimeler bir ust seviyeye daha yakin
  buSeviye
    .sort((a, b) => b.kelime.length - a.kelime.length)
    .slice(0, fazla)
    .forEach((k) => { k.zorluk = seviye + 1; });
}

const sayac = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
for (const k of kartlar) sayac[k.zorluk]++;

const ETIKET = { 1: 'cok kolay', 2: 'kolay', 3: 'orta', 4: 'zor', 5: 'cok zor' };
console.log(`\n${kategori}: ${toplam} kart\n`);
console.log(`  ${'seviye'.padEnd(12)} ${'adet'.padStart(5)} ${'gercek'.padStart(7)} ${'hedef'.padStart(6)}`);
console.log('  ' + '-'.repeat(34));
for (const s of [1, 2, 3, 4, 5]) {
  const yuzde = (sayac[s] / toplam) * 100;
  const sapma = Math.abs(yuzde - HEDEF[s] * 100);
  console.log(`  ${sapma <= 6 ? ' ' : '!'}${ETIKET[s].padEnd(11)} ${String(sayac[s]).padStart(5)} ` +
              `${('%' + yuzde.toFixed(0)).padStart(7)} ${('%' + HEDEF[s] * 100).padStart(6)}`);
}

if (!uygula) {
  console.log('\n  Onizleme. Yazmak icin --uygula ekle.\n');
  process.exit(0);
}

const satirlar = [
  BASLIK.join(AYRAC),
  ...kartlar.map((k) => [k.kelime, ...k.yasaklilar, k.zorluk].join(AYRAC)),
];
writeFileSync(yol, BOM + satirlar.join('\r\n') + '\r\n', 'utf-8');
console.log(`\n  ${yol} guncellendi.\n`);
