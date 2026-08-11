/**
 * Palet: OKEY TAHTASI
 *
 * Oyunun dunyasi bir Turk aile masasi. Palet de oradan geliyor:
 * koyu ceviz tahta, fildisi okey tasi, pirinc kaplama ve okey
 * taslarinin dort rengi.
 *
 * Kart metni kontrasti 16.4:1, yasakli kelimeler 7.5:1 - ikisi de
 * WCAG AAA. Bu onemli cunku denetci anlatanin omzunun ustunden,
 * acili ve uzaktan bakiyor.
 */

export const RENK = {
  zeminUst: '#1F1913',
  zeminOrta: '#2C2317',
  zeminAlt: '#413221',

  kart: '#F7F0E1',
  kartGolge: '#DBCDB0',
  kartBant: '#D4A050',

  metinAna: '#17120A',
  metinAlt: '#5C4A33',

  pirinc: '#D4A050',
  dogru: '#12A150',
  dogruKoyu: '#0A7038',
  yanlis: '#E01E37',
  pas: '#F5A524',
  mavi: '#2E7FE0',

  fildisi: '#F5EADA',
  sis: '#B9A184',
  cizgi: 'rgba(212,160,80,0.22)',
  yuzey: 'rgba(245,234,218,0.06)',
  yuzeyKoyu: 'rgba(16,12,7,0.55)',
  ortu: 'rgba(13,10,6,0.82)',

  // Vurgu renkleri uzerindeki metin
  yesilUstu: '#04250F',
  sariUstu: '#3A2400',
  pirincUstu: '#1A1208',
  beyaz: '#FFFFFF',
} as const;

/** Okey taslarinin dort rengi. Takimlar bunlari kullanir. */
export const TAKIM_RENKLERI = [
  RENK.yanlis,   // kirmizi
  RENK.mavi,     // mavi
  RENK.pas,      // sari
  RENK.dogru,    // yesil
] as const;

export const TAKIM_ADLARI = [
  'Kırmızı Takım',
  'Mavi Takım',
  'Sarı Takım',
  'Yeşil Takım',
] as const;
