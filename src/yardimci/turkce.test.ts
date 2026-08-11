/**
 * Turkce harf donusumu testleri.
 *
 * Bu dosyanin varlik sebebi tek bir hata: JavaScript'in toUpperCase()
 * fonksiyonu 'i' harfini 'İ' degil 'I' yapar. Oyun tamamen buyuk harf
 * kartlar uzerine kurulu oldugu icin bu hata her ekranda gorunur.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { trBasHarfBuyuk, trLower, trSirala, trUpper } from './turkce';

describe('turkce buyuk harf', () => {
  it('noktali i buyukken noktasini korur', () => {
    assert.equal(trUpper('istanbul'), 'İSTANBUL');
    assert.equal(trUpper('iyi'), 'İYİ');
    assert.equal(trUpper('teknoloji'), 'TEKNOLOJİ');
  });

  it('JavaScript varsayilani bu isi yanlis yapiyor', () => {
    // Testin amaci: neden kendi fonksiyonumuzu yazdigimizi belgelemek
    assert.equal('istanbul'.toUpperCase(), 'ISTANBUL');
    assert.notEqual('istanbul'.toUpperCase(), trUpper('istanbul'));
  });

  it('noktasiz i buyukken noktasiz kalir', () => {
    assert.equal(trUpper('ırmak'), 'IRMAK');
    assert.equal(trUpper('ışık'), 'IŞIK');
    assert.equal(trUpper('sığır'), 'SIĞIR');
  });

  it('diger Turkce harfler dogru cevriliyor', () => {
    assert.equal(trUpper('çöğüş'), 'ÇÖĞÜŞ');
    assert.equal(trUpper('şemsiye'), 'ŞEMSİYE');
    assert.equal(trUpper('yağmur'), 'YAĞMUR');
  });

  it('duzeltme isaretli harfler korunur', () => {
    assert.equal(trUpper('kâğıt'), 'KÂĞIT');
    assert.equal(trUpper('hikâye'), 'HİKÂYE');
  });

  it('zaten buyuk metin bozulmaz', () => {
    assert.equal(trUpper('İSTANBUL'), 'İSTANBUL');
    assert.equal(trUpper('IRMAK'), 'IRMAK');
  });

  it('bosluklu ve rakamli metinler', () => {
    assert.equal(trUpper('nazar boncuğu'), 'NAZAR BONCUĞU');
    assert.equal(trUpper('1453 fetih'), '1453 FETİH');
  });

  it('bos metin cokmez', () => {
    assert.equal(trUpper(''), '');
    assert.equal(trLower(''), '');
  });
});

describe('turkce kucuk harf', () => {
  it('noktasiz I kucukken noktasiz kalir', () => {
    assert.equal(trLower('IRMAK'), 'ırmak');
    assert.equal(trLower('IŞIK'), 'ışık');
  });

  it('noktali I kucukken noktali kalir', () => {
    assert.equal(trLower('İSTANBUL'), 'istanbul');
    assert.equal(trLower('İYİ'), 'iyi');
  });

  it('JavaScript varsayilani burada da yaniliyor', () => {
    assert.equal('IRMAK'.toLowerCase(), 'irmak');
    assert.notEqual('IRMAK'.toLowerCase(), trLower('IRMAK'));
  });

  it('buyuk-kucuk gidip gelmede metin korunur', () => {
    for (const kelime of ['istanbul', 'ırmak', 'şemsiye', 'çiğdem', 'ışıl']) {
      assert.equal(trLower(trUpper(kelime)), kelime, `${kelime} donusumde bozuldu`);
    }
  });
});

describe('bas harf buyutme', () => {
  it('takim ve oyuncu adlarini duzgun yazar', () => {
    assert.equal(trBasHarfBuyuk('ismail'), 'İsmail');
    assert.equal(trBasHarfBuyuk('ırmak'), 'Irmak');
    assert.equal(trBasHarfBuyuk('AYŞE'), 'Ayşe');
    assert.equal(trBasHarfBuyuk('  fatih  '), 'Fatih');
  });

  it('bos girdi bos doner', () => {
    assert.equal(trBasHarfBuyuk(''), '');
    assert.equal(trBasHarfBuyuk('   '), '');
  });
});

describe('turkce siralama', () => {
  it('Turkce harfler alfabenin sonuna atilmaz', () => {
    const kelimeler = ['zeytin', 'çilek', 'incir', 'ıhlamur', 'şeftali', 'üzüm', 'armut'];
    const sirali = [...kelimeler].sort(trSirala);
    assert.deepEqual(sirali,
      ['armut', 'çilek', 'ıhlamur', 'incir', 'şeftali', 'üzüm', 'zeytin']);
  });

  it('varsayilan siralama bunu yanlis yapiyor', () => {
    const kelimeler = ['zeytin', 'çilek'];
    // Unicode kod noktasina gore c > z oldugu icin cilek sona gider
    assert.deepEqual([...kelimeler].sort(), ['zeytin', 'çilek']);
    assert.deepEqual([...kelimeler].sort(trSirala), ['çilek', 'zeytin']);
  });
});
