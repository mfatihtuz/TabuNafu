/**
 * Oyunun tek dogruluk kaynagi.
 *
 * Buradaki her karar saf fonksiyonlara devredilir (deste.ts, puanlama.ts,
 * sayac.ts). Bu dosya sadece onlari birbirine bagliyor ve sonucu
 * ekranlara aciyor. Boylece oyun kurallari React'ten bagimsiz kaliyor
 * ve testleri cihaz gerektirmiyor.
 *
 * Kalici kayit: yarim kalan oyun uygulama kapansa da kaybolmaz.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  altinMi,
  desteKur,
  kartCek,
  kartiGetir,
  pasKaydet,
  yenidenKaristir,
  type DesteDurumu,
} from './deste';
import { altinAdaylari, desteyiYukle, zorlukIndeksleri } from './kategoriler';
import {
  BOS_TUR,
  aksiyonPuani,
  dogruEkle,
  altinPuani,
  oyunBittiMi,
  pasEkle,
  sonDuzluktenMi,
  turPuani,
  yanlisEkle,
} from './puanlama';
import {
  baslat,
  devamEt,
  duraklat,
  pasBasilabilirMi,
  saniyeGec,
  sayacKur,
  type SayacDurumu,
} from './sayac';
import { TAKIM_ADLARI, TAKIM_RENKLERI } from '../tema/renkler';
import {
  VARSAYILAN_AYARLAR,
  type AksiyonTuru,
  type Ayarlar,
  type HamKart,
  type Kart,
  type Takim,
  type TurCesidi,
  type TurSayaclari,
  takimSuresi,
  TUR_CESITLERI,
} from './tipler';

/** Tur ekraninin cevap vermesi gereken olaylar. */
export type OyunOlayi =
  | { tur: 'kartDegisti' }
  | { tur: 'pasTuruBasladi'; kartSayisi: number }
  | { tur: 'seriBitti' }
  | { tur: 'sonKartBasladi' }
  | { tur: 'turBitti' }
  | { tur: 'sonSaniyeler' };

/** Bitmis bir oyunun sonuc tablosu. Son bes tanesi saklanir. */
export type OyunKaydi = {
  readonly zaman: number;
  readonly kategori: string;
  readonly takimlar: readonly {
    readonly ad: string;
    readonly renk: string;
    readonly puan: number;
    readonly toplam: TurSayaclari;
    readonly enIyiTur: number;
  }[];
};

/** Kac oyun saklanir. Hatira icin yeter, depolamayi sismeye birakmaz. */
export const GECMIS_SINIRI = 5;

/** Geri almak icin saklanan anlik goruntu. */
export type GeriAdim = {
  readonly deste: DesteDurumu;
  readonly aktifKart: Kart | null;
  readonly turSayaclari: TurSayaclari;
  readonly takimPuani: number;
  readonly takimSira: number;
};

export type OyunDurumu = {
  ayarlar: Ayarlar;
  takimlar: Takim[];
  siradakiTakim: number;
  deste: DesteDurumu | null;
  sayac: SayacDurumu;
  aktifKart: Kart | null;
  turSayaclari: TurSayaclari;
  /** Cift dokunmayi engellemek icin kart gecisi sirasinda kilit. */
  kilitli: boolean;
  /** Seri bitti sorusu ekranda mi. */
  seriBittiSoruluyor: boolean;
  cikisSoruluyor: boolean;
  /** Kullanicinin kendi yazdigi kartlar. Diske yazilir. */
  kendiKartlar: HamKart[];
  /** Bozuk oldugu bildirilen kartlar. Diske yazilir. */
  bildirilenler: HamKart[];
  /**
   * Son aksiyondan onceki durum. Yanlis basmayi duzeltmek icin tutulur.
   * Tek adim geri alinir - amac hatayi duzeltmek, gecmisi gezmek degil.
   */
  geriAlinacak: GeriAdim | null;
  /** Bu turda gecerli olan ozel tur cesidi. Yoksa null. */
  aktifTurCesidi: TurCesidi | null;
  /** Bu tur puansiz isinma turu mu. */
  isinmaAktif: boolean;
  /** Oyun basindan beri oynanan toplam tur. Tur cesidi sirasi buna bakar. */
  oynananTur: number;
  /** Aktif kart altin mi. */
  aktifKartAltin: boolean;
  /** Son bes oyunun sonuc tablosu. Diske yazilir. */
  gecmisOyunlar: OyunKaydi[];
  /** Son olay - ekranlar buna bakip ses calar ve animasyon tetikler. */
  sonOlay: OyunOlayi | null;

  takimSayisiniAyarla: (adet: number) => void;
  takimGuncelle: (sira: number, alanlar: Partial<Takim>) => void;
  oyuncuSayisiniAyarla: (takimSira: number, adet: number) => void;
  oyuncuGuncelle: (takimSira: number, oyuncuSira: number, ad: string) => void;
  ayarGuncelle: (alanlar: Partial<Ayarlar>) => void;

  kategoriSec: (kimlik: string) => void;
  turBaslat: () => void;
  aksiyonIsle: (tur: AksiyonTuru) => void;
  saniyeIlerlet: () => void;
  turuBitir: () => void;
  geriAl: () => void;
  kendiKartEkle: (kart: HamKart) => void;
  kendiKartSil: (sira: number) => void;
  kartBildir: (kart: Kart) => void;
  bildirimSil: (sira: number) => void;
  cikisiSor: () => void;
  cikisiKapat: () => void;
  siradakiTakimaGec: () => void;
  oyunuKaydet: () => void;

  yenidenKar: () => void;
  seriBittiKapat: () => void;
  olayTemizle: () => void;
  oyunuSifirla: () => void;
  yeniOyun: () => void;
};

function takimOlustur(sira: number): Takim {
  return {
    ad: TAKIM_ADLARI[sira] ?? `${sira + 1}. Takım`,
    renk: TAKIM_RENKLERI[sira] ?? TAKIM_RENKLERI[0],
    puan: 0,
    oyuncular: ['', ''],
    anlatanSira: 0,
    toplam: BOS_TUR,
    enIyiTur: 0,
    handikap: false,
  };
}

export const oyunDeposu = create<OyunDurumu>()(
  persist(
    (ayarla, oku) => ({
      ayarlar: { ...VARSAYILAN_AYARLAR },
      takimlar: [takimOlustur(0), takimOlustur(1)],
      siradakiTakim: 0,
      deste: null,
      sayac: sayacKur(VARSAYILAN_AYARLAR.sure),
      aktifKart: null,
      turSayaclari: BOS_TUR,
      kilitli: false,
      seriBittiSoruluyor: false,
      cikisSoruluyor: false,
      kendiKartlar: [],
      bildirilenler: [],
      geriAlinacak: null,
      aktifTurCesidi: null,
      isinmaAktif: false,
      oynananTur: 0,
      aktifKartAltin: false,
      gecmisOyunlar: [],
      sonOlay: null,

      // ---- Kurulum ----

      takimSayisiniAyarla: (adet) =>
        ayarla((d) => {
          const yeni = [...d.takimlar];
          while (yeni.length < adet) yeni.push(takimOlustur(yeni.length));
          while (yeni.length > adet) yeni.pop();
          return { takimlar: yeni, siradakiTakim: 0 };
        }),

      takimGuncelle: (sira, alanlar) =>
        ayarla((d) => ({
          takimlar: d.takimlar.map((t, i) => (i === sira ? { ...t, ...alanlar } : t)),
        })),

      oyuncuSayisiniAyarla: (takimSira, adet) =>
        ayarla((d) => ({
          takimlar: d.takimlar.map((t, i) => {
            if (i !== takimSira) return t;
            const oyuncular = [...t.oyuncular];
            while (oyuncular.length < adet) oyuncular.push('');
            while (oyuncular.length > adet) oyuncular.pop();
            return { ...t, oyuncular };
          }),
        })),

      oyuncuGuncelle: (takimSira, oyuncuSira, ad) =>
        ayarla((d) => ({
          takimlar: d.takimlar.map((t, i) => {
            if (i !== takimSira) return t;
            const oyuncular = [...t.oyuncular];
            oyuncular[oyuncuSira] = ad;
            return { ...t, oyuncular };
          }),
        })),

      ayarGuncelle: (alanlar) =>
        ayarla((d) => ({ ayarlar: { ...d.ayarlar, ...alanlar } })),

      // ---- Seri ----

      kategoriSec: (kimlik) => {
        const durum = oku();
        const deste = desteyiYukle(kimlik, durum.kendiKartlar);
        ayarla({
          deste: desteKur(
            kimlik,
            zorlukIndeksleri(deste, durum.ayarlar.zorlukModu),
            Math.random,
            durum.ayarlar.altinKart ? altinAdaylari(deste) : [],
          ),
          aktifKart: null,
          seriBittiSoruluyor: false,
          geriAlinacak: null,
          sonOlay: null,
        });
      },

      turBaslat: () => {
        const durum = oku();
        const { ayarlar } = durum;

        // Isinma turu: oyunun ilk turu puansiz denemedir. Sira da
        // ilerlemez, ayni takim hemen ardindan gercek turunu oynar.
        const isinma = ayarlar.isinmaTuru && durum.oynananTur === 0;

        const cesit = isinma ? null : turCesidiSec(ayarlar, durum.oynananTur);

        // Handikap ek saniye degil carpan - ayarlanan sure ne olursa olsun
        // oran ayni kalir
        const takim = durum.takimlar[durum.siradakiTakim];
        let sure = takimSuresi(ayarlar.sure, takim?.handikap ?? false);
        if (cesit === 'hizli') sure = Math.max(15, Math.round(sure / 2));

        ayarla({
          turSayaclari: BOS_TUR,
          sayac: baslat(sayacKur(sure)),
          kilitli: false,
          seriBittiSoruluyor: false,
          cikisSoruluyor: false,
          geriAlinacak: null,
          aktifTurCesidi: cesit,
          isinmaAktif: isinma,
          sonOlay: null,
        });
        kartiIlerlet(ayarla, oku);
      },

      // ---- Tur icindeki aksiyonlar ----

      aksiyonIsle: (tur) => {
        const durum = oku();
        if (durum.kilitli || !durum.deste || durum.seriBittiSoruluyor) return;
        if (durum.cikisSoruluyor) return;

        if (tur === 'pas') {
          const izin = pasBasilabilirMi(
            durum.sayac,
            durum.turSayaclari.pas,
            durum.ayarlar.pasHakki,
          );
          if (!izin) return;
        }

        const sayaclar =
          tur === 'dogru' ? dogruEkle(durum.turSayaclari)
          : tur === 'yanlis' ? yanlisEkle(durum.turSayaclari)
          : pasEkle(durum.turSayaclari);

        // Isinma turunda puan islenmez - deneme turudur
        const puan = durum.isinmaAktif
          ? 0
          : durum.aktifKartAltin
            ? altinPuani(tur)
            : aksiyonPuani(tur);
        const takimlar = durum.takimlar.map((t, i) =>
          i === durum.siradakiTakim ? { ...t, puan: t.puan + puan } : t,
        );

        // Pas gecilen kart seri sonunda bir kez daha gelecek
        const deste = tur === 'pas' ? pasKaydet(durum.deste) : durum.deste;

        // Yanlis basma duzeltilebilsin diye onceki durum saklanir
        const geriAlinacak: GeriAdim = {
          deste: durum.deste,
          aktifKart: durum.aktifKart,
          turSayaclari: durum.turSayaclari,
          takimPuani: durum.takimlar[durum.siradakiTakim]?.puan ?? 0,
          takimSira: durum.siradakiTakim,
        };

        ayarla({ turSayaclari: sayaclar, takimlar, deste, geriAlinacak });

        // Son kart modunda tek aksiyon hakki var, tur biter
        if (durum.sayac.sonKartModuAktif) {
          oku().turuBitir();
          return;
        }

        // Cift dokunma korumasi
        ayarla({ kilitli: true });
        setTimeout(() => ayarla({ kilitli: false }), 250);
        kartiIlerlet(ayarla, oku);
      },

      saniyeIlerlet: () => {
        const durum = oku();
        // Cikis onayi acikken de saniye islemez - oyuncu karar veriyor
        if (durum.seriBittiSoruluyor || durum.cikisSoruluyor) return;

        const { durum: yeniSayac, olay } = saniyeGec(durum.sayac, durum.ayarlar);
        ayarla({ sayac: yeniSayac });

        if (olay === 'anaSureBitti' || olay === 'turBitti') {
          oku().turuBitir();
          return;
        }
        if (olay === 'sonKartBasladi') {
          ayarla({ sonOlay: { tur: 'sonKartBasladi' } });
          return;
        }
        if (!olay && yeniSayac.kalanSaniye <= 10 && !yeniSayac.sonKartModuAktif) {
          ayarla({ sonOlay: { tur: 'sonSaniyeler' } });
        }
      },

      /**
       * Son aksiyonu geri alir.
       *
       * Heyecanla yanlis dugmeye basmak bu oyunun en sik sikayeti.
       * Puan, sayaclar, deste imleci ve pas listesi birlikte geri sarilir -
       * ucu ayri ayri duzeltilirse deste tutarsiz kalirdi.
       *
       * Tek adim tutulur. Amac hatayi duzeltmek, gecmisi gezmek degil.
       */
      geriAl: () => {
        const durum = oku();
        const adim = durum.geriAlinacak;
        if (!adim || durum.seriBittiSoruluyor || durum.cikisSoruluyor) return;

        ayarla({
          deste: adim.deste,
          aktifKart: adim.aktifKart,
          turSayaclari: adim.turSayaclari,
          takimlar: durum.takimlar.map((t, i) =>
            i === adim.takimSira ? { ...t, puan: adim.takimPuani } : t,
          ),
          geriAlinacak: null,
          kilitli: false,
          sonOlay: { tur: 'kartDegisti' },
        });
      },

      // ---- Kendi kelimeleri ----

      kendiKartEkle: (kart) =>
        ayarla((d) => ({ kendiKartlar: [...d.kendiKartlar, kart] })),

      kendiKartSil: (sira) =>
        ayarla((d) => ({ kendiKartlar: d.kendiKartlar.filter((_, i) => i !== sira) })),

      /**
       * Bozuk kart bildirimi. Kart listeye eklenir, kullanici daha sonra
       * ayarlardan gorup CSV'de duzeltebilir. Ayni kart iki kez eklenmez.
       */
      kartBildir: (kart) =>
        ayarla((d) => {
          if (d.bildirilenler.some((b) => b[0] === kart.kelime)) return {};
          const ham: HamKart = [
            kart.kelime,
            kart.yasaklilar[0] ?? '',
            kart.yasaklilar[1] ?? '',
            kart.yasaklilar[2] ?? '',
            kart.yasaklilar[3] ?? '',
            kart.yasaklilar[4] ?? '',
            kart.zorluk,
          ];
          return { bildirilenler: [...d.bildirilenler, ham] };
        }),

      bildirimSil: (sira) =>
        ayarla((d) => ({ bildirilenler: d.bildirilenler.filter((_, i) => i !== sira) })),

      turuBitir: () => {
        const durum = oku();

        // Isinma turu sayilmaz: puan yok, istatistik yok, sira ilerlemez.
        // Ayni takim hemen ardindan gercek turunu oynar.
        if (durum.isinmaAktif) {
          ayarla({
            sayac: duraklat(durum.sayac),
            isinmaAktif: false,
            oynananTur: durum.oynananTur + 1,
            geriAlinacak: null,
            sonOlay: { tur: 'turBitti' },
          });
          return;
        }

        const tur = durum.turSayaclari;
        const puan = turPuani(tur);
        ayarla({
          oynananTur: durum.oynananTur + 1,
          sayac: duraklat(durum.sayac),
          takimlar: durum.takimlar.map((t, i) =>
            i === durum.siradakiTakim
              ? {
                  ...t,
                  anlatanSira: t.anlatanSira + 1,
                  // Birikimli sayaclar kazanan ekraninda gosteriliyor
                  toplam: {
                    dogru: t.toplam.dogru + tur.dogru,
                    yanlis: t.toplam.yanlis + tur.yanlis,
                    pas: t.toplam.pas + tur.pas,
                  },
                  enIyiTur: Math.max(t.enIyiTur, puan),
                }
              : t,
          ),
          geriAlinacak: null,
          sonOlay: { tur: 'turBitti' },
        });
      },

      /**
       * Cikis onayini acar.
       *
       * Sure ayrica duraklatilmaz - saniyeIlerlet bu bayragi gorunce
       * zaten islemez. calisiyorMu'yu burada da yazsaydik ayni bayragin
       * iki sahibi olurdu ve hangisi son devam ettirirse o kazanirdi.
       * Sure biten bir turda pencere acilmaz.
       */
      cikisiSor: () => {
        const durum = oku();
        if (durum.seriBittiSoruluyor || !durum.sayac.calisiyorMu) return;
        ayarla({ cikisSoruluyor: true });
      },

      cikisiKapat: () => ayarla({ cikisSoruluyor: false }),

      /**
       * Biten oyunu gecmise yazar. Son bes oyun saklanir.
       *
       * Amac hatira: sonuc tablosu yanlislikla gecilirse kaybolmasin,
       * istenirse sonradan acilip fotograflansin. Uzun donem istatistik
       * tutmuyoruz - depolamayi sismeye birakmadan isi goruyor.
       */
      oyunuKaydet: () => {
        const durum = oku();
        if (!durum.deste) return;
        const kayit: OyunKaydi = {
          zaman: Date.now(),
          kategori: durum.deste.kategoriKimlik,
          takimlar: durum.takimlar.map((t) => ({
            ad: t.ad,
            renk: t.renk,
            puan: t.puan,
            toplam: t.toplam,
            enIyiTur: t.enIyiTur,
          })),
        };
        ayarla({
          gecmisOyunlar: [kayit, ...durum.gecmisOyunlar].slice(0, GECMIS_SINIRI),
        });
      },

      siradakiTakimaGec: () =>
        ayarla((d) => ({
          siradakiTakim: (d.siradakiTakim + 1) % d.takimlar.length,
          sonOlay: null,
        })),

      // ---- Seri bitisi ----

      yenidenKar: () => {
        const durum = oku();
        if (!durum.deste) return;
        const deste = desteyiYukle(durum.deste.kategoriKimlik, durum.kendiKartlar);
        ayarla({
          deste: yenidenKaristir(
            durum.deste,
            zorlukIndeksleri(deste, durum.ayarlar.zorlukModu),
            Math.random,
            durum.ayarlar.altinKart ? altinAdaylari(deste) : [],
          ),
          seriBittiSoruluyor: false,
          sayac: devamEt(durum.sayac),
        });
        kartiIlerlet(ayarla, oku);
      },

      seriBittiKapat: () => ayarla({ seriBittiSoruluyor: false }),

      olayTemizle: () => ayarla({ sonOlay: null }),

      oyunuSifirla: () =>
        ayarla((d) => ({
          takimlar: d.takimlar.map((t) => ({
            ...t, puan: 0, anlatanSira: 0, toplam: BOS_TUR, enIyiTur: 0,
          })),
          siradakiTakim: 0,
          deste: null,
          aktifKart: null,
          turSayaclari: BOS_TUR,
          sonOlay: null,
          seriBittiSoruluyor: false,
          cikisSoruluyor: false,
          geriAlinacak: null,
          aktifTurCesidi: null,
          isinmaAktif: false,
          oynananTur: 0,
          aktifKartAltin: false,
        })),

      yeniOyun: () => {
        oku().oyunuSifirla();
      },
    }),
    {
      name: 'nafutabu-oyun',
      storage: createJSONStorage(() => AsyncStorage),
      /**
       * Surum 1: takimlara birikimli sayaclar, ayarlara zorluk ve sol el.
       * Surum 2: takimlara handikap, ayarlara ozel tur / isinma / altin
       * kart, destelere altin indeksleri, gecmis oyun listesi.
       *
       * Diskteki eski kayitta bu alanlar yok. Dokunulmazsa kazanan ekrani
       * t.toplam.dogru okurken, tur ekrani deste.altinlar okurken cokerdi.
       */
      version: 2,
      migrate: (kayit) => {
        const eski = kayit as Partial<OyunDurumu> | undefined;
        if (!eski) return {} as OyunDurumu;
        return {
          ...eski,
          ayarlar: { ...VARSAYILAN_AYARLAR, ...(eski.ayarlar ?? {}) },
          takimlar: (eski.takimlar ?? []).map((t) => ({
            ...t,
            toplam: t.toplam ?? BOS_TUR,
            enIyiTur: t.enIyiTur ?? 0,
            handikap: t.handikap ?? false,
          })),
          deste: eski.deste ? { ...eski.deste, altinlar: eski.deste.altinlar ?? [] } : null,
          gecmisOyunlar: eski.gecmisOyunlar ?? [],
          oynananTur: eski.oynananTur ?? 0,
        } as OyunDurumu;
      },
      // Zamanlayici ve gecici durumlar kaydedilmez
      partialize: (d) => ({
        ayarlar: d.ayarlar,
        takimlar: d.takimlar,
        siradakiTakim: d.siradakiTakim,
        deste: d.deste,
        kendiKartlar: d.kendiKartlar,
        bildirilenler: d.bildirilenler,
        gecmisOyunlar: d.gecmisOyunlar,
        oynananTur: d.oynananTur,
      }),
    },
  ),
);

/**
 * Siradaki karti gosterir. Uc sonuc olabilir:
 * kart geldi, pas turu basladi, seri bitti.
 *
 * Pas turu basladiginda kart otomatik cekilir - kullaniciya soru
 * sorulmaz, sadece bildirim gosterilir.
 */
function kartiIlerlet(
  ayarla: (parca: Partial<OyunDurumu>) => void,
  oku: () => OyunDurumu,
) {
  const durum = oku();
  if (!durum.deste) return;

  const kartlar = desteyiYukle(durum.deste.kategoriKimlik, durum.kendiKartlar);
  const sonuc = kartCek(durum.deste);

  if (sonuc.tur === 'seriBitti') {
    ayarla({
      deste: sonuc.durum,
      sayac: duraklat(durum.sayac),
      seriBittiSoruluyor: true,
      sonOlay: { tur: 'seriBitti' },
    });
    return;
  }

  if (sonuc.tur === 'pasTuruBasladi') {
    const ikinci = kartCek(sonuc.durum);
    if (ikinci.tur !== 'kart') {
      ayarla({
        deste: ikinci.durum,
        sayac: duraklat(durum.sayac),
        seriBittiSoruluyor: true,
        sonOlay: { tur: 'seriBitti' },
      });
      return;
    }
    ayarla({
      deste: ikinci.durum,
      aktifKart: kartiGetir(kartlar, ikinci.indeks),
      sonOlay: { tur: 'pasTuruBasladi', kartSayisi: sonuc.kartSayisi },
    });
    return;
  }

  ayarla({
    deste: sonuc.durum,
    aktifKart: kartiGetir(kartlar, sonuc.indeks),
    aktifKartAltin: altinMi(sonuc.durum, sonuc.indeks),
    sonOlay: { tur: 'kartDegisti' },
  });
}

/** Oyun bitti mi - ekranlarin sordugu tek soru. */
export function oyunBittiMiSec(durum: OyunDurumu): boolean {
  return oyunBittiMi(durum.takimlar, durum.ayarlar);
}

/** Sirasi gelen takim. */
export function aktifTakimSec(durum: OyunDurumu): Takim | undefined {
  return durum.takimlar[durum.siradakiTakim];
}

/** Anlatacak kisinin adi. Oyuncu isimleri kapaliysa takim adi doner. */
export function anlatanAdiSec(durum: OyunDurumu): string {
  const takim = aktifTakimSec(durum);
  if (!takim) return '';
  if (!durum.ayarlar.isimlerAcik) return takim.ad;
  const oyuncu = takim.oyuncular[takim.anlatanSira % takim.oyuncular.length];
  return oyuncu?.trim() || takim.ad;
}

/**
 * Yarim kalmis bir oyun var mi.
 *
 * Deste diske yaziliyor, yani uygulama kapansa bile seri duruyor.
 * Ana ekran buna bakip "Devam Et" gosterir - veri zaten vardi ama
 * kullaniciya acilan bir kapi yoktu.
 */
export function yarimOyunVarMiSec(durum: OyunDurumu): boolean {
  return durum.deste !== null && !oyunBittiMi(durum.takimlar, durum.ayarlar);
}

/** Geri alinacak bir aksiyon var mi. */
export function geriAlinabilirMiSec(durum: OyunDurumu): boolean {
  return (
    durum.geriAlinacak !== null &&
    !durum.seriBittiSoruluyor &&
    !durum.cikisSoruluyor &&
    durum.sayac.calisiyorMu
  );
}

/** Takimin oyuncu listesinde siradaki anlaticinin sirasi (1 tabanli). */
export function anlaticiSirasiSec(durum: OyunDurumu): { sira: number; toplam: number } {
  const takim = aktifTakimSec(durum);
  if (!takim || takim.oyuncular.length === 0) return { sira: 0, toplam: 0 };
  return {
    sira: (takim.anlatanSira % takim.oyuncular.length) + 1,
    toplam: takim.oyuncular.length,
  };
}

/**
 * Bu tur ozel bir cesit gelecek mi.
 *
 * Puanlama degismez - yalnizca anlatma bicimi degisir. Cesit sirayla
 * dolasir, boylece hep ayni cesit gelmez ve oyuncular dordunu de gorur.
 */
export function turCesidiSec(ayarlar: Ayarlar, oynananTur: number): TurCesidi | null {
  if (ayarlar.turCesidiSikligi === 'kapali') return null;
  const arayis = ayarlar.turCesidiSikligi === 'her3' ? 3 : 5;
  const sira = oynananTur + 1;
  if (sira % arayis !== 0) return null;
  const dizin = Math.floor(sira / arayis - 1) % TUR_CESITLERI.length;
  return TUR_CESITLERI[dizin] ?? null;
}

/** Son duzlukte miyiz - biri hedefe ulasti ama herkes esit tur oynamadi. */
export function sonDuzlukteMiSec(durum: OyunDurumu): boolean {
  return sonDuzluktenMi(durum.takimlar, durum.ayarlar);
}
