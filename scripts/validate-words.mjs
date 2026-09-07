/**
 * Kelime kalite kapisi.
 *
 * Kaynak: icerik/kelimeler/*.csv
 * Amac: 5.350 kartin hicbirinde sessiz kalite kaybi olmasin.
 *
 * KONTROLLER
 *   1  Her kartta tam olarak 5 yasakli kelime, hicbiri bos degil
 *   2  Ana kelime kendi yasakli listesinde yok
 *   3  Yasakli kelime ana kelimenin govdesini icermiyor (KITAP -> KITAPLIK red)
 *   4  Ana kelime TUM kategorilerde global tekil
 *   5  Kart icinde yasakli kelimeler kendi aralarinda tekrar etmiyor
 *   6  Uzunluk siniri: ana 18, yasakli 14 karakter
 *   7  Sadece Turk alfabesi, rakam ve bosluk
 *   8  Tumu buyuk harf (Turkce kurallarina gore)
 *   9  Zorluk 1-5 araliginda
 *  10  Zorluk dagilimi hedefe yakin (%10/%35/%35/%15/%5)
 *  11  Uretilen JSON kaynak CSV ile senkron
 *  12  Kategori basina asgari kart (--kesin bayragiyla)
 *  13  Tek hamlede cozulen tuzak yok: ana kelimenin zit/es anlamlisi
 *      yasakli listede olmali. Yoksa anlatan "sicak degil" deyip
 *      isi bitiriyor ve bes yasakli kelime hicbir ise yaramiyor.
 *
 * Kullanim
 *   node scripts/validate-words.mjs           uyari modu, eksik kart hata degil
 *   node scripts/validate-words.mjs --kesin   asgari kart sayisi da zorunlu
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';

import { csvAyristir } from './build-words.mjs';
import { ES_ANLAMLILAR, MUAFLAR, ZIT_ESLER } from '../icerik/kolay-ipucu.mjs';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const KAYNAK_KLASOR = join(KOK, 'icerik', 'kelimeler');
const JSON_KLASOR = join(KOK, 'assets', 'kelimeler');

const KESIN = process.argv.includes('--kesin');

const ANA_UZUNLUK = 18;
const YASAKLI_UZUNLUK = 14;
// Duzeltme isaretli harfler de gecerli Turkce: kagit, hal, zekat, hikaye
const GECERLI_HARF = /^[A-ZÂÇĞİÎÖŞÜÛ0-9 ]+$/;
const HEDEF_DAGILIM = { 1: 10, 2: 35, 3: 35, 4: 15, 5: 5 };

/** Kategori basina hedef kart sayisi. Genel digerlerinden fazla. */
const HEDEF_KART = { genel: 600 };
const VARSAYILAN_HEDEF = 250;

/** Turkce'ye ozel buyuk harf. JS toUpperCase() 'i' harfini 'I' yapar. */
function trUpper(metin) {
  let cikti = '';
  for (const harf of metin) {
    cikti += harf === 'i' ? 'İ' : harf === 'ı' ? 'I' : harf.toUpperCase();
  }
  return cikti;
}

/**
 * Turkce govde benzerligi. KITAP <-> KITAPLIK yakalanir,
 * ama KAR <-> KARTAL yakalanmaz (kok cok kisa kalir).
 */
function govdeCakisiyorMu(ana, yasakli) {
  const a = ana.replace(/\s/g, '');
  const y = yasakli.replace(/\s/g, '');
  if (a.length < 4 || y.length < 4) return false;
  const kok = Math.max(4, Math.floor(Math.min(a.length, y.length) * 0.75));
  return a.slice(0, kok) === y.slice(0, kok);
}

/**
 * Ana kelime -> zorunlu yasakli esleri. Liste iki yonlu okunur.
 */
const esHaritasi = new Map();
for (const [a, b] of [...ZIT_ESLER, ...ES_ANLAMLILAR]) {
  for (const [x, y] of [[a, b], [b, a]]) {
    if (!esHaritasi.has(x)) esHaritasi.set(x, []);
    esHaritasi.get(x).push(y);
  }
}

const muafKume = new Set(MUAFLAR.map((m) => `${m.kategori}|${m.kelime}|${m.es}`));

/** Yasakli kelime esi engelliyor mu - tam sozcuk ya da ayni govde. */
function esiEngelliyorMu(yasakli, es) {
  if (yasakli === es) return true;
  if (yasakli.split(' ').includes(es)) return true;
  const y = yasakli.replace(/\s/g, '');
  const e = es.replace(/\s/g, '');
  if (y.length < 4 || e.length < 4) return false;
  const kok = Math.max(4, Math.floor(Math.min(y.length, e.length) * 0.75));
  return y.slice(0, kok) === e.slice(0, kok);
}

const hatalar = [];
const uyarilar = [];
const globalAna = new Map();
const zorlukSayaci = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
const kategoriSayilari = [];
let toplamKart = 0;

const dosyalar = readdirSync(KAYNAK_KLASOR).filter((d) => d.endsWith('.csv')).sort();
if (dosyalar.length === 0) {
  console.error('icerik/kelimeler icinde CSV yok.');
  process.exit(1);
}

for (const dosya of dosyalar) {
  const kategori = basename(dosya, '.csv');
  const { kartlar } = csvAyristir(readFileSync(join(KAYNAK_KLASOR, dosya), 'utf-8'));
  kategoriSayilari.push({ kategori, adet: kartlar.length });

  for (const kart of kartlar) {
    toplamKart++;
    const yer = `${dosya}:${kart.satirNo}`;
    const { kelime: ana, yasaklilar, zorluk } = kart;

    // 1  Tam 5 yasakli, hicbiri bos
    const dolu = yasaklilar.filter((y) => y && y.length > 0);
    if (dolu.length !== 5) {
      hatalar.push(`${yer} "${ana}": ${dolu.length} yasakli kelime, 5 olmali`);
    }

    // 2  Ana kelime kendi listesinde
    if (yasaklilar.includes(ana)) {
      hatalar.push(`${yer} "${ana}": ana kelime kendi yasakli listesinde`);
    }

    // 3  Govde cakismasi
    for (const y of dolu) {
      if (govdeCakisiyorMu(ana, y)) {
        hatalar.push(`${yer} "${ana}": yasakli "${y}" ayni govdeden`);
      }
    }

    // 4  Global tekillik
    if (globalAna.has(ana)) {
      hatalar.push(`${yer} "${ana}": ${globalAna.get(ana)} icinde de var`);
    } else {
      globalAna.set(ana, kategori);
    }

    // 13  Tek hamlede cozulen tuzak
    for (const es of esHaritasi.get(ana) ?? []) {
      if (muafKume.has(`${kategori}|${ana}|${es}`)) continue;
      if (!dolu.some((y) => esiEngelliyorMu(y, es))) {
        hatalar.push(
          `${yer} "${ana}": "${es}" yasaklanmamis, tek hamlede cozulur`,
        );
      }
    }

    // 5  Kart ici tekrar
    if (new Set(dolu).size !== dolu.length) {
      hatalar.push(`${yer} "${ana}": yasakli kelimeler kendi arasinda tekrar ediyor`);
    }

    // 6  Uzunluk
    if (ana.length > ANA_UZUNLUK) {
      hatalar.push(`${yer} "${ana}": ana kelime ${ana.length} karakter, en fazla ${ANA_UZUNLUK}`);
    }
    for (const y of dolu) {
      if (y.length > YASAKLI_UZUNLUK) {
        hatalar.push(`${yer} "${ana}": yasakli "${y}" ${y.length} karakter, en fazla ${YASAKLI_UZUNLUK}`);
      }
    }

    // 7 + 8  Karakter kumesi ve buyuk harf
    for (const kelime of [ana, ...dolu]) {
      if (!GECERLI_HARF.test(kelime)) {
        hatalar.push(`${yer}: "${kelime}" gecersiz karakter iceriyor`);
      }
      if (trUpper(kelime) !== kelime) {
        hatalar.push(`${yer}: "${kelime}" buyuk harf degil (olmasi gereken: ${trUpper(kelime)})`);
      }
    }

    // 9  Zorluk
    if (!(zorluk >= 1 && zorluk <= 5)) {
      hatalar.push(`${yer} "${ana}": zorluk ${zorluk}, 1-5 arasinda olmali`);
    } else {
      zorlukSayaci[zorluk]++;
    }
  }
}

console.log('\nKelime kalite kapisi\n');
console.log(`  ${dosyalar.length} kategori, ${toplamKart} kart, ` +
            `${toplamKart * 6} kelime denetlendi\n`);

// 12  Kategori doluluk
console.log('  Kategori doluluk');
let eksikToplam = 0;
for (const { kategori, adet } of kategoriSayilari) {
  const hedef = HEDEF_KART[kategori] ?? VARSAYILAN_HEDEF;
  const oran = adet / hedef;
  const dolu = Math.round(oran * 18);
  const cubuk = '#'.repeat(Math.min(18, dolu)).padEnd(18, '.');
  const tam = adet >= hedef;
  if (!tam) eksikToplam += hedef - adet;
  console.log(`   ${tam ? ' ' : '!'} ${kategori.padEnd(12)} ${cubuk} ` +
              `${String(adet).padStart(4)}/${hedef}`);
  if (!tam) {
    const mesaj = `${kategori}: ${adet}/${hedef} kart (${hedef - adet} eksik)`;
    (KESIN ? hatalar : uyarilar).push(mesaj);
  }
}
if (eksikToplam > 0) {
  console.log(`\n     Toplam ${eksikToplam} kart eksik` +
              (KESIN ? '' : '  (uyari modu, --kesin ile hata olur)'));
}

// 10  Zorluk dagilimi
console.log('\n  Zorluk dagilimi (hedef -> gercek)');
const ETIKET = { 1: 'cok kolay', 2: 'kolay', 3: 'orta', 4: 'zor', 5: 'cok zor' };
for (const seviye of [1, 2, 3, 4, 5]) {
  const yuzde = toplamKart ? (zorlukSayaci[seviye] / toplamKart) * 100 : 0;
  const hedef = HEDEF_DAGILIM[seviye];
  const sapma = Math.abs(yuzde - hedef);
  const cubuk = '#'.repeat(Math.round(yuzde / 2)).padEnd(20, '.');
  console.log(`   ${sapma <= 12 ? ' ' : '!'} ${seviye} ${ETIKET[seviye].padEnd(10)} ` +
              `${cubuk} %${yuzde.toFixed(0).padStart(2)} (hedef %${hedef})`);
  if (sapma > 12) {
    uyarilar.push(`Zorluk ${seviye} (${ETIKET[seviye]}): %${yuzde.toFixed(0)}, hedef %${hedef}`);
  }
}

// 11  JSON senkron mu
console.log('');
const senkronsuz = [];
for (const dosya of dosyalar) {
  const kategori = basename(dosya, '.csv');
  const jsonYol = join(JSON_KLASOR, `${kategori}.json`);
  if (!existsSync(jsonYol)) {
    senkronsuz.push(`${kategori}: JSON uretilmemis`);
    continue;
  }
  const { kartlar } = csvAyristir(readFileSync(join(KAYNAK_KLASOR, dosya), 'utf-8'));
  const uretilen = JSON.parse(readFileSync(jsonYol, 'utf-8'));
  const beklenen = kartlar.map((k) => [k.kelime, ...k.yasaklilar, k.zorluk]);
  if (JSON.stringify(uretilen) !== JSON.stringify(beklenen)) {
    senkronsuz.push(`${kategori}: JSON kaynak CSV ile ayrismis`);
  }
}
if (senkronsuz.length) {
  hatalar.push(...senkronsuz, 'Cozum: npm run build:words');
  console.log('  JSON senkron degil');
} else {
  console.log('  JSON kaynak CSV ile senkron');
}

if (uyarilar.length) {
  console.log('\n  UYARI');
  uyarilar.forEach((u) => console.log('    ' + u));
}

if (hatalar.length) {
  console.log(`\n  ${hatalar.length} HATA\n`);
  hatalar.slice(0, 40).forEach((h) => console.log('    ' + h));
  if (hatalar.length > 40) console.log(`    ... ve ${hatalar.length - 40} tane daha`);
  console.log('');
  process.exit(1);
}

console.log('\n  Tum kontroller gecti.\n');
