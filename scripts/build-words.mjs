/**
 * Kelime boru hatti.  CSV (kaynak)  ->  JSON (uygulamanin okudugu)
 *
 * Kaynak dosyalar icerik/kelimeler/*.csv icinde durur ve Excel'de
 * duzenlenebilir. Uretilen JSON assets/kelimeler/ altina yazilir ve
 * depoya islenir, boylece EAS Build ek adim istemez.
 *
 * IKI TEKNIK ZORUNLULUK
 *
 *   Ayrac noktali virgul.  Turkce Excel virgulu ondalik ayraci sayar,
 *   virgullu CSV'yi tek sutuna sikistirir.
 *
 *   UTF-8 BOM.  Olmazsa Excel Turkce harfleri bozuk gosterir.
 *
 * JSON'da kartlar dizi olarak saklanir:  [kelime, y1..y5, zorluk]
 * 5.350 kartta nesne bicimi yaklasik uc kat yer tutardi.
 *
 * Calistirma:  npm run build:words
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const KAYNAK_KLASOR = join(KOK, 'icerik', 'kelimeler');
const CIKTI_KLASOR = join(KOK, 'assets', 'kelimeler');

export const AYRAC = ';';
export const BOM = '﻿';
export const BASLIK = ['kelime', 'yasakli1', 'yasakli2', 'yasakli3',
                       'yasakli4', 'yasakli5', 'zorluk'];

/** CSV metnini satirlara ayirir. BOM ve Windows satir sonlarini temizler. */
export function csvAyristir(metin) {
  const temiz = metin.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const satirlar = temiz.split('\n').filter((s) => s.trim().length > 0);
  if (satirlar.length === 0) return { baslik: [], kartlar: [] };

  const baslik = satirlar[0].split(AYRAC).map((h) => h.trim());
  const kartlar = satirlar.slice(1).map((satir, i) => {
    const hucreler = satir.split(AYRAC).map((h) => h.trim());
    return {
      satirNo: i + 2,                       // 1 baslik + 1 tabanli
      kelime: hucreler[0] ?? '',
      yasaklilar: hucreler.slice(1, 6),
      zorluk: Number(hucreler[6] ?? 3),
    };
  });
  return { baslik, kartlar };
}

/** Kart nesnelerini CSV metnine cevirir. BOM ile birlikte. */
export function csvYaz(kartlar) {
  const satirlar = [BASLIK.join(AYRAC)];
  for (const k of kartlar) {
    satirlar.push([k.kelime, ...k.yasaklilar, k.zorluk].join(AYRAC));
  }
  return BOM + satirlar.join('\r\n') + '\r\n';
}

function main() {
  mkdirSync(CIKTI_KLASOR, { recursive: true });

  let dosyalar;
  try {
    dosyalar = readdirSync(KAYNAK_KLASOR).filter((d) => d.endsWith('.csv')).sort();
  } catch {
    console.error(`Kaynak klasor bulunamadi: ${KAYNAK_KLASOR}`);
    process.exit(1);
  }

  if (dosyalar.length === 0) {
    console.error('icerik/kelimeler icinde CSV yok.');
    process.exit(1);
  }

  console.log('\nKelime boru hatti  CSV -> JSON\n');
  console.log(`  ${'kategori'.padEnd(24)} ${'kart'.padStart(5)}  ${'boyut'.padStart(8)}`);
  console.log('  ' + '-'.repeat(42));

  const dizin = [];
  let toplamKart = 0;
  const hatalar = [];

  for (const dosya of dosyalar) {
    const kimlik = basename(dosya, '.csv');
    const ham = readFileSync(join(KAYNAK_KLASOR, dosya), 'utf-8');
    const { baslik, kartlar } = csvAyristir(ham);

    if (baslik.join(AYRAC) !== BASLIK.join(AYRAC)) {
      hatalar.push(`${dosya}: baslik satiri beklenenden farkli\n` +
                   `    beklenen: ${BASLIK.join(AYRAC)}\n` +
                   `    bulunan : ${baslik.join(AYRAC)}`);
      continue;
    }

    const diziler = kartlar.map((k) => [k.kelime, ...k.yasaklilar, k.zorluk]);
    const cikti = JSON.stringify(diziler);
    writeFileSync(join(CIKTI_KLASOR, `${kimlik}.json`), cikti, 'utf-8');

    dizin.push({ kimlik, kart: diziler.length });
    toplamKart += diziler.length;
    console.log(`  ${kimlik.padEnd(24)} ${String(diziler.length).padStart(5)}  ` +
                `${(cikti.length / 1024).toFixed(1).padStart(6)} KB`);
  }

  if (hatalar.length) {
    console.error('\nHATA');
    hatalar.forEach((h) => console.error('  ' + h));
    process.exit(1);
  }

  writeFileSync(join(CIKTI_KLASOR, 'dizin.json'),
                JSON.stringify(dizin, null, 2), 'utf-8');

  console.log('  ' + '-'.repeat(42));
  console.log(`  ${'TOPLAM'.padEnd(24)} ${String(toplamKart).padStart(5)}`);
  console.log(`\n  -> assets/kelimeler/  (${dizin.length} kategori + dizin.json)\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
