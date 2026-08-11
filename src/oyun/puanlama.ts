/**
 * Puanlama ve oyun bitisi. Saf fonksiyonlar.
 *
 *   dogru   +1
 *   yanlis  -1   (yasakli kelime, el hareketi, kural disi anlatim)
 *   pas      0
 */

import type { Ayarlar, Takim, TurSayaclari } from './tipler';

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
    return takimlar.some((t) => t.puan >= ayarlar.hedefPuan);
  }

  // Tur sayisi modu: her takim esit sayida tur oynadiginda biter.
  // anlatanSira her tur sonunda artar, yani takimin oynadigi tur sayisidir.
  const enAz = Math.min(...takimlar.map((t) => t.anlatanSira));
  return enAz >= ayarlar.turSayisi;
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
