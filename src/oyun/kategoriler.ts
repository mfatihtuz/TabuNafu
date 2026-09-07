/**
 * Kategori tanimlari ve deste yukleme.
 *
 * DESTE YUKLEME NEDEN BOYLE
 * React Native paketleyicisi dinamik require desteklemez - yol calisma
 * aninda hesaplanamaz, derleme aninda bilinmeli. Bu yuzden asagida
 * statik bir esleme var. Ok fonksiyonu icine alindigi icin require
 * ancak kategori secildiginde calisir, yani sadece secilen kategori
 * bellege girer.
 *
 * KARISIK kategorisi sanaldir, dosyasi yoktur. Secilince tum desteler
 * birlestirilir.
 */

import { ZORLUK_ARALIKLARI, type HamKart, type Kategori, type ZorlukModu } from './tipler';

/**
 * Renkler renk carkina yayildi. Gri ton yok, ucten fazla ayni ailede
 * renk yok - 20 kutucuk yan yana dururken birbirinden ayrilsin.
 */
export const KATEGORILER: readonly Kategori[] = [
  { kimlik: 'genel',     ad: 'Genel',              ikon: 'shapes',           renk: '#17C3B2', hedefKart: 600 },
  { kimlik: 'gunluk',    ad: 'Günlük Yaşam',       ikon: 'sofa',             renk: '#FF9E45', hedefKart: 250 },
  { kimlik: 'yemek',     ad: 'Yemek ve Mutfak',    ikon: 'utensils-crossed', renk: '#E63946', hedefKart: 250 },
  { kimlik: 'fen',       ad: 'Fen Bilimleri',      ikon: 'atom',             renk: '#4CC9F0', hedefKart: 250 },
  { kimlik: 'teknoloji', ad: 'Teknoloji ve YZ',    ikon: 'brain-circuit',    renk: '#7C6BFF', hedefKart: 250 },
  { kimlik: 'tarih',     ad: 'Tarih',              ikon: 'landmark',         renk: '#C9A227', hedefKart: 250 },
  { kimlik: 'cografya',  ad: 'Coğrafya',           ikon: 'mountain',         renk: '#2EAF7D', hedefKart: 250 },
  { kimlik: 'turkiye',   ad: 'Türkiye ve Kültür',  ikon: 'turk-bayragi',     renk: '#E30A17', hedefKart: 250, ikonMetin: '#FFFFFF' },
  { kimlik: 'din',       ad: 'Din Kültürü',        ikon: 'hilal',            renk: '#1E8C6E', hedefKart: 250 },
  { kimlik: 'edebiyat',  ad: 'Edebiyat',           ikon: 'feather',          renk: '#C77DFF', hedefKart: 250 },
  { kimlik: 'sinema',    ad: 'Sinema ve Diziler',  ikon: 'clapperboard',     renk: '#FF4FA3', hedefKart: 250 },
  { kimlik: 'muzik',     ad: 'Müzik',              ikon: 'guitar',           renk: '#F4845F', hedefKart: 250 },
  { kimlik: 'populer',   ad: 'Popüler Kültür',     ikon: 'trending-up',      renk: '#FFB020', hedefKart: 250 },
  { kimlik: 'spor',      ad: 'Spor Dünyası',       ikon: 'volleyball',       renk: '#8AC926', hedefKart: 250 },
  { kimlik: 'takimlar',  ad: 'Takım ve Sporcu',    ikon: 'shield-half',      renk: '#0E86D4', hedefKart: 250 },
  { kimlik: 'meslek',    ad: 'Meslek ve İş',       ikon: 'briefcase',        renk: '#C97B4A', hedefKart: 250 },
  { kimlik: 'saglik',    ad: 'Sağlık',             ikon: 'stethoscope',      renk: '#EF476F', hedefKart: 250 },
  { kimlik: 'hobi',      ad: 'Hobi ve Oyunlar',    ikon: 'dices',            renk: '#8ECAE6', hedefKart: 250 },
  { kimlik: 'seyahat',   ad: 'Seyahat',            ikon: 'plane',            renk: '#00B2CA', hedefKart: 250 },
  { kimlik: 'kultur',    ad: 'Genel Kültür',       ikon: 'graduation-cap',   renk: '#FFD166', hedefKart: 250 },
];

export const KARISIK_KIMLIK = 'karisik';
export const KENDI_KIMLIK = 'kendi';

/**
 * Kullanicinin kendi yazdigi kelimeler.
 *
 * Dosyasi yoktur - kartlar store'da tutulur ve diske yazilir. Bu yuzden
 * desteyiYukle disaridan kendiKartlar almak zorunda.
 */
export const KENDI: Kategori = {
  kimlik: KENDI_KIMLIK,
  ad: 'Kelimelerim',
  ikon: 'feather',
  renk: '#9B7EDE',
  hedefKart: 0,
};

export const KARISIK: Kategori = {
  kimlik: KARISIK_KIMLIK,
  ad: 'KARIŞIK',
  ikon: 'shuffle',
  renk: '#D4A050',
  hedefKart: 5350,
};

/**
 * Statik deste eslemesi. Ok fonksiyonu sayesinde require tembel calisir,
 * yani sadece secilen kategorinin JSON'u bellege girer.
 */
const DESTELER: Record<string, () => HamKart[]> = {
  genel:     () => require('../../assets/kelimeler/genel.json'),
  gunluk:    () => require('../../assets/kelimeler/gunluk.json'),
  yemek:     () => require('../../assets/kelimeler/yemek.json'),
  fen:       () => require('../../assets/kelimeler/fen.json'),
  teknoloji: () => require('../../assets/kelimeler/teknoloji.json'),
  tarih:     () => require('../../assets/kelimeler/tarih.json'),
  cografya:  () => require('../../assets/kelimeler/cografya.json'),
  turkiye:   () => require('../../assets/kelimeler/turkiye.json'),
  din:       () => require('../../assets/kelimeler/din.json'),
  edebiyat:  () => require('../../assets/kelimeler/edebiyat.json'),
  sinema:    () => require('../../assets/kelimeler/sinema.json'),
  muzik:     () => require('../../assets/kelimeler/muzik.json'),
  populer:   () => require('../../assets/kelimeler/populer.json'),
  spor:      () => require('../../assets/kelimeler/spor.json'),
  takimlar:  () => require('../../assets/kelimeler/takimlar.json'),
  meslek:    () => require('../../assets/kelimeler/meslek.json'),
  saglik:    () => require('../../assets/kelimeler/saglik.json'),
  hobi:      () => require('../../assets/kelimeler/hobi.json'),
  seyahat:   () => require('../../assets/kelimeler/seyahat.json'),
  kultur:    () => require('../../assets/kelimeler/kultur.json'),
};

/** Bir kez birlestirilen KARISIK destesi burada saklanir. */
let karisikOnbellek: HamKart[] | null = null;

export function desteyiYukle(
  kategoriKimlik: string,
  kendiKartlar: readonly HamKart[] = [],
): HamKart[] {
  if (kategoriKimlik === KENDI_KIMLIK) return [...kendiKartlar];

  if (kategoriKimlik === KARISIK_KIMLIK) {
    if (!karisikOnbellek) {
      karisikOnbellek = Object.values(DESTELER).flatMap((yukle) => yukle());
    }
    // Kendi kelimeleri de karisiga girer - onbellege yazilmaz cunku
    // kullanici yeni kart ekleyince degisir
    return kendiKartlar.length > 0 ? [...karisikOnbellek, ...kendiKartlar] : karisikOnbellek;
  }

  const yukle = DESTELER[kategoriKimlik];
  return yukle ? yukle() : [];
}

/**
 * Zorluk suzgecinden gecen kart indekslerini dondurur.
 *
 * Suzgec desteyi asiri kucultursa (kullanicinin kendi kartlari hep ayni
 * zorluktaysa olabilir) tum deste dondurulur - oyuncuyu bos desteyle
 * bas basa birakmaktansa suzgeci yok saymak iyidir.
 */
export const EN_AZ_KART = 12;

export function zorlukIndeksleri(
  deste: readonly HamKart[],
  mod: ZorlukModu,
): number[] {
  if (mod === 'karisik') return deste.map((_, i) => i);

  const izinli = ZORLUK_ARALIKLARI[mod];
  const secilen: number[] = [];
  for (let i = 0; i < deste.length; i++) {
    if (izinli.includes(deste[i]![6])) secilen.push(i);
  }
  return secilen.length >= EN_AZ_KART ? secilen : deste.map((_, i) => i);
}

export function kategoriBul(kimlik: string): Kategori {
  if (kimlik === KARISIK_KIMLIK) return KARISIK;
  if (kimlik === KENDI_KIMLIK) return KENDI;
  return KATEGORILER.find((k) => k.kimlik === kimlik) ?? KARISIK;
}

/**
 * Kategori ekraninda gosterilecek kart sayisi.
 * Zorluk suzgeci acikken suzgecten gecen sayiyi verir - kutucuktaki
 * rakam gercekten oynanacak deste kadar olsun.
 */
export function kartSayisi(
  kategoriKimlik: string,
  mod: ZorlukModu = 'karisik',
  kendiKartlar: readonly HamKart[] = [],
): number {
  return zorlukIndeksleri(desteyiYukle(kategoriKimlik, kendiKartlar), mod).length;
}

/**
 * Altin kart adaylari - yalnizca zor (4) ve cok zor (5) kelimeler.
 *
 * Kolay bir kelimeye iki puan vermek dengeyi bozardi. Altin kart risk
 * almanin karsiligi olmali, hediye degil.
 */
export function altinAdaylari(deste: readonly HamKart[]): number[] {
  const adaylar: number[] = [];
  for (let i = 0; i < deste.length; i++) {
    const zorluk = deste[i]![6];
    if (zorluk >= 4) adaylar.push(i);
  }
  return adaylar;
}
