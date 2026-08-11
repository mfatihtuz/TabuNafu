/**
 * Prototip duman testi.
 *
 * Gercek tarayicida prototipi acar, bir oyun serisini bastan sona oynar
 * ve her adimda ekran goruntusu alir. Konsol hatalarini yakalar.
 *
 * Calistirma:  node scripts/test-prototip.mjs
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const CIKTI = join(KOK, 'tasarim', 'ekranlar');
mkdirSync(CIKTI, { recursive: true });

const TELEFON = { width: 402, height: 874 };   // iPhone 16 olculeri

const hatalar = [];
let adim = 0;

async function cek(sayfa, ad) {
  adim++;
  const dosya = join(CIKTI, `${String(adim).padStart(2, '0')}-${ad}.png`);
  await sayfa.screenshot({ path: dosya });
  console.log(`  ${String(adim).padStart(2, '0')}  ${ad}`);
}

const tarayici = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const baglam = await tarayici.newContext({
  viewport: TELEFON,
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: 'tr-TR',
});
const sayfa = await baglam.newPage();

sayfa.on('console', m => {
  if (m.type() === 'error') hatalar.push('KONSOL: ' + m.text());
});
sayfa.on('pageerror', e => hatalar.push('SAYFA: ' + e.message));

await sayfa.goto('file://' + join(KOK, 'tasarim', 'prototip-derli.html'));
await sayfa.waitForTimeout(700);

console.log('\nEkranlar:');
await cek(sayfa, 'ana');

// --- Yazi tipi gercekten yuklendi mi ---
const fontTamam = await sayfa.evaluate(async () => {
  await document.fonts.ready;
  return {
    fredoka: document.fonts.check('600 40px Fredoka'),
    manrope: document.fonts.check('800 16px Manrope'),
    sayi: document.fonts.size,
  };
});
console.log('\nYazi tipi:', JSON.stringify(fontTamam));

// --- Turkce karakter olcumu (tofu kontrolu) ---
const turkceTamam = await sayfa.evaluate(() => {
  const ol = (yazi, font) => {
    const t = document.createElement('span');
    t.style.cssText = `position:absolute;visibility:hidden;font:600 40px ${font}`;
    t.textContent = yazi;
    document.body.appendChild(t);
    const g = t.getBoundingClientRect().width;
    t.remove();
    return g;
  };
  // Turkce harfler dogru cizilmiyorsa genislik .notdef kutusuna kayar
  return {
    fredoka_tr: Math.round(ol('ŞĞİıÇÖÜ', 'Fredoka')),
    fredoka_ascii: Math.round(ol('SGIiCOU', 'Fredoka')),
    manrope_tr: Math.round(ol('ŞĞİıÇÖÜ', 'Manrope')),
    manrope_ascii: Math.round(ol('SGIiCOU', 'Manrope')),
  };
});
console.log('Turkce genislik:', JSON.stringify(turkceTamam));

// --- Nasil oynanir ---
await sayfa.click('text=Nasıl Oynanır');
await sayfa.waitForTimeout(420);
await cek(sayfa, 'nasil-oynanir');
await sayfa.click('#e-nasil .geri');
await sayfa.waitForTimeout(380);

// --- Sesler ---
await sayfa.click('text=Sesleri Dinle');
await sayfa.waitForTimeout(420);
await cek(sayfa, 'sesler');
await sayfa.click('#e-sesler .geri');
await sayfa.waitForTimeout(380);

// --- Takimlar ---
await sayfa.click('text=Yeni Oyun');
await sayfa.waitForTimeout(420);
await cek(sayfa, 'takimlar');

// Oyuncu isimleri togglesi
await sayfa.click('#isim-toggle');
await sayfa.waitForTimeout(420);
await sayfa.fill('input[data-t="0"][data-oyuncu="0"]', 'Fatih');
await sayfa.fill('input[data-t="0"][data-oyuncu="1"]', 'Ayşe');
await cek(sayfa, 'takimlar-isimli');
await sayfa.click('#isim-toggle');
await sayfa.waitForTimeout(320);

await sayfa.click('#e-takimlar .btn-ana');
await sayfa.waitForTimeout(420);
await cek(sayfa, 'ayarlar');

// Son kart hakkini ac ki mekanigi test edebilelim
await sayfa.click('#sonkart-toggle');
await sayfa.waitForTimeout(260);

// Sureyi en kisaya cek (30sn) - test hizlansin
await sayfa.click('#sure-ray .pul[data-d="30"]');
await sayfa.waitForTimeout(320);
await cek(sayfa, 'ayarlar-secili');

await sayfa.click('#e-ayarlar .btn-ana');
await sayfa.waitForTimeout(420);
await cek(sayfa, 'kategori');

// --- Tur ---
await sayfa.click('[data-kat="cografya"]');
await sayfa.waitForTimeout(420);
await cek(sayfa, 'sira');

await sayfa.click('#basla-btn');
await sayfa.waitForTimeout(2700);          // 3-2-1 geri sayim
await cek(sayfa, 'tur');

// Birkac kart isle
await sayfa.click('#btn-dogru');  await sayfa.waitForTimeout(560);
await sayfa.click('#btn-dogru');  await sayfa.waitForTimeout(560);
await sayfa.click('#btn-yanlis'); await sayfa.waitForTimeout(560);
await sayfa.click('#btn-pas');    await sayfa.waitForTimeout(560);
await sayfa.click('#btn-pas');    await sayfa.waitForTimeout(560);
await cek(sayfa, 'tur-islenmis');

// Pas hakkini tuket, kilitlenmeli
await sayfa.click('#btn-pas');    await sayfa.waitForTimeout(560);
const pasKilitli = await sayfa.evaluate(
  () => document.getElementById('btn-pas').classList.contains('kilitli'));
console.log('\nPas 3/3 sonrasi kilitlendi mi:', pasKilitli);
await cek(sayfa, 'tur-pas-kilitli');

// --- Deste bitene kadar bas (Cografya 10 kart) ---
for (let i = 0; i < 12; i++) {
  const acik = await sayfa.evaluate(
    () => document.getElementById('ortu').classList.contains('acik'));
  if (acik) break;
  await sayfa.click('#btn-dogru');
  await sayfa.waitForTimeout(420);
}
const desteModali = await sayfa.evaluate(
  () => document.getElementById('ortu').classList.contains('acik'));
console.log('Deste bitince modal cikti mi:', desteModali);
if (desteModali) await cek(sayfa, 'deste-bitti');

// Yeniden karistir - puan korunmali
const puanOnce = await sayfa.evaluate(() => document.getElementById('say-dogru').textContent);
if (desteModali) {
  await sayfa.click('#modal-birinci');
  await sayfa.waitForTimeout(620);
}
const puanSonra = await sayfa.evaluate(() => document.getElementById('say-dogru').textContent);
console.log(`Yeniden karistirmada puan korundu mu: ${puanOnce} -> ${puanSonra}`);

// --- Son kart mekanigi: sureyi zorla bitir ---
await sayfa.evaluate(() => { oyun.kalanSaniye = 1; });
await sayfa.waitForTimeout(1500);
const sonKart = await sayfa.evaluate(() => ({
  aktif: oyun.sonKartModuAktif,
  kartKirmizi: document.getElementById('kart').classList.contains('sonkart'),
  pasKilitli: document.getElementById('btn-pas').classList.contains('kilitli'),
  rozet: !!document.querySelector('.kart-rozet'),
  kalan: oyun.kalanSaniye,
}));
console.log('Son kart modu:', JSON.stringify(sonKart));
await cek(sayfa, 'son-kart');

// Son kartta dogru bas -> tur bitmeli
await sayfa.click('#btn-dogru');
await sayfa.waitForTimeout(620);
await cek(sayfa, 'tur-ozeti');

await sayfa.click('#ozet-devam');
await sayfa.waitForTimeout(520);
await cek(sayfa, 'sira-ikinci-takim');

// --- Kazanan ekrani ---
await sayfa.evaluate(() => {
  oyun.takimlar[0].puan = 31;
  oyun.takimlar[1].puan = 24;
  kazananGoster();
});
await sayfa.waitForTimeout(520);
await cek(sayfa, 'kazanan');

// --- Masaustu gorunum ---
const genis = await baglam.newPage();
await genis.setViewportSize({ width: 1500, height: 1000 });
await genis.goto('file://' + join(KOK, 'tasarim', 'prototip-derli.html'));
await genis.waitForTimeout(900);
adim++;
await genis.screenshot({ path: join(CIKTI, `${adim}-masaustu.png`), fullPage: false });
console.log(`  ${adim}  masaustu`);

// --- Yatay tasma kontrolu ---
const tasma = await sayfa.evaluate(() => ({
  govde: document.documentElement.scrollWidth,
  gorunum: window.innerWidth,
}));
console.log('\nYatay tasma:', JSON.stringify(tasma),
  tasma.govde > tasma.gorunum ? '  <-- TASMA VAR' : '  temiz');

await tarayici.close();

console.log('\n' + '='.repeat(52));
if (hatalar.length) {
  console.log('HATALAR:');
  hatalar.forEach(h => console.log('  ' + h));
  process.exit(1);
}
console.log('Konsol hatasi yok. Tum akis calisti.');
