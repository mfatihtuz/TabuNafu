/**
 * Pas turu mekanigi testi (EK KURGU4).
 *
 * Dogrulanan kurallar:
 *   1) Ana geciste hicbir kart tekrar gelmez
 *   2) Ana gecis bitince pas gecilenler mini seri olur
 *   3) Mini seride SADECE pas gecilenler gelir
 *   4) Mini seride pas gecilenler TEKRAR toplanmaz (sonsuz dongu yok)
 *   5) Mini seri bitince seri bitti modali cikar
 *   6) Pas listesi bossa mini seri atlanir, dogrudan modal cikar
 *
 * Calistirma:  node scripts/test-pas-turu.mjs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
let basarisiz = 0;

function kontrol(ad, kosul, ek = '') {
  console.log(`  ${kosul ? 'TAMAM' : 'HATA '}  ${ad}${ek ? '   ' + ek : ''}`);
  if (!kosul) basarisiz++;
}

const tarayici = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const sayfa = await tarayici.newPage({ viewport: { width: 402, height: 874 } });
const hatalar = [];
sayfa.on('pageerror', e => hatalar.push(e.message));
await sayfa.goto('file://' + join(KOK, 'tasarim', 'prototip-derli.html'));
await sayfa.waitForTimeout(500);

/* Tarayici icinde tam bir seri simule et.
   Zamanlayici karismasin diye sayac durdurulur, kartlar dogrudan islenir. */
const sonuc = await sayfa.evaluate(() => {
  const KAT = 'cografya';
  const deste = desteyiGetir(KAT);
  const toplam = deste.length;

  ayarlar.pasHakki = 7;
  ayarlar.sonKartHakki = false;
  kategoriSec(KAT);
  sayaciDurdur();

  const anaGecis = [];
  const pasGecilenler = [];
  const pasTuruGelenler = [];
  let pasTuruBasladi = false;
  let modalCikti = false;
  let miniSeriUzunlugu = 0;

  // Ana gecis: her 3. karti pas gec
  for (let i = 0; i < toplam; i++) {
    const kart = siradakiKartiGetir();
    anaGecis.push(kart[0]);
    if (i % 3 === 0) {
      pasGecilenler.push(kart[0]);
      if (!oyun.pasTuruAktif) oyun.pasListesi.push(oyun.sonGosterilen);
    }
  }

  // Ana gecis bitti -> pas turu baslamali
  if (desteBittiMi() && !oyun.pasTuruAktif && oyun.pasListesi.length > 0) {
    miniSeriUzunlugu = oyun.pasListesi.length;
    pasTuruBaslat();
    pasTuruBasladi = true;
  }

  // Pas turu: hepsini pas gec (tekrar toplanmamali)
  const pasTuruSonrasiListe = [];
  while (!desteBittiMi()) {
    const kart = siradakiKartiGetir();
    pasTuruGelenler.push(kart[0]);
    if (!oyun.pasTuruAktif && oyun.sonGosterilen !== null) {
      oyun.pasListesi.push(oyun.sonGosterilen);
    }
    pasTuruSonrasiListe.push(oyun.pasListesi.length);
  }

  // Pas turu bitti -> seri bitti modali cikmali
  if (desteBittiMi() && !(!oyun.pasTuruAktif && oyun.pasListesi.length > 0)) {
    seriBittiSor();
    modalCikti = document.getElementById('ortu').classList.contains('acik');
  }

  return {
    toplam,
    anaGecisAdet: anaGecis.length,
    anaGecisTekil: new Set(anaGecis).size,
    pasGecilenAdet: pasGecilenler.length,
    miniSeriUzunlugu,
    pasTuruBasladi,
    pasTuruGelenAdet: pasTuruGelenler.length,
    pasTuruTekil: new Set(pasTuruGelenler).size,
    // Pas turunda gelen her kelime, ana geciste pas gecilenlerden mi
    hepsiPastanMi: pasTuruGelenler.every(k => pasGecilenler.includes(k)),
    pasListesiSonDurum: oyun.pasListesi.length,
    modalCikti,
    modalMetni: document.getElementById('modal-metin').textContent,
  };
});

console.log('\nEK KURGU4 - Pas turu mekanigi\n');
console.log(`  Kategori destesi: ${sonuc.toplam} kart, ana geciste `
          + `${sonuc.pasGecilenAdet} pas gecildi\n`);

kontrol('Ana geciste hicbir kart tekrar gelmedi',
  sonuc.anaGecisAdet === sonuc.anaGecisTekil && sonuc.anaGecisAdet === sonuc.toplam,
  `${sonuc.anaGecisTekil}/${sonuc.anaGecisAdet} tekil`);

kontrol('Ana gecis bitince pas turu basladi', sonuc.pasTuruBasladi);

kontrol('Mini seri uzunlugu pas sayisina esit',
  sonuc.miniSeriUzunlugu === sonuc.pasGecilenAdet,
  `${sonuc.miniSeriUzunlugu} = ${sonuc.pasGecilenAdet}`);

kontrol('Pas turunda sadece pas gecilenler geldi', sonuc.hepsiPastanMi);

kontrol('Pas turunda da tekrar yok',
  sonuc.pasTuruGelenAdet === sonuc.pasTuruTekil);

kontrol('Pas turunda pas gecilenler TEKRAR toplanmadi',
  sonuc.pasListesiSonDurum === 0,
  `liste uzunlugu ${sonuc.pasListesiSonDurum}`);

kontrol('Pas turu bitince seri bitti modali cikti', sonuc.modalCikti);

/* --- Pas listesi bos ise mini seri atlanmali --- */
const bossaSonuc = await sayfa.evaluate(() => {
  modalKapat();
  kategoriSec('cografya');
  sayaciDurdur();
  const toplam = desteyiGetir('cografya').length;
  for (let i = 0; i < toplam; i++) siradakiKartiGetir();   // hic pas yok
  const pasTuruGerekli = !oyun.pasTuruAktif && oyun.pasListesi.length > 0;
  if (!pasTuruGerekli) seriBittiSor();
  return {
    pasTuruAtlandi: !pasTuruGerekli,
    modal: document.getElementById('ortu').classList.contains('acik'),
  };
});
kontrol('Hic pas yoksa mini seri atlanir', bossaSonuc.pasTuruAtlandi);
kontrol('Dogrudan seri bitti modali cikar', bossaSonuc.modal);

/* --- Yeniden karistirinca durum sifirlanmali --- */
const sifirla = await sayfa.evaluate(() => {
  document.getElementById('modal-birinci').click();
  return {
    imlec: oyun.imlec,
    pasListesi: oyun.pasListesi.length,
    pasTuruAktif: oyun.pasTuruAktif,
    desteUzunluk: oyun.desteSirasi.length,
    rozetVar: !!document.querySelector('.kart-rozet.pas-turu'),
  };
});
kontrol('Yeniden karistirmada pas turu durumu sifirlandi',
  sifirla.pasListesi === 0 && sifirla.pasTuruAktif === false && !sifirla.rozetVar);
kontrol('Yeniden karistirmada tam deste geri geldi',
  sifirla.desteUzunluk === sonuc.toplam,
  `${sifirla.desteUzunluk} kart`);

await tarayici.close();

console.log('\n' + '='.repeat(52));
if (hatalar.length) { console.log('SAYFA HATASI:'); hatalar.forEach(h => console.log('  ' + h)); }
if (basarisiz || hatalar.length) {
  console.log(`${basarisiz} kontrol basarisiz.`);
  process.exit(1);
}
console.log('Pas turu mekanigi tam calisiyor.');
