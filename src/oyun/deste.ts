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

import { ALTIN_ORANI, type HamKart, type Kart } from './tipler';
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
  /** Altin kart indeksleri. Ayar kapaliysa bos kalir. */
  readonly altinlar: readonly number[];
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

/**
 * Deste kaynagi.
 *
 * Sayi verilirse 0'dan o sayiya kadar tum indeksler kullanilir.
 * Dizi verilirse yalnizca o indeksler girer - zorluk suzgeci boyle
 * calisir, destenin bir alt kumesiyle seri kurulabilir.
 */
export type DesteKaynagi = number | readonly number[];

function indeksleriCoz(kaynak: DesteKaynagi): number[] {
  return typeof kaynak === 'number'
    ? Array.from({ length: kaynak }, (_, i) => i)
    : [...kaynak];
}

/** Yeni bir seri baslatir. */
export function desteKur(
  kategoriKimlik: string,
  kaynak: DesteKaynagi,
  rastgele: Rastgele = Math.random,
  altinAdaylar: readonly number[] = [],
): DesteDurumu {
  const sira = diziKaristir(indeksleriCoz(kaynak), null, rastgele);
  return {
    kategoriKimlik,
    sira,
    imlec: 0,
    pasListesi: [],
    pasTuruAktif: false,
    sonGosterilen: null,
    altinlar: altinlariSec(sira, altinAdaylar, rastgele),
  };
}

/**
 * Altin kartlari secer.
 *
 * Destenin %2'si kadar kart, YALNIZCA aday listesinden (zor ve cok zor
 * kelimeler) secilir. Kolay bir kelimeye iki puan vermek dengeyi bozardi -
 * altin kart risk almanin karsiligi olmali.
 */
export function altinlariSec(
  sira: readonly number[],
  adaylar: readonly number[],
  rastgele: Rastgele = Math.random,
): number[] {
  if (adaylar.length === 0 || sira.length === 0) return [];
  const adayKume = new Set(adaylar);
  const destedeki = sira.filter((i) => adayKume.has(i));
  if (destedeki.length === 0) return [];

  const adet = Math.max(1, Math.round(sira.length * ALTIN_ORANI));
  return diziKaristir(destedeki, null, rastgele).slice(0, adet);
}

/** Bu kart altin mi. */
export function altinMi(durum: DesteDurumu, indeks: number): boolean {
  return durum.altinlar.includes(indeks);
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
  kaynak: DesteKaynagi,
  rastgele: Rastgele = Math.random,
  altinAdaylar: readonly number[] = [],
): DesteDurumu {
  const yeniSira = diziKaristir(indeksleriCoz(kaynak), durum.sonGosterilen, rastgele);
  return {
    kategoriKimlik: durum.kategoriKimlik,
    sira: yeniSira,
    imlec: 0,
    pasListesi: [],
    pasTuruAktif: false,
    sonGosterilen: durum.sonGosterilen,
    altinlar: altinlariSec(yeniSira, altinAdaylar, rastgele),
  };
}

/** Indeksi gercek karta cevirir. */
export function kartiGetir(deste: readonly HamKart[], indeks: number): Kart | null {
  const ham = deste[indeks];
  return ham ? hamKartiCevir(ham) : null;
}
