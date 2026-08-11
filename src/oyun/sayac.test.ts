/**
 * Sayac ve son kart mekanigi testleri.
 *
 * Sayac saf durum makinesi oldugu icin gercek zaman beklemeden
 * bir turun tamamini saniye saniye oynatabiliyoruz.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  acilDurumMu,
  baslat,
  devamEt,
  duraklat,
  halkaOrani,
  pasBasilabilirMi,
  saniyeGec,
  sayacKur,
  type SayacDurumu,
  type SayacOlayi,
} from './sayac';
import { VARSAYILAN_AYARLAR, type Ayarlar } from './tipler';

function ayarlarla(ustune: Partial<Ayarlar>): Ayarlar {
  return { ...VARSAYILAN_AYARLAR, ...ustune };
}

/** Sayaci bitene kadar isletir, olusan olaylari sirasiyla dondurur. */
function turuOynat(ayarlar: Ayarlar, adimSiniri = 400) {
  let durum = baslat(sayacKur(ayarlar.sure));
  const olaylar: SayacOlayi[] = [];
  for (let i = 0; i < adimSiniri; i++) {
    const sonuc = saniyeGec(durum, ayarlar);
    durum = sonuc.durum;
    if (sonuc.olay) olaylar.push(sonuc.olay);
    if (!durum.calisiyorMu) break;
  }
  return { durum, olaylar };
}

describe('sayac', () => {
  it('sure secilen degerden baslar ve saniye saniye iner', () => {
    let durum = baslat(sayacKur(60));
    assert.equal(durum.kalanSaniye, 60);
    durum = saniyeGec(durum, VARSAYILAN_AYARLAR).durum;
    assert.equal(durum.kalanSaniye, 59);
  });

  it('duraklatilmis sayac ilerlemez', () => {
    const durum = duraklat(baslat(sayacKur(30)));
    const sonuc = saniyeGec(durum, VARSAYILAN_AYARLAR);
    assert.equal(sonuc.durum.kalanSaniye, 30, 'duraklatilmisken sure akmamali');
    assert.equal(sonuc.olay, null);
  });

  it('duraklatip devam edince kaldigi saniyeden surer', () => {
    // Deste tur ortasinda bittiginde bu yasanir
    let durum = baslat(sayacKur(30));
    for (let i = 0; i < 5; i++) durum = saniyeGec(durum, VARSAYILAN_AYARLAR).durum;
    assert.equal(durum.kalanSaniye, 25);

    durum = duraklat(durum);
    for (let i = 0; i < 10; i++) durum = saniyeGec(durum, VARSAYILAN_AYARLAR).durum;
    assert.equal(durum.kalanSaniye, 25, 'duraklamada sure kaybolmamali');

    durum = devamEt(durum);
    durum = saniyeGec(durum, VARSAYILAN_AYARLAR).durum;
    assert.equal(durum.kalanSaniye, 24, 'devam edince kaldigi yerden surmeli');
  });

  it('son kart hakki KAPALI iken sure bitince tur biter', () => {
    const ayarlar = ayarlarla({ sure: 30, sonKartHakki: false });
    const { durum, olaylar } = turuOynat(ayarlar);

    assert.deepEqual(olaylar, ['anaSureBitti']);
    assert.equal(durum.sonKartModuAktif, false, 'bonus sure baslamamali');
    assert.equal(durum.calisiyorMu, false);
  });

  it('son kart hakki ACIK iken bonus sure baslar ve sonra tur biter', () => {
    const ayarlar = ayarlarla({ sure: 30, sonKartHakki: true, sonKartSure: 5 });
    const { durum, olaylar } = turuOynat(ayarlar);

    assert.deepEqual(olaylar, ['sonKartBasladi', 'turBitti']);
    assert.equal(durum.kalanSaniye, 0);
    assert.equal(durum.calisiyorMu, false);
  });

  it('bonus sure ayardaki kadar surer', () => {
    const ayarlar = ayarlarla({ sure: 3, sonKartHakki: true, sonKartSure: 10 });
    let durum = baslat(sayacKur(ayarlar.sure));

    // Ana sure bitene kadar
    for (let i = 0; i < 3; i++) durum = saniyeGec(durum, ayarlar).durum;
    assert.equal(durum.sonKartModuAktif, true);
    assert.equal(durum.kalanSaniye, 10, 'bonus sure ayardan gelmeli');

    // Bonus sure bitene kadar
    let sonOlay: SayacOlayi = null;
    for (let i = 0; i < 10; i++) {
      const sonuc = saniyeGec(durum, ayarlar);
      durum = sonuc.durum;
      if (sonuc.olay) sonOlay = sonuc.olay;
    }
    assert.equal(sonOlay, 'turBitti');
  });

  it('SON KART MODUNDA PAS KILITLI', () => {
    // Kilitli olmasa takim pas basip yeni kart alarak turu uzatabilirdi
    const ayarlar = ayarlarla({ sure: 2, pasHakki: 5, sonKartHakki: true });
    let durum = baslat(sayacKur(2));

    assert.equal(pasBasilabilirMi(durum, 0, 5), true, 'normalde pas acik olmali');

    for (let i = 0; i < 2; i++) durum = saniyeGec(durum, ayarlar).durum;
    assert.equal(durum.sonKartModuAktif, true);
    assert.equal(pasBasilabilirMi(durum, 0, 5), false,
      'son kart modunda pas hakki olsa bile basilamamali');
  });

  it('pas hakki 0 secilirse bastan kilitli', () => {
    const durum = baslat(sayacKur(60));
    assert.equal(pasBasilabilirMi(durum, 0, 0), false);
  });

  it('pas hakki dolunca kilitlenir', () => {
    const durum = baslat(sayacKur(60));
    assert.equal(pasBasilabilirMi(durum, 2, 3), true, '2/3 iken acik');
    assert.equal(pasBasilabilirMi(durum, 3, 3), false, '3/3 iken kilitli');
    assert.equal(pasBasilabilirMi(durum, 4, 3), false, 'asilmissa da kilitli');
  });

  it('son 10 saniyede acil duruma gecer', () => {
    const olustur = (kalan: number): SayacDurumu =>
      ({ kalanSaniye: kalan, calisiyorMu: true, sonKartModuAktif: false });

    assert.equal(acilDurumMu(olustur(11)), false);
    assert.equal(acilDurumMu(olustur(10)), true);
    assert.equal(acilDurumMu(olustur(1)), true);
    assert.equal(acilDurumMu(olustur(0)), false, 'sifirda artik acil degil, bitmis');
  });

  it('son kart modu her zaman acil durumdur', () => {
    const durum: SayacDurumu =
      { kalanSaniye: 5, calisiyorMu: true, sonKartModuAktif: true };
    assert.equal(acilDurumMu(durum), true);
  });

  it('halka orani bonus surede kendi olcegini kullanir', () => {
    const ayarlar = ayarlarla({ sure: 60, sonKartSure: 5 });

    const normal: SayacDurumu =
      { kalanSaniye: 30, calisiyorMu: true, sonKartModuAktif: false };
    assert.equal(halkaOrani(normal, ayarlar), 0.5, '30/60 = yarim');

    const bonus: SayacDurumu =
      { kalanSaniye: 5, calisiyorMu: true, sonKartModuAktif: true };
    assert.equal(halkaOrani(bonus, ayarlar), 1,
      'bonus basinda halka dolu olmali, 5/60 degil 5/5');
  });

  it('en uzun ve en kisa surelerde de dogru calisir', () => {
    for (const sure of [30, 120]) {
      const ayarlar = ayarlarla({ sure, sonKartHakki: false });
      const { durum, olaylar } = turuOynat(ayarlar, 500);
      assert.deepEqual(olaylar, ['anaSureBitti'], `${sure} saniyede tur bitmeli`);
      assert.equal(durum.kalanSaniye, 0);
    }
  });
});
