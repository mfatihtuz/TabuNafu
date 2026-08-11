/**
 * Yerlesim denetimi.
 *
 * Goz karariyla degil, olcerek kontrol eder:
 *   1  Ikonlar kapsayicilarinin tam merkezinde mi (yatay + dikey)
 *   2  Dokunma hedefleri en az 44x44 mi (Apple/Google esigi)
 *   3  Metinler kapsayicilarindan tasiyor mu
 *   4  Kart icindeki ogeler ust uste biniyor mu
 *   5  Yatay kaydirma var mi
 *   6  Turkce harflerin kuyruklari kirpiliyor mu (S G C I)
 *   7  Ayni hizada durmasi gereken ogeler ayni hizada mi
 *
 * Calistirma:  node scripts/audit-yerlesim.mjs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOLERANS = 1.0;          // piksel
let sorun = 0;

function bildir(gecti, ad, ek = '') {
  console.log(`  ${gecti ? 'TAMAM' : 'SORUN'}  ${ad}${ek ? '   ' + ek : ''}`);
  if (!gecti) sorun++;
}

const tarayici = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const sayfa = await tarayici.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2 });
const hatalar = [];
sayfa.on('pageerror', e => hatalar.push(e.message));
await sayfa.goto('file://' + join(KOK, 'tasarim', 'prototip-derli.html'));
await sayfa.evaluate(() => document.fonts.ready);
await sayfa.waitForTimeout(600);

/* Tarayici icinde kullanilacak yardimcilar */
await sayfa.addScriptTag({
  content: `
  window.merkezSapmasi = (kapsayiciSecici, cocukSecici) => {
    const sonuc = [];
    document.querySelectorAll(kapsayiciSecici).forEach((kap, i) => {
      const c = kap.querySelector(cocukSecici);
      if (!c) return;
      const k = kap.getBoundingClientRect(), y = c.getBoundingClientRect();
      if (k.width === 0 || y.width === 0) return;
      sonuc.push({
        i,
        yatay: +((y.left + y.width / 2) - (k.left + k.width / 2)).toFixed(2),
        dikey: +((y.top + y.height / 2) - (k.top + k.height / 2)).toFixed(2),
      });
    });
    return sonuc;
  };
  window.tasmaVar = (secici) => {
    const liste = [];
    document.querySelectorAll(secici).forEach(e => {
      if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) {
        liste.push({ metin: (e.textContent || '').trim().slice(0, 24),
                     ic: e.scrollWidth, dis: e.clientWidth,
                     icY: e.scrollHeight, disY: e.clientHeight });
      }
    });
    return liste;
  };
  `,
});

console.log('\nYerlesim denetimi\n');

/* --- 1. Aksiyon butonlarindaki ikonlar --- */
await sayfa.evaluate(() => {
  ayarlar.sure = 90; kategoriSec('genel'); turBaslat(); sayaciDurdur();
});
await sayfa.waitForTimeout(400);

const yuvarlakIkon = await sayfa.evaluate(() => merkezSapmasi('.aksiyon .yuvarlak', 'svg'));
const enKotuYuvarlak = Math.max(...yuvarlakIkon.map(s => Math.max(Math.abs(s.yatay), Math.abs(s.dikey))));
bildir(enKotuYuvarlak <= TOLERANS, 'Aksiyon ikonlari yuvarlaklarinin merkezinde',
  `en buyuk sapma ${enKotuYuvarlak.toFixed(2)}px`);

/* --- 2. Dokunma hedefleri --- */
const kucukHedefler = await sayfa.evaluate(() => {
  const kucuk = [];
  document.querySelectorAll('.ekran.aktif button, .ekran.aktif [role="button"]').forEach(b => {
    const r = b.getBoundingClientRect();
    if (r.width === 0) return;
    if (r.width < 44 || r.height < 44) {
      kucuk.push({ metin: (b.textContent || b.id || '').trim().slice(0, 20),
                   g: Math.round(r.width), y: Math.round(r.height) });
    }
  });
  return kucuk;
});
bildir(kucukHedefler.length === 0, 'Tur ekrani dokunma hedefleri >= 44px',
  kucukHedefler.length ? JSON.stringify(kucukHedefler) : '');

/* --- 3. Kart ici ogeler ust uste binmiyor --- */
const kartBinme = await sayfa.evaluate(() => {
  const ana = document.getElementById('kart-ana').getBoundingClientRect();
  const ayrac = document.querySelector('.kart-ayrac').getBoundingClientRect();
  const liste = document.getElementById('kart-yasakli').getBoundingClientRect();
  const bant = document.querySelector('.kart-bant').getBoundingClientRect();
  return {
    bantAna: +(ana.top - bant.bottom).toFixed(1),
    anaAyrac: +(ayrac.top - ana.bottom).toFixed(1),
    ayracListe: +(liste.top - ayrac.bottom).toFixed(1),
  };
});
bildir(Object.values(kartBinme).every(v => v >= 0), 'Kart ici ogeler binmiyor',
  JSON.stringify(kartBinme));

/* --- 4. Turkce harf kuyruklari kirpilmiyor --- */
const kuyruk = await sayfa.evaluate(() => {
  const ana = document.getElementById('kart-ana');
  const olc = (yazi) => {
    ana.textContent = yazi;
    const r = ana.getBoundingClientRect();
    const menzil = document.createRange();
    menzil.selectNodeContents(ana);
    const g = menzil.getBoundingClientRect();
    return { kutu: +r.height.toFixed(1), yazi: +g.height.toFixed(1),
             tasma: +(g.bottom - r.bottom).toFixed(2) };
  };
  const sonuc = {
    kuyruklu: olc('ŞĞÇJQY'),      // alt kuyruklu harfler
    duz: olc('ABCDEF'),
    karisik: olc('ALIŞVERİŞ'),
  };
  ana.textContent = 'ALIŞVERİŞ';
  return sonuc;
});
const kirpilma = Math.max(kuyruk.kuyruklu.tasma, kuyruk.karisik.tasma);
bildir(kirpilma <= 0.5, 'Turkce harf kuyruklari kirpilmiyor',
  `en fazla ${kirpilma.toFixed(2)}px tasma`);

/* --- 5. Ust satir: kategori yazisi ve halka dikey hizada --- */
const ustHiza = await sayfa.evaluate(() => {
  const k = document.querySelector('.tur-kategori').getBoundingClientRect();
  const h = document.getElementById('halka-sar').getBoundingClientRect();
  return +(((k.top + k.height / 2) - (h.top + h.height / 2))).toFixed(2);
});
bildir(Math.abs(ustHiza) <= 2, 'Kategori basligi ile sure halkasi dikey hizada',
  `${ustHiza}px fark`);

/* --- 6. Sayac halkasi yazisi tam merkezde --- */
const halkaYazi = await sayfa.evaluate(() => merkezSapmasi('#halka-sar', '.halka-yazi'));
const halkaSapma = Math.max(...halkaYazi.map(s => Math.max(Math.abs(s.yatay), Math.abs(s.dikey))));
bildir(halkaSapma <= TOLERANS, 'Sure yazisi halkanin merkezinde', `${halkaSapma.toFixed(2)}px`);

/* --- 7. Kategori kutucuklarindaki ikonlar --- */
await sayfa.evaluate(() => ekranAc('e-kategori'));
await sayfa.waitForTimeout(350);
const diskIkon = await sayfa.evaluate(() => merkezSapmasi('.kutucuk .disk', 'svg'));
const diskSapma = Math.max(...diskIkon.map(s => Math.max(Math.abs(s.yatay), Math.abs(s.dikey))));
bildir(diskSapma <= TOLERANS, 'Kategori ikonlari disklerinin merkezinde',
  `${diskSapma.toFixed(2)}px, ${diskIkon.length} kutucuk`);

const kutucukTasma = await sayfa.evaluate(() => tasmaVar('.kutucuk span'));
bildir(kutucukTasma.length === 0, 'Kategori adlari kutucuga sigiyor',
  kutucukTasma.length ? JSON.stringify(kutucukTasma.slice(0, 3)) : '');

/* --- 8. Tur ozeti hiyerarsisi --- */
await sayfa.evaluate(() => {
  oyun.turDogru = 5; oyun.turYanlis = 1; oyun.turPas = 2; turuBitir();
});
await sayfa.waitForTimeout(350);
const ozet = await sayfa.evaluate(() => {
  const boy = (sec) => {
    const e = document.querySelector(sec);
    return e ? Math.round(parseFloat(getComputedStyle(e).fontSize)) : 0;
  };
  return {
    puan: boy('.ozet-puan'),
    skor: boy('.skor-satir .puan'),
    sayac: boy('.ozet-sayac b'),
    kelimeListesiVar: !!document.querySelector('#ozet-liste'),
  };
});
bildir(ozet.puan > ozet.skor && ozet.skor > ozet.sayac,
  'Ozet belirginlik sirasi: puan > takim farki > sayaclar',
  `${ozet.puan} > ${ozet.skor} > ${ozet.sayac}`);
bildir(!ozet.kelimeListesiVar, 'Ozette kelime listesi gosterilmiyor');

/* --- 8b. Turkce buyuk harf: CSS text-transform tuzagi --- */
const buyukHarfSorunu = await sayfa.evaluate(() => {
  const trUst = (m) => m.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
  const kotu = [];
  document.querySelectorAll('*').forEach(e => {
    if (getComputedStyle(e).textTransform !== 'uppercase') return;
    const metin = [...e.childNodes]
      .filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!metin) return;
    // Tarayicinin varsayilan buyuk harfi ile Turkce dogrusu farkliysa risk var
    if (metin.toUpperCase() !== trUst(metin)) {
      kotu.push({ metin: metin.slice(0, 30), dogru: trUst(metin), yanlis: metin.toUpperCase() });
    }
  });
  return kotu;
});
bildir(buyukHarfSorunu.length === 0,
  'Buyuk harfe cevrilen metinlerde Turkce i/I tuzagi yok',
  buyukHarfSorunu.length ? JSON.stringify(buyukHarfSorunu.slice(0, 4)) : '');

/* --- 9. Yatay tasma (tum ekranlar) --- */
const ekranlar = ['e-ana','e-nasil','e-takimlar','e-ayarlar','e-kategori','e-sira','e-tur','e-ozet','e-sesler'];
let tasanEkran = [];
for (const e of ekranlar) {
  await sayfa.evaluate(k => ekranAc(k), e);
  await sayfa.waitForTimeout(120);
  const t = await sayfa.evaluate(() => ({
    g: document.documentElement.scrollWidth, v: window.innerWidth }));
  if (t.g > t.v + 1) tasanEkran.push(`${e}(${t.g}>${t.v})`);
}
bildir(tasanEkran.length === 0, 'Hicbir ekranda yatay tasma yok', tasanEkran.join(' '));

/* --- 10. Kontrast olcumu --- */
const kontrast = await sayfa.evaluate(() => {
  const bilesen = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const parlaklik = (rgb) => {
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    return 0.2126 * bilesen(r) + 0.7152 * bilesen(g) + 0.0722 * bilesen(b);
  };
  const oran = (a, b) => {
    const la = parlaklik(a), lb = parlaklik(b);
    return +(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05))).toFixed(2);
  };
  ekranAc('e-tur');
  const kartZemin = getComputedStyle(document.getElementById('kart')).backgroundColor;
  return {
    anaKelime: oran(getComputedStyle(document.getElementById('kart-ana')).color, kartZemin),
    yasakli: oran(getComputedStyle(document.querySelector('.kart-yasakli li')).color, kartZemin),
  };
});
bildir(kontrast.anaKelime >= 7 && kontrast.yasakli >= 7,
  'Kart metni kontrasti WCAG AAA (>=7:1)',
  `ana ${kontrast.anaKelime}:1, yasakli ${kontrast.yasakli}:1`);

await tarayici.close();

console.log('\n' + '='.repeat(56));
if (hatalar.length) { console.log('SAYFA HATASI:'); hatalar.forEach(h => console.log('  ' + h)); }
if (sorun || hatalar.length) {
  console.log(`${sorun} yerlesim sorunu bulundu.`);
  process.exit(1);
}
console.log('Yerlesim denetimi temiz.');
