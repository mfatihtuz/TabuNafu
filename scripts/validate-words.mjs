/**
 * Kelime kalite kapisi.
 *
 * Prototipteki ornek kartlari (ve ilerde icerik/kelimeler/*.csv dosyalarini)
 * denetler. Amac: 5.350 kartin hicbirinde sessiz kalite kaybi olmasin.
 *
 * Kontroller:
 *   1  Her kartta tam olarak 5 yasakli kelime
 *   2  Ana kelime kendi yasakli listesinde yok
 *   3  Yasakli kelime ana kelimenin govdesini icermiyor (KITAP -> KITAPLIK red)
 *   4  Ana kelime TUM kategorilerde global tekil
 *   5  Kart icinde yasakli kelimeler kendi aralarinda tekrar etmiyor
 *   6  Uzunluk siniri: ana 18, yasakli 14 karakter
 *   7  Sadece Turk alfabesi, rakam ve bosluk
 *   8  Tumu buyuk harf (Turkce kurallarina gore)
 *   9  Zorluk 1-5 araliginda
 *  10  Zorluk dagilimi hedefe yakin (%10/%35/%35/%15/%5)
 *
 * Calistirma:  node scripts/validate-words.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');

const ANA_UZUNLUK = 18;
const YASAKLI_UZUNLUK = 14;
// Duzeltme isaretli harfler de gecerli Turkce: kagit, hal, zekat, hikaye
const GECERLI_HARF = /^[A-ZÂÇĞİÎÖŞÜÛ0-9 ]+$/;
const HEDEF_DAGILIM = { 1: 10, 2: 35, 3: 35, 4: 15, 5: 5 };

/** Turkce'ye ozel buyuk harf. JS toUpperCase() 'i' harfini 'I' yapar, bu yanlis. */
function trUpper(metin) {
  return metin
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toUpperCase();
}

/**
 * Turkce govde benzerligi. Ekler soyulup kok karsilastirilir.
 * KITAP <-> KITAPLIK yakalanir, ama KAR <-> KARTAL yakalanmaz (kok cok kisa).
 */
function govdeCakisiyorMu(ana, yasakli) {
  const a = ana.replace(/\s/g, '');
  const y = yasakli.replace(/\s/g, '');
  if (a.length < 4 || y.length < 4) return false;
  const kisa = Math.min(a.length, y.length);
  const kok = Math.max(4, Math.floor(kisa * 0.75));
  return a.slice(0, kok) === y.slice(0, kok);
}

/** Prototip HTML'inden KARTLAR sozlugunu cikarir. */
function prototiptenOku() {
  const html = readFileSync(join(KOK, 'tasarim', 'prototip.html'), 'utf-8');
  const bas = html.indexOf('const KARTLAR = {');
  if (bas < 0) throw new Error('KARTLAR bulunamadi');
  const govdeBas = html.indexOf('{', bas);
  let derinlik = 0, son = govdeBas;
  for (let i = govdeBas; i < html.length; i++) {
    if (html[i] === '{') derinlik++;
    else if (html[i] === '}') { derinlik--; if (derinlik === 0) { son = i + 1; break; } }
  }
  return Function('"use strict";return ' + html.slice(govdeBas, son))();
}

const kartlar = prototiptenOku();
const hatalar = [];
const uyarilar = [];
const globalAna = new Map();
const zorlukSayaci = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
let toplamKart = 0;

for (const [kategori, liste] of Object.entries(kartlar)) {
  liste.forEach((kart, sira) => {
    toplamKart++;
    const yer = `${kategori}[${sira}]`;
    const ana = kart[0];
    const yasaklilar = kart.slice(1, 6);
    const zorluk = kart[6];

    // 1  Tam 5 yasakli
    if (kart.length !== 7) {
      hatalar.push(`${yer} "${ana}": ${kart.length - 2} yasakli kelime, 5 olmali`);
    }

    // 2  Ana kelime kendi listesinde
    if (yasaklilar.includes(ana)) {
      hatalar.push(`${yer} "${ana}": ana kelime kendi yasakli listesinde`);
    }

    // 3  Govde cakismasi
    for (const y of yasaklilar) {
      if (y && govdeCakisiyorMu(ana, y)) {
        hatalar.push(`${yer} "${ana}": yasakli "${y}" ayni govdeden`);
      }
    }

    // 4  Global tekillik
    if (globalAna.has(ana)) {
      hatalar.push(`${yer} "${ana}": ${globalAna.get(ana)} icinde de var`);
    } else {
      globalAna.set(ana, kategori);
    }

    // 5  Kart ici tekrar
    const tekil = new Set(yasaklilar);
    if (tekil.size !== yasaklilar.length) {
      hatalar.push(`${yer} "${ana}": yasakli kelimeler kendi arasinda tekrar ediyor`);
    }

    // 6  Uzunluk
    if (ana.length > ANA_UZUNLUK) {
      hatalar.push(`${yer} "${ana}": ana kelime ${ana.length} karakter, en fazla ${ANA_UZUNLUK}`);
    }
    for (const y of yasaklilar) {
      if (y && y.length > YASAKLI_UZUNLUK) {
        hatalar.push(`${yer} "${ana}": yasakli "${y}" ${y.length} karakter, en fazla ${YASAKLI_UZUNLUK}`);
      }
    }

    // 7 + 8  Karakter kumesi ve buyuk harf
    for (const kelime of [ana, ...yasaklilar]) {
      if (!kelime) continue;
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
  });
}

console.log('\nKelime kalite kapisi\n');
console.log(`  ${Object.keys(kartlar).length} kategori, ${toplamKart} kart, `
          + `${toplamKart * 6} kelime denetlendi\n`);

// 10  Zorluk dagilimi
console.log('  Zorluk dagilimi (hedef -> gercek)');
const ETIKET = { 1:'cok kolay', 2:'kolay', 3:'orta', 4:'zor', 5:'cok zor' };
for (const seviye of [1, 2, 3, 4, 5]) {
  const yuzde = (zorlukSayaci[seviye] / toplamKart) * 100;
  const hedef = HEDEF_DAGILIM[seviye];
  const sapma = Math.abs(yuzde - hedef);
  const cubuk = '#'.repeat(Math.round(yuzde / 2)).padEnd(20, '.');
  const im = sapma <= 12 ? ' ' : '!';
  console.log(`   ${im} ${seviye} ${ETIKET[seviye].padEnd(10)} ${cubuk} `
            + `%${yuzde.toFixed(0).padStart(2)} (hedef %${hedef})`);
  if (sapma > 12) {
    uyarilar.push(`Zorluk ${seviye} (${ETIKET[seviye]}): %${yuzde.toFixed(0)}, hedef %${hedef}`);
  }
}

console.log('');
if (uyarilar.length) {
  console.log('  UYARI');
  uyarilar.forEach(u => console.log('    ' + u));
  console.log('');
}

if (hatalar.length) {
  console.log(`  ${hatalar.length} HATA\n`);
  hatalar.forEach(h => console.log('    ' + h));
  console.log('');
  process.exit(1);
}

console.log('  Tum kontroller gecti.\n');
