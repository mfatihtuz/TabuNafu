/**
 * Tur ekrani - oyunun kalbi.
 *
 * Anlatan telefonu tutar, rakipten biri omzunun ustunden bakar.
 * Yerlesim buna gore: ana kelime cok buyuk, yasakli kelimeler kalin
 * ve iyi arali, hicbir yerde soluk gri yok.
 *
 * Ekran tur boyunca uyanik tutulur - anlatirken sonmesin.
 */

import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { AksiyonButonu } from '../../src/arayuz/AksiyonButonu';
import { BagButonu, CikisButonu } from '../../src/arayuz/Buton';
import { CikisOnayi } from '../../src/arayuz/CikisOnayi';
import { Kart3D } from '../../src/arayuz/Kart3D';
import { Modal3D } from '../../src/arayuz/Modal3D';
import { SureHalkasi } from '../../src/arayuz/SureHalkasi';
import { Yazi } from '../../src/arayuz/Yazi';
import { Zemin } from '../../src/arayuz/Zemin';
import { anlatanAdiSec, geriAlinabilirMiSec, oyunDeposu } from '../../src/oyun/durum';
import { kategoriBul } from '../../src/oyun/kategoriler';
import { kalanKart } from '../../src/oyun/deste';
import { sesCal } from '../../src/oyun/sesler';
import { acilDurumMu, halkaOrani, pasBasilabilirMi } from '../../src/oyun/sayac';
import { BOSLUK, YARICAP } from '../../src/tema/golgeler';
import { RENK } from '../../src/tema/renkler';
import { BOYUT } from '../../src/tema/yazitipi';
import { trUpper } from '../../src/yardimci/turkce';

export default function TurEkrani() {
  useKeepAwake();
  const yonlendir = useRouter();
  const kenar = useSafeAreaInsets();

  const ayarlar = oyunDeposu((d) => d.ayarlar);
  const sayac = oyunDeposu((d) => d.sayac);
  const kart = oyunDeposu((d) => d.aktifKart);
  const sayaclar = oyunDeposu((d) => d.turSayaclari);
  const deste = oyunDeposu((d) => d.deste);
  const kilitli = oyunDeposu((d) => d.kilitli);
  const seriBittiSoruluyor = oyunDeposu((d) => d.seriBittiSoruluyor);
  const sonOlay = oyunDeposu((d) => d.sonOlay);
  const anlatan = oyunDeposu(anlatanAdiSec);

  const aksiyonIsle = oyunDeposu((d) => d.aksiyonIsle);
  const saniyeIlerlet = oyunDeposu((d) => d.saniyeIlerlet);
  const yenidenKar = oyunDeposu((d) => d.yenidenKar);
  const turuBitir = oyunDeposu((d) => d.turuBitir);
  const olayTemizle = oyunDeposu((d) => d.olayTemizle);
  const cikisSoruluyor = oyunDeposu((d) => d.cikisSoruluyor);
  const cikisiSor = oyunDeposu((d) => d.cikisiSor);
  const cikisiKapat = oyunDeposu((d) => d.cikisiKapat);
  const geriAlinabilir = oyunDeposu(geriAlinabilirMiSec);
  const geriAl = oyunDeposu((d) => d.geriAl);
  const kartBildir = oyunDeposu((d) => d.kartBildir);

  /**
   * Bunlar ref degil state olmali. Ref degisimi yeniden cizim
   * tetiklemedigi icin kart animasyonu ve bildirim guvenilmez
   * calisiyordu - deger ancak bir sonraki cizimde okunuyordu.
   */
  const [kartSayaci, setKartSayaci] = useState(0);
  const [bildirim, setBildirim] = useState<string | null>(null);

  // Bildirim birkac saniye sonra kaybolur
  useEffect(() => {
    if (!bildirim) return;
    const z = setTimeout(() => setBildirim(null), 2800);
    return () => clearTimeout(z);
  }, [bildirim]);

  // Saniye zamanlayicisi
  useEffect(() => {
    const z = setInterval(() => saniyeIlerlet(), 1000);
    return () => clearInterval(z);
  }, [saniyeIlerlet]);

  // Olaylara gore ses cal ve yonlendir
  useEffect(() => {
    if (!sonOlay) return;

    switch (sonOlay.tur) {
      case 'kartDegisti':
        setKartSayaci((n) => n + 1);
        break;
      case 'pasTuruBasladi':
        setKartSayaci((n) => n + 1);
        setBildirim(`Pas geçilen ${sonOlay.kartSayisi} kelime tekrar geliyor`);
        sesCal('pas', ayarlar.sesAcik);
        break;
      case 'sonKartBasladi':
        sesCal('korna', ayarlar.sesAcik);
        setTimeout(() => sesCal('sonkart', ayarlar.sesAcik), 340);
        break;
      case 'sonSaniyeler':
        sesCal('tik', ayarlar.sesAcik);
        break;
      case 'turBitti':
        sesCal('korna', ayarlar.sesAcik);
        yonlendir.replace('/oyun/ozet');
        break;
      case 'seriBitti':
        break;
    }
    olayTemizle();
  }, [sonOlay, ayarlar.sesAcik, olayTemizle, yonlendir]);

  const kategori = kategoriBul(deste?.kategoriKimlik ?? '');
  const acil = acilDurumMu(sayac);
  const pasAcik = pasBasilabilirMi(sayac, sayaclar.pas, ayarlar.pasHakki);

  function bas(tur: 'dogru' | 'yanlis' | 'pas') {
    if (tur === 'pas' && !pasAcik) return;
    sesCal(tur, ayarlar.sesAcik);
    aksiyonIsle(tur);
  }


  return (
    <Zemin>
      <View style={[durum.kok, { paddingTop: kenar.top + 16, paddingBottom: kenar.bottom + 16 }]}>
        <View style={durum.ustSatir}>
          <CikisButonu onPress={cikisiSor} />
          <View style={durum.baslikAlani}>
            <Yazi tur="cokKalin" boyut={BOYUT.notr} harfAraligi={0.5} numberOfLines={1}>
              {trUpper(kategori.ad)}
            </Yazi>
            <Yazi tur="kalin" boyut={BOYUT.kucuk} renk={RENK.sis} numberOfLines={1}>
              {`${anlatan}  ·  ${deste ? kalanKart(deste) : 0} kart kaldı`}
            </Yazi>
          </View>
          <SureHalkasi
            kalanSaniye={sayac.kalanSaniye}
            oran={halkaOrani(sayac, ayarlar)}
            acil={acil}
          />
        </View>

        <View style={durum.kartAlani}>
          {kart ? (
            <Kart3D
              kelime={kart.kelime}
              yasaklilar={kart.yasaklilar}
              sonKartMi={sayac.sonKartModuAktif}
              pasTuruMu={deste?.pasTuruAktif ?? false}
              cevirmeAnahtari={kartSayaci}
              onUzunBas={() => {
                if (!kart) return;
                kartBildir(kart);
                setBildirim('Kart bildirildi, ayarlardan görebilirsin');
                if (ayarlar.titresimAcik) void Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              }}
            />
          ) : null}
        </View>

        {bildirim ? (
          <Animated.View
            entering={FadeInDown.duration(280)}
            exiting={FadeOut.duration(200)}
            style={durum.bildirim}
          >
            <Yazi tur="cokKalin" boyut={BOYUT.kucuk + 0.5} renk={RENK.sariUstu}>
              {bildirim}
            </Yazi>
          </Animated.View>
        ) : null}

        {/*
          Geri al satiri sabit yukseklikte - dugme gelip gidince
          kartin ve aksiyon butonlarinin yeri oynamasin.
        */}
        <View style={durum.geriAlSatiri}>
          {geriAlinabilir ? (
            <BagButonu metin="Son basışı geri al" ikon="chevron-left" onPress={geriAl} />
          ) : null}
        </View>

        <View style={[durum.aksiyonlar, ayarlar.solElModu && durum.aksiyonlarTers]}>
          <AksiyonButonu
            tip="yanlis"
            sayac={String(sayaclar.yanlis)}
            titresimAcik={ayarlar.titresimAcik}
            onPress={() => bas('yanlis')}
          />
          <AksiyonButonu
            tip="pas"
            sayac={`${sayaclar.pas}/${ayarlar.pasHakki}`}
            kilitli={!pasAcik}
            titresimAcik={ayarlar.titresimAcik}
            onPress={() => bas('pas')}
          />
          <AksiyonButonu
            tip="dogru"
            sayac={String(sayaclar.dogru)}
            titresimAcik={ayarlar.titresimAcik}
            onPress={() => bas('dogru')}
          />
        </View>
      </View>

      <CikisOnayi acik={cikisSoruluyor} turYaridaMi onVazgec={cikisiKapat} />

      <Modal3D
        acik={seriBittiSoruluyor}
        ikon="layers"
        ikonRenk={RENK.pas}
        baslik="Kelime grubu bitti"
        metin={`${kategori.ad} kategorisindeki kelimelerin hepsini gördünüz, pas geçilenler de tekrar soruldu. Puanlarınız korunur.`}
        birinci="Yeniden Karıştır"
        ikinci="Kategori Değiştir"
        titresimAcik={ayarlar.titresimAcik}
        onBirinci={yenidenKar}
        onIkinci={() => {
          turuBitir();
          // replace degil dismissTo - yigina ikinci bir kategori ekrani
          // eklemesin, kategori zaten yiginda duruyor
          if (yonlendir.canDismiss()) yonlendir.dismissTo('/kurulum/kategori');
          else yonlendir.replace('/kurulum/kategori');
        }}
      />
    </Zemin>
  );
}

const durum = StyleSheet.create({
  kok: { flex: 1, paddingHorizontal: 22 },
  ustSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: BOSLUK.notr,
    marginBottom: BOSLUK.notr + 2,
  },
  baslikAlani: { flex: 1, gap: 3 },
  kartAlani: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bildirim: {
    position: 'absolute',
    top: 96,
    alignSelf: 'center',
    backgroundColor: RENK.pas,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: YARICAP.tam,
  },
  geriAlSatiri: { height: 44, alignItems: 'center', justifyContent: 'center' },
  aksiyonlar: {
    flexDirection: 'row',
    gap: 11,
    marginTop: BOSLUK.kucuk,
  },
  // Sol elle tutanlar icin DOGRU basparmaga yakin tarafa gecer
  aksiyonlarTers: { flexDirection: 'row-reverse' },
});
