/**
 * Puanlama ve oyun bitisi. Saf fonksiyonlar.
 *
 *   dogru   +1
 *   yanlis  -1   (yasakli kelime, el hareketi, kural disi anlatim)
 *   pas      0
 */

import { ALTIN_PUAN, type AksiyonTuru, type Ayarlar, type Takim, type TurSayaclari } from './tipler';

export const BOS_TUR: TurSayaclari = { dogru: 0, yanlis: 0, pas: 0 };

export function dogruEkle(sayaclar: TurSayaclari): TurSayaclari {
  return { ...sayaclar, dogru: sayaclar.dogru + 1 };
}

export function yanlisEkle(sayaclar: TurSayaclari): TurSayaclari {
  return { ...sayaclar, yanlis: sayaclar.yanlis + 1 };
}

export function pasEkle(sayaclar: TurSayaclari): TurSayaclari {
  return { ...sayaclar, pas: sayaclar.pas + 1 };
}

/** Pas hakki kaldi mi. Pas hakki 0 secilirse bastan kilitlidir. */
export function pasHakkiVarMi(sayaclar: TurSayaclari, pasHakki: number): boolean {
  return sayaclar.pas < pasHakki;
}

/** Turun takima kazandirdigi net puan. */
export function turPuani(sayaclar: TurSayaclari): number {
  return sayaclar.dogru - sayaclar.yanlis;
}

/** Bir aksiyonun puana etkisi. */
/**
 * Altin kartin puani. Simetrik tutuldu - dogru +2 ise yanlis da -2.
 * Asimetrik olsaydi altin kart tek tarafli avantaj olur ve dengeyi bozardi.
 */
export function altinPuani(tur: AksiyonTuru): number {
  if (tur === 'dogru') return ALTIN_PUAN;
  if (tur === 'yanlis') return -ALTIN_PUAN;
  return 0;
}

export function aksiyonPuani(tur: 'dogru' | 'yanlis' | 'pas'): number {
  if (tur === 'dogru') return 1;
  if (tur === 'yanlis') return -1;
  return 0;
}

/** Oyun bitti mi. Bitis moduna gore karar verir. */
export function oyunBittiMi(takimlar: readonly Takim[], ayarlar: Ayarlar): boolean {
  if (takimlar.length === 0) return false;
  if (ayarlar.bitisModu === 'sinirsiz') return false;

  if (ayarlar.bitisModu === 'puan') {
    // Hedefe ulasmak tek basina yetmez - SON DUZLUK kurali.
    // Once boyle degildi: ilk hedefe varan oyunu aninda bitiriyordu ve
    // sonraki takimlar bir tur eksik oynamis oluyordu. Sirf ilk oynadigi
    // icin kazanmak adil degil, o yuzden sira basa donene kadar devam eder.
    if (!takimlar.some((t) => t.puan >= ayarlar.hedefPuan)) return false;
    return turlarEsitMi(takimlar);
  }

  // Tur sayisi modu: her takim esit sayida tur oynadiginda biter.
  // anlatanSira her tur sonunda artar, yani takimin oynadigi tur sayisidir.
  const enAz = Math.min(...takimlar.map((t) => t.anlatanSira));
  return enAz >= ayarlar.turSayisi;
}

/** Butun takimlar ayni sayida tur oynadi mi. */
export function turlarEsitMi(takimlar: readonly Takim[]): boolean {
  if (takimlar.length === 0) return true;
  const oynanan = takimlar.map((t) => t.anlatanSira);
  return Math.min(...oynanan) === Math.max(...oynanan);
}

/**
 * Son duzlukte miyiz - biri hedefe ulasti ama herkes esit tur oynamadi.
 * Ekranlarda rozet olarak gosterilir, gerilimi yukseltir.
 */
export function sonDuzluktenMi(
  takimlar: readonly Takim[],
  ayarlar: Ayarlar,
): boolean {
  if (ayarlar.bitisModu !== 'puan') return false;
  if (!takimlar.some((t) => t.puan >= ayarlar.hedefPuan)) return false;
  return !turlarEsitMi(takimlar);
}

/** En yuksek puanli takim(lar). Birden fazlaysa beraberlik vardir. */
export function kazananlar(takimlar: readonly Takim[]): Takim[] {
  if (takimlar.length === 0) return [];
  const enYuksek = Math.max(...takimlar.map((t) => t.puan));
  return takimlar.filter((t) => t.puan === enYuksek);
}

/** Skor tablosu icin puana gore sirali kopya. */
export function siraliTakimlar(takimlar: readonly Takim[]): Takim[] {
  return [...takimlar].sort((a, b) => b.puan - a.puan);
}
