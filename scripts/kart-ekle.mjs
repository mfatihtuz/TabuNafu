/**
 * Kategoriye kart ekler.
 *
 * Kartlar stdin'den satir satir okunur, formati CSV ile ayni:
 *   KELIME;YASAKLI1;YASAKLI2;YASAKLI3;YASAKLI4;YASAKLI5;ZORLUK
 *
 * Eklemeden once tekillik kontrol edilir - ana kelime baska bir
 * kategoride varsa veya bu kategoride zaten varsa atlanir ve
 * raporlanir. Boylece toplu uretimde sessizce kopya birikmez.
 *
 * Kullanim:
 *   node scripts/kart-ekle.mjs genel < yeni-kartlar.txt
 *   cat kartlar.txt | node scripts/kart-ekle.mjs cografya
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';

import { AYRAC, BOM, BASLIK, csvAyristir } from './build-words.mjs';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const KAYNAK_KLASOR = join(KOK, 'icerik', 'kelimeler');

const hedefKategori = process.argv[2];
if (!hedefKategori) {
  console.error('Kullanim: node scripts/kart-ekle.mjs <kategori> < kartlar.txt');
  process.exit(1);
}

const hedefYol = join(KAYNAK_KLASOR, `${hedefKategori}.csv`);

/** Tum kategorilerdeki mevcut ana kelimeler - global tekillik icin. */
function mevcutKelimeler() {
  const harita = new Map();
  for (const dosya of readdirSync(KAYNAK_KLASOR).filter((d) => d.endsWith('.csv'))) {
    const kategori = basename(dosya, '.csv');
    const { kartlar } = csvAyristir(readFileSync(join(KAYNAK_KLASOR, dosya), 'utf-8'));
    for (const k of kartlar) harita.set(k.kelime, kategori);
  }
  return harita;
}

const girdi = readFileSync(0, 'utf-8');
const satirlar = girdi.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);

const varOlan = mevcutKelimeler();
const eklenecek = [];
const atlanan = [];
const bozuk = [];
const buSeferde = new Set();

for (const satir of satirlar) {
  const parcalar = satir.split(AYRAC).map((p) => p.trim());
  if (parcalar.length !== 7) {
    bozuk.push(`${parcalar[0] ?? satir}: ${parcalar.length} sutun, 7 olmali`);
    continue;
  }
  const [kelime, ...kalan] = parcalar;
  const zorluk = Number(kalan[5]);
  if (!(zorluk >= 1 && zorluk <= 5)) {
    bozuk.push(`${kelime}: zorluk "${kalan[5]}" gecersiz`);
    continue;
  }
  if (varOlan.has(kelime)) {
    atlanan.push(`${kelime} (zaten ${varOlan.get(kelime)} icinde)`);
    continue;
  }
  if (buSeferde.has(kelime)) {
    atlanan.push(`${kelime} (bu partide iki kez)`);
    continue;
  }
  buSeferde.add(kelime);
  eklenecek.push(parcalar);
}

const { kartlar: onceki } = csvAyristir(readFileSync(hedefYol, 'utf-8'));
const tumSatirlar = [
  BASLIK.join(AYRAC),
  ...onceki.map((k) => [k.kelime, ...k.yasaklilar, k.zorluk].join(AYRAC)),
  ...eklenecek.map((p) => p.join(AYRAC)),
];
writeFileSync(hedefYol, BOM + tumSatirlar.join('\r\n') + '\r\n', 'utf-8');

console.log(`\n${hedefKategori}: ${onceki.length} -> ${onceki.length + eklenecek.length} kart` +
            `  (+${eklenecek.length})`);
if (atlanan.length) {
  console.log(`\n  ${atlanan.length} kart atlandi (tekillik):`);
  atlanan.slice(0, 12).forEach((a) => console.log('    ' + a));
  if (atlanan.length > 12) console.log(`    ... ve ${atlanan.length - 12} tane daha`);
}
if (bozuk.length) {
  console.log(`\n  ${bozuk.length} satir bozuk:`);
  bozuk.slice(0, 12).forEach((b) => console.log('    ' + b));
  process.exitCode = 1;
}
