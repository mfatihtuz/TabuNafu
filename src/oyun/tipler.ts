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
  /** Oyun boyunca biriken sayaclar. Kazanan ekraninda gosterilir. */
  toplam: TurSayaclari;
  /** Tek turda alinan en yuksek puan. */
  enIyiTur: number;
  /**
   * Handikap. Cocuklar ve teknolojiye uzak buyukler icin.
   * Ek saniye vermek yerine tur suresi 1.5 katina cikar - boylece
   * ayarlanan sure ne olursa olsun oran ayni kalir.
   */
  handikap: boolean;
};

export type BitisModu = 'puan' | 'tur' | 'sinirsiz';

/**
 * Deste zorluk suzgeci.
 *
 * Her kartin 1-5 arasi zorlugu var ve dagilim %10/%35/%35/%15/%5.
 * Cocuk modu en kolay iki seviyeyi alir (destenin ~%45'i), zor mod
 * ustteki uc seviyeyi (~%55). Ikisi de tek basina seri kuracak kadar
 * kart birakiyor.
 */
export type ZorlukModu = 'cocuk' | 'karisik' | 'zor';

export const ZORLUK_ARALIKLARI: Record<ZorlukModu, readonly number[]> = {
  cocuk: [1, 2],
  karisik: [1, 2, 3, 4, 5],
  zor: [3, 4, 5],
};

/**
 * Tur cesitleri. Puanlama ayni kalir, yalnizca ANLATMA bicimi degisir -
 * boylece heyecan artar ama denge bozulmaz.
 */
export type TurCesidi = 'tekKelime' | 'sessiz' | 'ters' | 'hizli';

export type TurCesidiSikligi = 'kapali' | 'her3' | 'her5';

export const TUR_CESIDI_BILGI: Record<
  TurCesidi,
  { ad: string; aciklama: string; ikon: string }
> = {
  tekKelime: {
    ad: 'Tek Kelime',
    aciklama: 'Her kart için tek bir kelime ipucu verebilirsin. Tek kelime.',
    ikon: 'feather',
  },
  sessiz: {
    ad: 'Sessiz Tur',
    aciklama: 'Konuşmak yok. Sadece el kol hareketi. Yasaklılar yine geçerli.',
    ikon: 'users',
  },
  ters: {
    ad: 'Ters Tur',
    aciklama: 'Takımın anlatır, sen tahmin edersin. Ekrana sen bakma.',
    ikon: 'shuffle',
  },
  hizli: {
    ad: 'Hızlı Tur',
    aciklama: 'Süre yarıya iner. Aynı puan, yarım zaman.',
    ikon: 'timer',
  },
};

export const TUR_CESITLERI: readonly TurCesidi[] = [
  'tekKelime',
  'sessiz',
  'ters',
  'hizli',
];

export const ZORLUK_ETIKETLERI: Record<ZorlukModu, string> = {
  cocuk: 'Çocuk',
  karisik: 'Karışık',
  zor: 'Zor',
};

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
  zorlukModu: ZorlukModu;
  /** Aksiyon butonlarini ters cevirir - sol elle tutanlar icin. */
  solElModu: boolean;
  /** Ozel tur cesitlerinin sikligi. Kapali varsayilan. */
  turCesidiSikligi: TurCesidiSikligi;
  /** Oyunun ilk turu puansiz deneme turu olsun mu. */
  isinmaTuru: boolean;
  /** Altin kart acik mi. Destenin %2'si, yalnizca zor kelimelerden. */
  altinKart: boolean;
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
  zorlukModu: 'karisik',
  solElModu: false,
  turCesidiSikligi: 'kapali',
  isinmaTuru: false,
  altinKart: false,
};

/** Ayar ekranlarindaki secenek listeleri. */
export const SURE_SECENEKLERI = [30, 45, 60, 75, 90, 120] as const;
export const PAS_SECENEKLERI = [0, 1, 2, 3, 4, 5] as const;
export const PUAN_SECENEKLERI = [10, 15, 20, 25, 30, 40] as const;
export const TUR_SECENEKLERI = [5, 7, 9, 11, 13, 15] as const;
export const SON_KART_SURE_SECENEKLERI = [3, 5, 10] as const;

/** Handikapli takimin tur suresi. Oran sabit, ek saniye yok. */
export const HANDIKAP_CARPANI = 1.5;

export function takimSuresi(sure: number, handikap: boolean): number {
  return handikap ? Math.round(sure * HANDIKAP_CARPANI) : sure;
}

/**
 * Handikabin getirdigi EK saniye.
 *
 * Ekranda toplam sure degil fark yazilir - "90 saniye" degil
 * "+30 saniye ek sure". Kullanici ne kazandigini boyle aninda goruyor,
 * ustelik ayarlanan sure degistikce fark da kendiliginden degisiyor:
 * 60 -> +30, 120 -> +60.
 */
export function handikapFarki(sure: number): number {
  return takimSuresi(sure, true) - sure;
}

/** Altin kart destenin yuzde kaci. */
export const ALTIN_ORANI = 0.02;

/** Altin kart puani. Simetrik - dogru +2, yanlis -2. */
export const ALTIN_PUAN = 2;

/** Bir turda islenen kart sonuclari. */
export type TurSayaclari = {
  readonly dogru: number;
  readonly yanlis: number;
  readonly pas: number;
};

export type AksiyonTuru = 'dogru' | 'yanlis' | 'pas';
