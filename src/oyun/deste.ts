/**
 * Deste mantigi. Tamamen saf fonksiyonlar - React'e, depolamaya ve
 * zamana bagli degil, bu yuzden bastan sona test edilebilir.
 *
 * SERININ UC ASAMASI
 *
 *   1  ANA GECIS
 *      Kategorinin butun kartlari karilir. Deste bitmeden hicbir kart
 *      ikinci kez gelmez. Tekrar ihtimali dusuk degil, SIFIRDIR.
 *
 *   2  PAS TURU
 *      Ana geciste pas gecilen kartlar tek seferlik bir mini seri olur.
 *      Kullaniciya sorulmadan devam edilir. Bu turda pas gecilenler
 *      TEKRAR toplanmaz, yoksa sonsuz dongu olusurdu.
 *
 *   3  SERI BITTI
 *      Yeniden karistir veya kategori degistir. Iki durumda da puanlar
 *      korunur.
 */

import type { HamKart, Kart } from './tipler';
import { hamKartiCevir } from './tipler';

export type DesteDurumu = {
  readonly kategoriKimlik: string;
  /** Cekilecek kart indekslerinin karilmis sirasi. */
  readonly sira: readonly number[];
  /** Sirada kacinci kartta oldugumuz. */
  readonly imlec: number;
  /** Ana geciste pas gecilen kart indeksleri. */
  readonly pasListesi: readonly number[];
  readonly pasTuruAktif: boolean;
  /** En son gosterilen kartin indeksi. Yeniden karmada ilk kart bu olamaz. */
  readonly sonGosterilen: number | null;
};

export type CekimSonucu =
  | { readonly tur: 'kart'; readonly durum: DesteDurumu; readonly indeks: number }
  | { readonly tur: 'pasTuruBasladi'; readonly durum: DesteDurumu; readonly kartSayisi: number }
  | { readonly tur: 'seriBitti'; readonly durum: DesteDurumu };

/** Test edilebilirlik icin rastgeleligi disaridan alabiliyoruz. */
export type Rastgele = () => number;

/**
 * Fisher-Yates karma. Diziyi kopyalar, kaynagi bozmaz.
 *
 * kacinilacakIlk verilirse yeni destenin ilk karti o olamaz. Boylece
 * yeniden karistirdiktan hemen sonra ayni kelime tekrar karsiya gelmez.
 */
export function diziKaristir(
  dizi: readonly number[],
  kacinilacakIlk: number | null = null,
  rastgele: Rastgele = Math.random,
): number[] {
  const sira = [...dizi];
  for (let i = sira.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [sira[i], sira[j]] = [sira[j]!, sira[i]!];
  }
  if (sira.length > 1 && kacinilacakIlk !== null && sira[0] === kacinilacakIlk) {
    [sira[0], sira[1]] = [sira[1]!, sira[0]!];
  }
  return sira;
}

/** Yeni bir seri baslatir. */
export function desteKur(
  kategoriKimlik: string,
  kartSayisi: number,
  rastgele: Rastgele = Math.random,
): DesteDurumu {
  const tumIndeksler = Array.from({ length: kartSayisi }, (_, i) => i);
  return {
    kategoriKimlik,
    sira: diziKaristir(tumIndeksler, null, rastgele),
    imlec: 0,
    pasListesi: [],
    pasTuruAktif: false,
    sonGosterilen: null,
  };
}

export function desteBittiMi(durum: DesteDurumu): boolean {
  return durum.imlec >= durum.sira.length;
}

/** Destede kac kart kaldi. */
export function kalanKart(durum: DesteDurumu): number {
  return Math.max(0, durum.sira.length - durum.imlec);
}

/**
 * Siradaki karti ceker.
 *
 * Uc sonuctan biri doner:
 *   kart             normal akis, indeks ile birlikte
 *   pasTuruBasladi   ana gecis bitti, pas gecilenler mini seri oldu.
 *                    Cagiran taraf bildirim gosterip TEKRAR cagirmali.
 *   seriBitti        her sey tukendi, kullaniciya sorulmali
 */
export function kartCek(durum: DesteDurumu): CekimSonucu {
  if (desteBittiMi(durum)) {
    // Ana gecis bitti ve pas gecilen kart varsa once onlar gelir
    if (!durum.pasTuruAktif && durum.pasListesi.length > 0) {
      const yeniSira = diziKaristir(durum.pasListesi, durum.sonGosterilen);
      return {
        tur: 'pasTuruBasladi',
        kartSayisi: yeniSira.length,
        durum: {
          ...durum,
          sira: yeniSira,
          imlec: 0,
          pasTuruAktif: true,
          // Bu turda pas gecilenler tekrar toplanmaz
          pasListesi: [],
        },
      };
    }
    return { tur: 'seriBitti', durum };
  }

  const indeks = durum.sira[durum.imlec]!;
  return {
    tur: 'kart',
    indeks,
    durum: { ...durum, imlec: durum.imlec + 1, sonGosterilen: indeks },
  };
}

/**
 * Aktif kart pas gecildi.
 * Sadece ana geciste toplanir - pas turunda toplanirsa dongu bitmez.
 */
export function pasKaydet(durum: DesteDurumu): DesteDurumu {
  if (durum.pasTuruAktif || durum.sonGosterilen === null) return durum;
  return { ...durum, pasListesi: [...durum.pasListesi, durum.sonGosterilen] };
}

/** Seri bitti, ayni kategoride bastan. Puanlar cagiran tarafta korunur. */
export function yenidenKaristir(
  durum: DesteDurumu,
  kartSayisi: number,
  rastgele: Rastgele = Math.random,
): DesteDurumu {
  const tumIndeksler = Array.from({ length: kartSayisi }, (_, i) => i);
  return {
    kategoriKimlik: durum.kategoriKimlik,
    sira: diziKaristir(tumIndeksler, durum.sonGosterilen, rastgele),
    imlec: 0,
    pasListesi: [],
    pasTuruAktif: false,
    sonGosterilen: durum.sonGosterilen,
  };
}

/** Indeksi gercek karta cevirir. */
export function kartiGetir(deste: readonly HamKart[], indeks: number): Kart | null {
  const ham = deste[indeks];
  return ham ? hamKartiCevir(ham) : null;
}
