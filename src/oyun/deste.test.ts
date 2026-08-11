/**
 * Deste mantigi testleri.
 *
 * En kritik iddia: bir seride kart tekrari YOK. Bunu gercekten kanitlamak
 * icin 250 kartlik desteyi bastan sona cekip her indeksi sayiyoruz.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  desteBittiMi,
  desteKur,
  diziKaristir,
  kalanKart,
  kartCek,
  pasKaydet,
  yenidenKaristir,
  type DesteDurumu,
} from './deste';

/** Deterministik sozde rastgele - testler her calistirmada ayni sonucu versin. */
function sabitRastgele(tohum = 12345) {
  let durum = tohum;
  return () => {
    durum = (1103515245 * durum + 12345) % 2147483648;
    return durum / 2147483648;
  };
}

/** Desteyi sonuna kadar ceker, cekilen indeksleri dondurur. */
function hepsiniCek(baslangic: DesteDurumu, pasAraligi = 0) {
  let durum = baslangic;
  const cekilenler: number[] = [];
  const olaylar: string[] = [];

  for (let guvenlik = 0; guvenlik < 5000; guvenlik++) {
    const sonuc = kartCek(durum);
    durum = sonuc.durum;

    if (sonuc.tur === 'seriBitti') {
      olaylar.push('seriBitti');
      break;
    }
    if (sonuc.tur === 'pasTuruBasladi') {
      olaylar.push(`pasTuru:${sonuc.kartSayisi}`);
      continue;
    }

    cekilenler.push(sonuc.indeks);
    if (pasAraligi > 0 && cekilenler.length % pasAraligi === 0) {
      durum = pasKaydet(durum);
    }
  }
  return { durum, cekilenler, olaylar };
}

describe('deste', () => {
  it('250 kart cekilir ve hicbiri tekrar etmez', () => {
    const deste = desteKur('cografya', 250, sabitRastgele());
    const { cekilenler } = hepsiniCek(deste);

    assert.equal(cekilenler.length, 250, '250 kartin hepsi cekilmeli');
    assert.equal(new Set(cekilenler).size, 250, 'hicbir kart tekrar etmemeli');
  });

  it('karma gercekten sirayi degistiriyor', () => {
    const deste = desteKur('genel', 100, sabitRastgele());
    const sirali = Array.from({ length: 100 }, (_, i) => i);
    assert.notDeepEqual([...deste.sira], sirali, 'deste karilmamis');
    assert.deepEqual([...deste.sira].sort((a, b) => a - b), sirali,
      'karma sonrasi ayni indeksler durmali');
  });

  it('deste bitince ve pas yoksa dogrudan seri biter', () => {
    const deste = desteKur('yemek', 10, sabitRastgele());
    const { cekilenler, olaylar } = hepsiniCek(deste);

    assert.equal(cekilenler.length, 10);
    assert.deepEqual(olaylar, ['seriBitti'], 'pas yokken pas turu olmamali');
  });

  it('ana gecis bitince pas gecilenler mini seri olur', () => {
    const deste = desteKur('tarih', 12, sabitRastgele());
    // Her 3. kart pas gecilir -> 4 pas
    const { cekilenler, olaylar } = hepsiniCek(deste, 3);

    assert.ok(olaylar[0]?.startsWith('pasTuru:'), 'pas turu baslamali');
    assert.equal(olaylar[0], 'pasTuru:4', 'mini seri pas sayisi kadar olmali');
    assert.equal(olaylar[1], 'seriBitti', 'mini seri sonrasi seri bitmeli');
    assert.equal(cekilenler.length, 12 + 4, 'ana gecis + pas turu');
  });

  it('pas turunda sadece pas gecilen kartlar gelir', () => {
    let durum = desteKur('muzik', 9, sabitRastgele());
    const pasGecilenler: number[] = [];

    // Ana gecis: her 3. karti pas gec
    for (let i = 0; i < 9; i++) {
      const sonuc = kartCek(durum);
      assert.equal(sonuc.tur, 'kart');
      if (sonuc.tur !== 'kart') return;
      durum = sonuc.durum;
      if (i % 3 === 0) {
        pasGecilenler.push(sonuc.indeks);
        durum = pasKaydet(durum);
      }
    }

    const gecis = kartCek(durum);
    assert.equal(gecis.tur, 'pasTuruBasladi');
    durum = gecis.durum;

    const pasTuruKartlari: number[] = [];
    for (let guvenlik = 0; guvenlik < 20; guvenlik++) {
      const sonuc = kartCek(durum);
      durum = sonuc.durum;
      if (sonuc.tur !== 'kart') break;
      pasTuruKartlari.push(sonuc.indeks);
    }

    assert.deepEqual(
      [...pasTuruKartlari].sort((a, b) => a - b),
      [...pasGecilenler].sort((a, b) => a - b),
      'pas turunda tam olarak pas gecilenler gelmeli',
    );
  });

  it('pas turunda pas gecilenler TEKRAR toplanmaz, sonsuz dongu olmaz', () => {
    let durum = desteKur('fen', 6, sabitRastgele());

    // Ana geciste her karti pas gec
    for (let i = 0; i < 6; i++) {
      const sonuc = kartCek(durum);
      if (sonuc.tur !== 'kart') break;
      durum = pasKaydet(sonuc.durum);
    }

    const gecis = kartCek(durum);
    assert.equal(gecis.tur, 'pasTuruBasladi');
    durum = gecis.durum;
    assert.equal(durum.pasListesi.length, 0, 'pas turuna girerken liste bosalmali');

    // Pas turunda da hepsini pas gec
    for (let i = 0; i < 6; i++) {
      const sonuc = kartCek(durum);
      if (sonuc.tur !== 'kart') break;
      durum = pasKaydet(sonuc.durum);
    }

    assert.equal(durum.pasListesi.length, 0,
      'pas turunda pas gecilenler toplanmamali');
    assert.equal(kartCek(durum).tur, 'seriBitti',
      'ikinci bir pas turu olmamali');
  });

  it('yeniden karistirmada ilk kart onceki serinin son karti degil', () => {
    // Bircok tohumla dene - kenar durum guvenilir sekilde kapanmali
    for (let tohum = 1; tohum <= 40; tohum++) {
      let durum = desteKur('genel', 20, sabitRastgele(tohum));
      const { durum: bitmis } = hepsiniCek(durum);
      const sonKart = bitmis.sonGosterilen;
      durum = yenidenKaristir(bitmis, 20, sabitRastgele(tohum * 7));
      assert.notEqual(durum.sira[0], sonKart,
        `tohum ${tohum}: yeni destenin ilk karti onceki son kart olmamali`);
    }
  });

  it('yeniden karistirma tam desteyi geri getirir ve pas turunu sifirlar', () => {
    let durum = desteKur('spor', 15, sabitRastgele());
    const { durum: bitmis } = hepsiniCek(durum, 2);
    durum = yenidenKaristir(bitmis, 15, sabitRastgele(99));

    assert.equal(durum.sira.length, 15);
    assert.equal(durum.imlec, 0);
    assert.equal(durum.pasTuruAktif, false);
    assert.equal(durum.pasListesi.length, 0);
  });

  it('kalanKart dogru sayiyor', () => {
    let durum = desteKur('seyahat', 5, sabitRastgele());
    assert.equal(kalanKart(durum), 5);
    const sonuc = kartCek(durum);
    assert.equal(kalanKart(sonuc.durum), 4);
    assert.equal(desteBittiMi(sonuc.durum), false);
  });

  it('tek kartlik destede karma cokmez', () => {
    const durum = desteKur('tekil', 1, sabitRastgele());
    assert.equal(durum.sira.length, 1);
    const sonuc = kartCek(durum);
    assert.equal(sonuc.tur, 'kart');
    assert.equal(kartCek(sonuc.durum).tur, 'seriBitti');
  });

  it('bos destede sonsuz donguye girmez', () => {
    const durum = desteKur('bos', 0, sabitRastgele());
    assert.equal(kartCek(durum).tur, 'seriBitti');
  });

  it('diziKaristir kaynagi bozmaz', () => {
    const kaynak = [1, 2, 3, 4, 5];
    const kopya = [...kaynak];
    diziKaristir(kaynak, null, sabitRastgele());
    assert.deepEqual(kaynak, kopya, 'girdi dizisi degismemeli');
  });
});
