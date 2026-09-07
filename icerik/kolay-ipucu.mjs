/**
 * Tek hamlede cozulen kart tuzaklari.
 *
 * SORUN
 * Bir kartin ana kelimesinin zit anlamlisi yasakli listede yoksa anlatan
 * "sicak degil" deyip isi bitiriyor. Kart bes yasakli kelimeyle korunuyor
 * gorunuyor ama aslinda hic korunmuyor. Ilk aile testinde SOGUK karti
 * tam boyle cozuldu.
 *
 * Ayni sey es anlamli icin de gecerli: es anlamlisini soylemek zaten
 * kelimeyi soylemektir.
 *
 * COZUM
 * Asagidaki esler iki yonlu okunur. Bir kartin ana kelimesinin esi varsa
 * o es yasakli listede OLMAK ZORUNDA. Dogrulayici bunu kontrol eder,
 * boylece bundan sonra yazilan kartlar da ayni tuzagi tasiyamaz.
 *
 * Es listesi kasten dar tutuldu - yalnizca "X degil" demenin tek basina
 * cevabi verdigi kelimeler var. Gevsek cagrisimlar (TUZ/BIBER gibi)
 * disarida, cunku onlar kartlari gereksiz zorlastirirdi.
 */

/** Zit anlamlilar. "X degil" tek basina cevabi verir. */
export const ZIT_ESLER = [
  ['SICAK', 'SOĞUK'],
  ['BÜYÜK', 'KÜÇÜK'],
  ['UZUN', 'KISA'],
  ['AÇIK', 'KAPALI'],
  ['GECE', 'GÜNDÜZ'],
  ['YAZ', 'KIŞ'],
  ['GENÇ', 'YAŞLI'],
  ['YENİ', 'ESKİ'],
  ['HIZLI', 'YAVAŞ'],
  ['ZENGİN', 'FAKİR'],
  ['GÜZEL', 'ÇİRKİN'],
  ['İYİ', 'KÖTÜ'],
  ['DOĞRU', 'YANLIŞ'],
  ['İLERİ', 'GERİ'],
  ['SAĞ', 'SOL'],
  ['ALT', 'ÜST'],
  ['ÖN', 'ARKA'],
  ['İÇERİ', 'DIŞARI'],
  ['İLK', 'SON'],
  ['ERKEN', 'GEÇ'],
  ['KOLAY', 'ZOR'],
  ['BOŞ', 'DOLU'],
  ['TEMİZ', 'KİRLİ'],
  ['ISLAK', 'KURU'],
  ['AĞIR', 'HAFİF'],
  ['KALIN', 'İNCE'],
  ['GENİŞ', 'DAR'],
  ['DERİN', 'SIĞ'],
  ['YÜKSEK', 'ALÇAK'],
  ['SERT', 'YUMUŞAK'],
  ['TATLI', 'ACI'],
  ['AYDINLIK', 'KARANLIK'],
  ['MUTLU', 'ÜZGÜN'],
  ['SEVİNÇ', 'ÜZÜNTÜ'],
  ['GÜLMEK', 'AĞLAMAK'],
  ['GELMEK', 'GİTMEK'],
  ['ALMAK', 'VERMEK'],
  ['AÇMAK', 'KAPATMAK'],
  ['BAŞLAMAK', 'BİTİRMEK'],
  ['DOĞMAK', 'ÖLMEK'],
  ['SAVAŞ', 'BARIŞ'],
  ['DOST', 'DÜŞMAN'],
  ['KADIN', 'ERKEK'],
  ['ANNE', 'BABA'],
  ['SORU', 'CEVAP'],
  ['KAZANMAK', 'KAYBETMEK'],
  ['GALİBİYET', 'MAĞLUBİYET'],
  ['UYUMAK', 'UYANMAK'],
  ['OTURMAK', 'KALKMAK'],
  ['İNMEK', 'ÇIKMAK'],
  ['DOĞU', 'BATI'],
  ['KUZEY', 'GÜNEY'],
  ['YER', 'GÖK'],
  ['KARA', 'DENİZ'],
  ['DÜN', 'YARIN'],
  ['GEÇMİŞ', 'GELECEK'],
  ['SABAH', 'AKŞAM'],
  ['ÖNCE', 'SONRA'],
  ['VAR', 'YOK'],
  ['AZ', 'ÇOK'],
  ['CENNET', 'CEHENNEM'],
  ['SICAKLIK', 'SOĞUKLUK'],
  ['SESSİZLİK', 'GÜRÜLTÜ'],
  ['BARIŞ', 'KAVGA'],
  ['ARZ', 'TALEP'],
  ['KÂR', 'ZARAR'],
  ['GELİR', 'GİDER'],
  ['ALICI', 'SATICI'],
  ['ARTI', 'EKSİ'],
  ['TOPLAMA', 'ÇIKARMA'],
  ['ÇARPMA', 'BÖLME'],
  ['ÇEKİRDEK', 'KABUK'],
  ['GİRİŞ', 'ÇIKIŞ'],
  ['İNİŞ', 'KALKIŞ'],
  ['BAŞLANGIÇ', 'BİTİŞ'],
  ['GELİN', 'DAMAT'],
  ['MİSAFİR', 'EV SAHİBİ'],
  ['ÖDÜL', 'CEZA'],
  ['SUÇLU', 'MASUM'],
  ['GERÇEK', 'YALAN'],
  ['CESARET', 'KORKU'],
  ['UMUT', 'UMUTSUZLUK'],
  ['SAVUNMA', 'HÜCUM'],
  ['İTHALAT', 'İHRACAT'],
  ['ARTMAK', 'AZALMAK'],
  ['DOLUNAY', 'HİLAL'],
  ['ANALOG', 'DİJİTAL'],
  ['KIRSAL', 'KENTSEL'],
  ['KÖY', 'ŞEHİR'],
  ['SORUN', 'ÇÖZÜM'],
];

/** Es anlamlilar. Esini soylemek kelimeyi soylemektir. */
export const ES_ANLAMLILAR = [
  ['ÖĞRETMEN', 'HOCA'],
  ['HEKİM', 'DOKTOR'],
  ['ANI', 'HATIRA'],
  ['ÖYKÜ', 'HİKÂYE'],
  ['SÖZCÜK', 'KELİME'],
  ['TÜMCE', 'CÜMLE'],
  ['YANIT', 'CEVAP'],
  ['ARMAĞAN', 'HEDİYE'],
  ['KONUK', 'MİSAFİR'],
  ['ÖZGÜRLÜK', 'HÜRRİYET'],
  ['BAĞIMSIZLIK', 'İSTİKLAL'],
  ['UYGARLIK', 'MEDENİYET'],
  ['SINAV', 'İMTİHAN'],
  ['ANLAM', 'MANA'],
  ['OLASILIK', 'İHTİMAL'],
  ['YÜZYIL', 'ASIR'],
  ['DOĞA', 'TABİAT'],
  ['EVREN', 'KÂİNAT'],
  ['DENEY', 'TECRÜBE'],
  ['ANIT', 'ABİDE'],
  ['ULUS', 'MİLLET'],
  ['YURT', 'VATAN'],
  ['KENT', 'ŞEHİR'],
  ['GEZGİN', 'SEYYAH'],
  ['KOŞUL', 'ŞART'],
  ['NEDEN', 'SEBEP'],
  ['SONUÇ', 'NETİCE'],
  ['ÖRNEK', 'MİSAL'],
  ['YÖNTEM', 'METOT'],
  ['AMAÇ', 'HEDEF'],
  ['GÖREV', 'VAZİFE'],
  ['ÖDEV', 'VAZİFE'],
  ['ARAÇ', 'VASITA'],
  ['ZOR', 'GÜÇ'],
  ['KOLAY', 'BASİT'],
  ['ESER', 'YAPIT'],
  ['OYUNCU', 'AKTÖR'],
  ['İZLEYİCİ', 'SEYİRCİ'],
  ['GÜLMECE', 'MİZAH'],
  ['ÜNLÜ', 'MEŞHUR'],
  ['ZEKÂ', 'AKIL'],
  ['DÜŞÜNCE', 'FİKİR'],
  ['DUYGU', 'HİS'],
  ['ANLAŞMA', 'SÖZLEŞME'],
  ['SAKLAMAK', 'GİZLEMEK'],
  ['ONARMAK', 'TAMİR ETMEK'],
];

/**
 * Muafiyetler - ana kelime esses, farkli anlamda kullanilmis.
 *
 * Ornek: genel destesindeki DOLU gokten yagan dolu, BOS'un ziddi degil.
 * Bunlara es zorunlulugu uygulanirsa kart sacmalasir.
 */
export const MUAFLAR = [
  { kategori: 'genel', kelime: 'DOLU', es: 'BOŞ' },
  { kategori: 'genel', kelime: 'KAYBETMEK', es: 'KAZANMAK' },
  { kategori: 'kultur', kelime: 'YURT', es: 'VATAN' },
  { kategori: 'populer', kelime: 'HİKÂYE', es: 'ÖYKÜ' },
];
