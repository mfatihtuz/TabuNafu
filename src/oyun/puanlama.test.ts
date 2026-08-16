/**
 * Puanlama ve oyun bitisi testleri.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  BOS_TUR,
  aksiyonPuani,
  dogruEkle,
  kazananlar,
  oyunBittiMi,
  pasEkle,
  pasHakkiVarMi,
  siraliTakimlar,
  turPuani,
  yanlisEkle,
} from './puanlama';
import { VARSAYILAN_AYARLAR, type Ayarlar, type Takim } from './tipler';

function takim(ad: string, puan: number, anlatanSira = 0): Takim {
  return {
    ad, renk: '#E01E37', puan, oyuncular: [], anlatanSira,
    toplam: BOS_TUR, enIyiTur: 0,
  };
}

function ayarlarla(ustune: Partial<Ayarlar>): Ayarlar {
  return { ...VARSAYILAN_AYARLAR, ...ustune };
}

describe('puanlama', () => {
  it('dogru +1, yanlis -1, pas 0 getirir', () => {
    assert.equal(aksiyonPuani('dogru'), 1);
    assert.equal(aksiyonPuani('yanlis'), -1);
    assert.equal(aksiyonPuani('pas'), 0);
  });

  it('tur puani dogru ve yanlisin farkidir, pas etkilemez', () => {
    let sayaclar = BOS_TUR;
    for (let i = 0; i < 7; i++) sayaclar = dogruEkle(sayaclar);
    for (let i = 0; i < 2; i++) sayaclar = yanlisEkle(sayaclar);
    for (let i = 0; i < 3; i++) sayaclar = pasEkle(sayaclar);

    assert.deepEqual(sayaclar, { dogru: 7, yanlis: 2, pas: 3 });
    assert.equal(turPuani(sayaclar), 5, '7 dogru - 2 yanlis = 5');
  });

  it('tur puani eksiye dusebilir', () => {
    let sayaclar = dogruEkle(BOS_TUR);
    for (let i = 0; i < 4; i++) sayaclar = yanlisEkle(sayaclar);
    assert.equal(turPuani(sayaclar), -3);
  });

  it('sayaclar degistirilmez, yeni nesne doner', () => {
    const once = BOS_TUR;
    const sonra = dogruEkle(once);
    assert.equal(once.dogru, 0, 'girdi degismemeli');
    assert.equal(sonra.dogru, 1);
  });

  it('pas hakki sayaci dogru calisir', () => {
    let sayaclar = BOS_TUR;
    assert.equal(pasHakkiVarMi(sayaclar, 3), true);
    sayaclar = pasEkle(pasEkle(pasEkle(sayaclar)));
    assert.equal(pasHakkiVarMi(sayaclar, 3), false, '3/3 sonrasi hak bitmeli');
  });

  it('hedef puan modunda ilk ulasan oyunu bitirir', () => {
    const ayarlar = ayarlarla({ bitisModu: 'puan', hedefPuan: 30 });
    assert.equal(oyunBittiMi([takim('A', 29), takim('B', 12)], ayarlar), false);
    assert.equal(oyunBittiMi([takim('A', 30), takim('B', 12)], ayarlar), true);
    assert.equal(oyunBittiMi([takim('A', 31), takim('B', 12)], ayarlar), true);
  });

  it('tur sayisi modunda TUM takimlar esit tur oynayinca biter', () => {
    const ayarlar = ayarlarla({ bitisModu: 'tur', turSayisi: 5 });
    // Kirmizi 5 tur oynadi ama Mavi 4 - oyun bitmemeli, adil olmaz
    assert.equal(oyunBittiMi([takim('Kırmızı', 20, 5), takim('Mavi', 18, 4)], ayarlar),
      false, 'takimlar esit tur oynamadan bitmemeli');
    assert.equal(oyunBittiMi([takim('Kırmızı', 20, 5), takim('Mavi', 18, 5)], ayarlar),
      true);
  });

  it('sinirsiz modda oyun kendiliginden bitmez', () => {
    const ayarlar = ayarlarla({ bitisModu: 'sinirsiz' });
    assert.equal(oyunBittiMi([takim('A', 500, 99), takim('B', 4, 99)], ayarlar), false);
  });

  it('takim yoksa oyun bitmis sayilmaz', () => {
    assert.equal(oyunBittiMi([], VARSAYILAN_AYARLAR), false);
    assert.deepEqual(kazananlar([]), []);
  });

  it('en yuksek puanli takim kazanir', () => {
    const liste = [takim('Kırmızı', 12), takim('Mavi', 25), takim('Sarı', 19)];
    const kazanan = kazananlar(liste);
    assert.equal(kazanan.length, 1);
    assert.equal(kazanan[0]?.ad, 'Mavi');
  });

  it('esitlikte birden fazla kazanan doner', () => {
    const liste = [takim('Kırmızı', 25), takim('Mavi', 25), takim('Sarı', 19)];
    assert.equal(kazananlar(liste).length, 2, 'beraberlik turu gerekir');
  });

  it('eksi puanlarda da dogru kazanan bulunur', () => {
    const liste = [takim('Kırmızı', -5), takim('Mavi', -2)];
    assert.equal(kazananlar(liste)[0]?.ad, 'Mavi');
  });

  it('skor tablosu puana gore siralanir ve kaynagi bozmaz', () => {
    const liste = [takim('Kırmızı', 12), takim('Mavi', 25), takim('Sarı', 19)];
    const sirali = siraliTakimlar(liste);
    assert.deepEqual(sirali.map((t) => t.ad), ['Mavi', 'Sarı', 'Kırmızı']);
    assert.equal(liste[0]?.ad, 'Kırmızı', 'girdi dizisi degismemeli');
  });
});
