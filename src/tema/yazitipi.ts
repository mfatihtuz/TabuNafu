/**
 * Tipografi.
 *
 * Baslik: Baloo 2. Fredoka'dan buraya gecildi cunku Fredoka'nin
 * S cengeli ve I noktasi govdeden cok daha ince cizilmis, buyuk
 * puntoda goze batiyordu. Baloo 2'nin Latin Extended cizimleri
 * govdeyle ayni agirlikta.
 *
 * Govde: Manrope.
 *
 * Ikisi de uygulamaya gomulu gelir, agdan cekilmez.
 */

export const YAZI = {
  baslik: 'Baloo2_700Bold',
  baslikOrta: 'Baloo2_600SemiBold',
  govde: 'Manrope_500Medium',
  govdeKalin: 'Manrope_700Bold',
  govdeCokKalin: 'Manrope_800ExtraBold',
} as const;

/** Tipografik olcek. Ara degerler kullanilmaz. */
export const BOYUT = {
  minik: 10.5,
  kucuk: 12,
  notr: 14,
  govde: 15.5,
  orta: 17,
  buyuk: 20,
  baslik: 28,
  devasa: 40,
  kart: 44,
  puan: 76,
} as const;

/**
 * Turkce harflerin alt kuyruklari (S, C, G) sigsin diye satir yuksekligi
 * bol tutulur. Dar birakilinca kuyruklar kirpiliyor.
 */
export const SATIR = {
  sik: 1.2,
  normal: 1.35,
  bol: 1.55,
} as const;
