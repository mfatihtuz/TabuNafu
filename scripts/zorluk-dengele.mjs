/**
 * Zorluk dagilimini hedefe oturtur.
 *
 * NEDEN GEREKLI
 * Kartlar partiler halinde yazildi ve her partide olcut biraz kaydi.
 * Ilk partilerde etiketler kolaya, son partilerde zora kaydi. Sonucta
 * destenin yarisi "zor" ve "cok zor" damgasi tasiyor - oysa oyunun tadi
 * cogunlukla kolay-orta kartlardan, arada gelen bir zor karttan geliyor.
 * Hepsi zor olursa anlatan yorulur, oyun moral bozucu olur.
 *
 * YONTEM - NICELIK ESLEMESI
 * Etiketlerin MUTLAK degeri kaymis olabilir ama SIRALAMASI saglam:
 * "5" verdigim kart "3" verdigimden gercekten daha zor. O yuzden
 * etiketleri tek tek yeniden yazmak yerine siralamayi koruyup hedef
 * yuzdelere gore kesiyoruz.
 *
 * Siralama olcutu, en guclu sinyalden en zayifina:
 *   1. Elle kuratorlu "cok kolay" listesi - varsa en basa
 *   2. Yazarken verilen zorluk etiketi
 *   3. Ana kelimenin uzunlugu - uzun kelime genelde daha zor anlatilir
 *   4. Alfabetik - ayni kosullarda sonuc her calistirmada ayni olsun
 *
 * Sonra sirali liste %10 / %35 / %35 / %15 / %5 olarak bolunur. Donusum
 * monoton: yeniden etiketlemeden once daha zor olan kart, sonra da daha
 * zor kalir. Kartlarin CSV icindeki satir sirasi degismez.
 *
 * Kullanim:
 *   node scripts/zorluk-dengele.mjs genel
 *   node scripts/zorluk-dengele.mjs genel --uygula
 *   node scripts/zorluk-dengele.mjs --tumu --uygula
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';

import { AYRAC, BOM, BASLIK, csvAyristir } from './build-words.mjs';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const KAYNAK_KLASOR = join(KOK, 'icerik', 'kelimeler');

/** Hedef dagilim - kullanicinin istedigi karisim. */
const HEDEF = { 1: 0.1, 2: 0.35, 3: 0.35, 4: 0.15, 5: 0.05 };
const ETIKET = { 1: 'cok kolay', 2: 'kolay', 3: 'orta', 4: 'zor', 5: 'cok zor' };

/**
 * Seviye 1'e oncelikli girecek kelimeler.
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

/**
 * Hedef yuzdeleri kart sayisina cevirir.
 * Yuvarlama artigi en kalabalik seviyeye (orta) verilir ki toplam tutsun.
 */
export function kotalar(toplam) {
  const adet = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const s of [1, 2, 4, 5]) adet[s] = Math.round(toplam * HEDEF[s]);
  adet[3] = toplam - adet[1] - adet[2] - adet[4] - adet[5];
  return adet;
}

/**
 * Kartlari kolaydan zora dizer ve hedef kotalara gore yeniden etiketler.
 * Kartlarin dizi icindeki sirasi degismez, sadece zorluk alani guncellenir.
 */
export function dengele(kartlar) {
  const sirali = [...kartlar].sort((a, b) => {
    const ak = COK_KOLAY.has(a.kelime) ? 0 : 1;
    const bk = COK_KOLAY.has(b.kelime) ? 0 : 1;
    if (ak !== bk) return ak - bk;
    if (a.zorluk !== b.zorluk) return a.zorluk - b.zorluk;
    const au = a.kelime.replace(/ /g, '').length;
    const bu = b.kelime.replace(/ /g, '').length;
    if (au !== bu) return au - bu;
    return a.kelime < b.kelime ? -1 : a.kelime > b.kelime ? 1 : 0;
  });

  const adet = kotalar(sirali.length);
  let i = 0;
  for (const seviye of [1, 2, 3, 4, 5]) {
    for (let n = 0; n < adet[seviye] && i < sirali.length; n++, i++) {
      sirali[i].zorluk = seviye;
    }
  }
  // Yuvarlama yuzunden artan olursa en ust seviyeye yazilir
  for (; i < sirali.length; i++) sirali[i].zorluk = 5;
  return kartlar;
}

function csvYaz(yol, kartlar) {
  const satirlar = [
    BASLIK.join(AYRAC),
    ...kartlar.map((k) => [k.kelime, ...k.yasaklilar, k.zorluk].join(AYRAC)),
  ];
  writeFileSync(yol, BOM + satirlar.join('\r\n') + '\r\n', 'utf-8');
}

function rapor(ad, kartlar) {
  const sayac = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const k of kartlar) sayac[k.zorluk]++;
  const toplam = kartlar.length;
  console.log(`\n${ad}: ${toplam} kart\n`);
  console.log(`  ${'seviye'.padEnd(12)} ${'adet'.padStart(5)} ${'gercek'.padStart(7)} ${'hedef'.padStart(6)}`);
  console.log('  ' + '-'.repeat(34));
  for (const s of [1, 2, 3, 4, 5]) {
    const yuzde = (sayac[s] / toplam) * 100;
    const sapma = Math.abs(yuzde - HEDEF[s] * 100);
    console.log(
      `  ${sapma <= 2 ? ' ' : '!'}${ETIKET[s].padEnd(11)} ${String(sayac[s]).padStart(5)} ` +
        `${('%' + yuzde.toFixed(0)).padStart(7)} ${('%' + HEDEF[s] * 100).padStart(6)}`,
    );
  }
}

const uygula = process.argv.includes('--uygula');
const tumu = process.argv.includes('--tumu');
const kategori = process.argv.slice(2).find((a) => !a.startsWith('--'));

if (!kategori && !tumu) {
  console.error('Kullanim: node scripts/zorluk-dengele.mjs <kategori|--tumu> [--uygula]');
  process.exit(1);
}

const dosyalar = tumu
  ? readdirSync(KAYNAK_KLASOR).filter((d) => d.endsWith('.csv')).sort()
  : [`${kategori}.csv`];

const hepsi = [];
for (const dosya of dosyalar) {
  const yol = join(KAYNAK_KLASOR, dosya);
  const { kartlar } = csvAyristir(readFileSync(yol, 'utf-8'));
  dengele(kartlar);
  hepsi.push(...kartlar);
  if (uygula) csvYaz(yol, kartlar);
  if (!tumu) rapor(basename(dosya, '.csv'), kartlar);
}

if (tumu) rapor('TOPLAM', hepsi);

console.log(
  uygula ? `\n  ${dosyalar.length} dosya guncellendi.\n` : '\n  Onizleme. Yazmak icin --uygula ekle.\n',
);
