/**
 * Turkce'ye ozel harf donusumleri.
 *
 * JavaScript'in toUpperCase() fonksiyonu Turkce'yi bilmez:
 *
 *   'istanbul'.toUpperCase()  ->  'ISTANBUL'   YANLIS
 *   dogrusu                   ->  'İSTANBUL'
 *
 *   'IRMAK'.toLowerCase()     ->  'irmak'      YANLIS
 *   dogrusu                   ->  'ırmak'
 *
 * toLocaleUpperCase('tr-TR') dogru sonucu verir ama ICU verisi ister.
 * Android'de Hermes bazi yapilandirmalarda ICU olmadan gelir ve sessizce
 * yanlis sonuc doner. Bu yuzden esleme elle yapiliyor - hicbir sey
 * calisma ortamina birakilmiyor.
 */

/** Kucuk harften buyuk harfe giderken ozel davranan harfler. */
const BUYUK_ESLEME: Record<string, string> = {
  i: 'İ',
  'ı': 'I',
};

/** Buyuk harften kucuk harfe giderken ozel davranan harfler. */
const KUCUK_ESLEME: Record<string, string> = {
  'İ': 'i',
  I: 'ı',
};

/** Metni Turkce kurallarina gore buyuk harfe cevirir. */
export function trUpper(metin: string): string {
  let cikti = '';
  for (const harf of metin) {
    cikti += BUYUK_ESLEME[harf] ?? harf.toUpperCase();
  }
  return cikti;
}

/** Metni Turkce kurallarina gore kucuk harfe cevirir. */
export function trLower(metin: string): string {
  let cikti = '';
  for (const harf of metin) {
    cikti += KUCUK_ESLEME[harf] ?? harf.toLowerCase();
  }
  return cikti;
}

/** Bas harfi buyuk, gerisi kucuk. Takim ve oyuncu adlari icin. */
export function trBasHarfBuyuk(metin: string): string {
  const kirpik = metin.trim();
  if (kirpik.length === 0) return '';
  const [ilk = '', ...kalan] = [...kirpik];
  return trUpper(ilk) + trLower(kalan.join(''));
}

/**
 * Turkce alfabetik siralama.
 * Varsayilan sort() Unicode kod noktasina gore siralar ve
 * ç, ğ, ı, ö, ş, ü harflerini alfabenin sonuna atar.
 */
const ALFABE = 'AaBbCcÇçDdEeFfGgĞğHhIıİiJjKkLlMmNnOoÖöPpRrSsŞşTtUuÜüVvYyZz';

export function trSirala(a: string, b: string): number {
  const uzunluk = Math.min(a.length, b.length);
  for (let i = 0; i < uzunluk; i++) {
    const sira = ALFABE.indexOf(a[i]!) - ALFABE.indexOf(b[i]!);
    if (sira !== 0) return sira;
  }
  return a.length - b.length;
}
