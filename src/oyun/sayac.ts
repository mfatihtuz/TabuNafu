/**
 * Tur sayaci - saf durum makinesi.
 *
 * Zamanlayiciyi burada kurmuyoruz. Bu dosya sadece "bir saniye gecti,
 * yeni durum ne olmali" sorusunu cevaplar. Boylece son kart mekanigi
 * gercek zaman beklemeden test edilebilir.
 *
 * AKIS
 *
 *   ana sure akiyor
 *        |
 *        v  0'a iner
 *   KORNA calar
 *        |
 *        +-- son kart hakki KAPALI -> tur biter
 *        |
 *        +-- son kart hakki ACIK
 *                 |
 *                 v
 *            bonus sure baslar (varsayilan 5 sn)
 *            kart kirmiziya doner, PAS KILITLENIR
 *                 |
 *                 +-- dogru/yanlis basilir -> puan islenir, tur biter
 *                 +-- bonus sure biter     -> puan yok, tur biter
 *
 * Pas'in kilitlenmesi onemli: kilitli olmasa takim pas basip yeni kart
 * alarak turu istedigi kadar uzatabilirdi.
 */

import type { Ayarlar } from './tipler';

export type SayacDurumu = {
  readonly kalanSaniye: number;
  readonly calisiyorMu: boolean;
  readonly sonKartModuAktif: boolean;
};

export type SayacOlayi = 'anaSureBitti' | 'sonKartBasladi' | 'turBitti' | null;

export type SayacSonucu = {
  readonly durum: SayacDurumu;
  readonly olay: SayacOlayi;
};

export function sayacKur(sure: number): SayacDurumu {
  return { kalanSaniye: sure, calisiyorMu: false, sonKartModuAktif: false };
}

export function baslat(durum: SayacDurumu): SayacDurumu {
  return { ...durum, calisiyorMu: true };
}

/**
 * Duraklat. Deste tur ortasinda bitip modal cikinca kullanilir -
 * kullanici karar verirken sure akmamali.
 */
export function duraklat(durum: SayacDurumu): SayacDurumu {
  return { ...durum, calisiyorMu: false };
}

export function devamEt(durum: SayacDurumu): SayacDurumu {
  return { ...durum, calisiyorMu: true };
}

/** Bir saniye ilerletir ve olusan olayi bildirir. */
export function saniyeGec(durum: SayacDurumu, ayarlar: Ayarlar): SayacSonucu {
  if (!durum.calisiyorMu) return { durum, olay: null };

  const kalan = durum.kalanSaniye - 1;

  if (kalan > 0) {
    return { durum: { ...durum, kalanSaniye: kalan }, olay: null };
  }

  // Bonus sure de doldu, tur kesin biter
  if (durum.sonKartModuAktif) {
    return {
      durum: { ...durum, kalanSaniye: 0, calisiyorMu: false },
      olay: 'turBitti',
    };
  }

  // Ana sure bitti
  if (!ayarlar.sonKartHakki) {
    return {
      durum: { ...durum, kalanSaniye: 0, calisiyorMu: false },
      olay: 'anaSureBitti',
    };
  }

  return {
    durum: {
      kalanSaniye: ayarlar.sonKartSure,
      calisiyorMu: true,
      sonKartModuAktif: true,
    },
    olay: 'sonKartBasladi',
  };
}

/** Son 10 saniyede tik sesi calar ve halka nabiz atar. */
export function acilDurumMu(durum: SayacDurumu): boolean {
  return durum.sonKartModuAktif || (durum.kalanSaniye <= 10 && durum.kalanSaniye > 0);
}

/** Pas basilabilir mi. Son kart modunda kilitlidir. */
export function pasBasilabilirMi(
  durum: SayacDurumu,
  pasSayisi: number,
  pasHakki: number,
): boolean {
  if (durum.sonKartModuAktif) return false;
  return pasSayisi < pasHakki;
}

/** Halkanin dolulugu (0..1). Bonus surede kendi olcegini kullanir. */
export function halkaOrani(durum: SayacDurumu, ayarlar: Ayarlar): number {
  const toplam = durum.sonKartModuAktif ? ayarlar.sonKartSure : ayarlar.sure;
  if (toplam <= 0) return 0;
  return Math.max(0, Math.min(1, durum.kalanSaniye / toplam));
}
