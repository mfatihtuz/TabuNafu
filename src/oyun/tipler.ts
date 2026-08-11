/**
 * Oyunun tum veri tipleri.
 *
 * Adlandirma: tip adlari Turkce ve PascalCase. Alan adlari Turkce ve
 * camelCase, ancak Turkce karakter kullanilmaz (pasHakki, sureBittiginde).
 * Gerekce: 'pasHakkı' ile 'pasHakki' JavaScript'te iki ayri degiskendir
 * ve gozle ayirmak neredeyse imkansizdir.
 */

/** 1 cok kolay ... 5 cok zor */
export type Zorluk = 1 | 2 | 3 | 4 | 5;

/**
 * Kartin diskteki hali. Yer kaplamasin diye dizi olarak saklanir:
 * [kelime, yasakli1..yasakli5, zorluk]
 * 5.350 kartta nesne bicimi yaklasik uc kat yer tutardi.
 */
export type HamKart = readonly [string, string, string, string, string, string, number];

/** Kartin kod icinde kullanilan hali. */
export type Kart = {
  readonly kelime: string;
  readonly yasaklilar: readonly string[];
  readonly zorluk: Zorluk;
};

export function hamKartiCevir(ham: HamKart): Kart {
  return {
    kelime: ham[0],
    yasaklilar: [ham[1], ham[2], ham[3], ham[4], ham[5]],
    zorluk: (ham[6] as Zorluk) ?? 3,
  };
}

/** Kategori tanimi. Kelimeler ayri dosyada, burada sadece ust bilgi var. */
export type Kategori = {
  readonly kimlik: string;
  readonly ad: string;
  readonly ikon: string;
  readonly renk: string;
  /** Kutucuktaki ikonun rengi. Verilmezse koyu varsayilan kullanilir. */
  readonly ikonMetin?: string;
  readonly hedefKart: number;
};

export type Takim = {
  ad: string;
  renk: string;
  puan: number;
  oyuncular: string[];
  /** Takim icinde siradaki anlaticinin sirasi. Dongusel ilerler. */
  anlatanSira: number;
};

export type BitisModu = 'puan' | 'tur' | 'sinirsiz';

export type Ayarlar = {
  sure: number;
  pasHakki: number;
  bitisModu: BitisModu;
  hedefPuan: number;
  turSayisi: number;
  sonKartHakki: boolean;
  sonKartSure: number;
  sesAcik: boolean;
  titresimAcik: boolean;
  isimlerAcik: boolean;
};

export const VARSAYILAN_AYARLAR: Ayarlar = {
  sure: 60,
  pasHakki: 3,
  bitisModu: 'puan',
  hedefPuan: 30,
  turSayisi: 9,
  sonKartHakki: false,
  sonKartSure: 5,
  sesAcik: true,
  titresimAcik: true,
  isimlerAcik: false,
};

/** Ayar ekranlarindaki secenek listeleri. */
export const SURE_SECENEKLERI = [30, 45, 60, 75, 90, 120] as const;
export const PAS_SECENEKLERI = [0, 1, 2, 3, 4, 5] as const;
export const PUAN_SECENEKLERI = [10, 15, 20, 25, 30, 40] as const;
export const TUR_SECENEKLERI = [5, 7, 9, 11, 13, 15] as const;
export const SON_KART_SURE_SECENEKLERI = [3, 5, 10] as const;

/** Bir turda islenen kart sonuclari. */
export type TurSayaclari = {
  readonly dogru: number;
  readonly yanlis: number;
  readonly pas: number;
};

export type AksiyonTuru = 'dogru' | 'yanlis' | 'pas';
