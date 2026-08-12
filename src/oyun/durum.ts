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
  desteKur,
  kartCek,
  kartiGetir,
  pasKaydet,
  yenidenKaristir,
  type DesteDurumu,
} from './deste';
import { desteyiYukle } from './kategoriler';
import {
  BOS_TUR,
  aksiyonPuani,
  dogruEkle,
  oyunBittiMi,
  pasEkle,
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
  type Kart,
  type Takim,
  type TurSayaclari,
} from './tipler';

/** Tur ekraninin cevap vermesi gereken olaylar. */
export type OyunOlayi =
  | { tur: 'kartDegisti' }
  | { tur: 'pasTuruBasladi'; kartSayisi: number }
  | { tur: 'seriBitti' }
  | { tur: 'sonKartBasladi' }
  | { tur: 'turBitti' }
  | { tur: 'sonSaniyeler' };

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
  turuDuraklat: () => void;
  turaDevamEt: () => void;
  siradakiTakimaGec: () => void;

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
        const deste = desteyiYukle(kimlik);
        ayarla({
          deste: desteKur(kimlik, deste.length),
          aktifKart: null,
          seriBittiSoruluyor: false,
          sonOlay: null,
        });
      },

      turBaslat: () => {
        const { ayarlar } = oku();
        ayarla({
          turSayaclari: BOS_TUR,
          sayac: baslat(sayacKur(ayarlar.sure)),
          kilitli: false,
          seriBittiSoruluyor: false,
          sonOlay: null,
        });
        kartiIlerlet(ayarla, oku);
      },

      // ---- Tur icindeki aksiyonlar ----

      aksiyonIsle: (tur) => {
        const durum = oku();
        if (durum.kilitli || !durum.deste || durum.seriBittiSoruluyor) return;

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

        const puan = aksiyonPuani(tur);
        const takimlar = durum.takimlar.map((t, i) =>
          i === durum.siradakiTakim ? { ...t, puan: t.puan + puan } : t,
        );

        // Pas gecilen kart seri sonunda bir kez daha gelecek
        const deste = tur === 'pas' ? pasKaydet(durum.deste) : durum.deste;

        ayarla({ turSayaclari: sayaclar, takimlar, deste });

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
        if (durum.seriBittiSoruluyor) return;

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

      turuBitir: () => {
        const durum = oku();
        ayarla({
          sayac: duraklat(durum.sayac),
          takimlar: durum.takimlar.map((t, i) =>
            i === durum.siradakiTakim ? { ...t, anlatanSira: t.anlatanSira + 1 } : t,
          ),
          sonOlay: { tur: 'turBitti' },
        });
      },

      /**
       * Sureyi dondurur. Cikis onayi sorulurken kullanilir -
       * oyuncu karar verirken saniye islemesin.
       */
      turuDuraklat: () => ayarla({ sayac: duraklat(oku().sayac) }),

      /** Duraklatilmis sureyi kaldigi saniyeden surdurur. */
      turaDevamEt: () => ayarla({ sayac: devamEt(oku().sayac) }),

      siradakiTakimaGec: () =>
        ayarla((d) => ({
          siradakiTakim: (d.siradakiTakim + 1) % d.takimlar.length,
          sonOlay: null,
        })),

      // ---- Seri bitisi ----

      yenidenKar: () => {
        const durum = oku();
        if (!durum.deste) return;
        const deste = desteyiYukle(durum.deste.kategoriKimlik);
        ayarla({
          deste: yenidenKaristir(durum.deste, deste.length),
          seriBittiSoruluyor: false,
          sayac: devamEt(durum.sayac),
        });
        kartiIlerlet(ayarla, oku);
      },

      seriBittiKapat: () => ayarla({ seriBittiSoruluyor: false }),

      olayTemizle: () => ayarla({ sonOlay: null }),

      oyunuSifirla: () =>
        ayarla((d) => ({
          takimlar: d.takimlar.map((t) => ({ ...t, puan: 0, anlatanSira: 0 })),
          siradakiTakim: 0,
          deste: null,
          aktifKart: null,
          turSayaclari: BOS_TUR,
          sonOlay: null,
          seriBittiSoruluyor: false,
        })),

      yeniOyun: () => {
        oku().oyunuSifirla();
      },
    }),
    {
      name: 'nafutabu-oyun',
      storage: createJSONStorage(() => AsyncStorage),
      // Zamanlayici ve gecici durumlar kaydedilmez
      partialize: (d) => ({
        ayarlar: d.ayarlar,
        takimlar: d.takimlar,
        siradakiTakim: d.siradakiTakim,
        deste: d.deste,
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

  const kartlar = desteyiYukle(durum.deste.kategoriKimlik);
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
