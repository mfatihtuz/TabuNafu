/**
 * Sira ekrani ve geri sayim.
 *
 * Aciklama metninde takim adi tekrar edilmez - ustte zaten yaziyor.
 */

import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { BagButonu, Buton, CikisButonu } from '../../src/arayuz/Buton';
import { CikisOnayi } from '../../src/arayuz/CikisOnayi';
import { Yazi } from '../../src/arayuz/Yazi';
import { Zemin } from '../../src/arayuz/Zemin';
import {
  anlaticiSirasiSec,
  anlatanAdiSec,
  aktifTakimSec,
  oyunDeposu,
  sonDuzlukteMiSec,
  turCesidiSec,
} from '../../src/oyun/durum';
import { Ikon } from '../../src/cizimler/Ikon';
import { TUR_CESIDI_BILGI, takimSuresi } from '../../src/oyun/tipler';
import { sesCal } from '../../src/oyun/sesler';
import { BOSLUK, YARICAP } from '../../src/tema/golgeler';
import { RENK } from '../../src/tema/renkler';
import { BOYUT } from '../../src/tema/yazitipi';

export default function SiraEkrani() {
  const yonlendir = useRouter();
  const kenar = useSafeAreaInsets();

  const takim = oyunDeposu(aktifTakimSec);
  const anlatan = oyunDeposu(anlatanAdiSec);
  const isimlerAcik = oyunDeposu((d) => d.ayarlar.isimlerAcik);
  const sesAcik = oyunDeposu((d) => d.ayarlar.sesAcik);
  const titresimAcik = oyunDeposu((d) => d.ayarlar.titresimAcik);
  const turBaslat = oyunDeposu((d) => d.turBaslat);
  const anlaticiSira = oyunDeposu(anlaticiSirasiSec);
  const sonDuzluk = oyunDeposu(sonDuzlukteMiSec);
  const ayarlar = oyunDeposu((d) => d.ayarlar);
  const oynananTur = oyunDeposu((d) => d.oynananTur);

  // Isinma turunda ozel cesit gelmez - once kural ogrenilsin
  const isinma = ayarlar.isinmaTuru && oynananTur === 0;
  const cesit = isinma ? null : turCesidiSec(ayarlar, oynananTur);
  const cesitBilgi = cesit ? TUR_CESIDI_BILGI[cesit] : null;
  const sure = takimSuresi(ayarlar.sure, takim?.handikap ?? false);

  const [geriSayim, setGeriSayim] = useState<number | null>(null);
  const [cikisSoruluyor, setCikisSoruluyor] = useState(false);
  const zamanlayici = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (zamanlayici.current) clearInterval(zamanlayici.current);
  }, []);

  function basla() {
    setGeriSayim(3);
    sesCal('gerisayim', sesAcik);

    zamanlayici.current = setInterval(() => {
      setGeriSayim((onceki) => {
        const kalan = (onceki ?? 1) - 1;
        if (kalan <= 0) {
          if (zamanlayici.current) clearInterval(zamanlayici.current);
          sesCal('basla', sesAcik);
          turBaslat();
          yonlendir.replace('/oyun/tur');
          return null;
        }
        sesCal('gerisayim', sesAcik);
        return kalan;
      });
    }, 800);
  }

  if (geriSayim !== null) {
    return (
      <Zemin>
        <View style={durum.orta}>
          <Animated.View key={geriSayim} entering={ZoomIn.duration(320)}>
            <Yazi tur="baslik" boyut={130} renk={RENK.pirinc}>
              {geriSayim}
            </Yazi>
          </Animated.View>
        </View>
      </Zemin>
    );
  }

  return (
    <Zemin>
      <View style={[durum.kok, { paddingTop: kenar.top + 24, paddingBottom: kenar.bottom + 24 }]}>
        {/*
          Tur baslamadan once iki ayri yol. Cikis her oyun ekraninda ayni
          yerde - sol ust kosede - ki kas hafizasi bozulmasin.
          Kategori degistirmek puanlari silmez, oyundan cikmak siler.
        */}
        <View style={durum.ustSatir}>
          <CikisButonu onPress={() => setCikisSoruluyor(true)} />
          <BagButonu
            metin="Kategori Değiştir"
            ikon="shuffle"
            onPress={() => {
              // Kategori ekrani zaten yiginda - dismissTo ona doner,
              // replace ise ikinci bir kopya birakirdi
              if (yonlendir.canDismiss()) yonlendir.dismissTo('/kurulum/kategori');
              else yonlendir.replace('/kurulum/kategori');
            }}
          />
        </View>

        <Animated.View entering={FadeIn.duration(300)} style={durum.orta}>
          <View style={[durum.rozet, { backgroundColor: (takim?.renk ?? RENK.pirinc) + '2E' }]}>
            <Yazi tur="cokKalin" boyut={BOYUT.kucuk} harfAraligi={1.8}
                  renk={takim?.renk ?? RENK.pirinc}>
              {isimlerAcik ? 'SIRA SENDE' : 'SIRA BU TAKIMDA'}
            </Yazi>
          </View>

          <Yazi tur="baslik" boyut={BOYUT.devasa} ortala>{anlatan}</Yazi>

          {isimlerAcik && anlaticiSira.toplam > 1 ? (
            <Yazi tur="cokKalin" boyut={BOYUT.kucuk} renk={RENK.sis} harfAraligi={1.4}>
              {`TAKIMDA ${anlaticiSira.sira} / ${anlaticiSira.toplam}`}
            </Yazi>
          ) : null}

          {isinma ? (
            <View style={[durum.bant, durum.bantIsinma]}>
              <Yazi tur="cokKalin" boyut={BOYUT.kucuk} renk={RENK.sis} harfAraligi={1.4}>
                ISINMA TURU · PUAN SAYILMAZ
              </Yazi>
            </View>
          ) : null}

          {cesitBilgi ? (
            <View style={[durum.bant, durum.bantCesit]}>
              <Ikon ad={cesitBilgi.ikon} boyut={16} renk={RENK.pirinc} cizgiKalinligi={2.4} />
              <Yazi tur="cokKalin" boyut={BOYUT.notr} renk={RENK.pirinc}>
                {cesitBilgi.ad}
              </Yazi>
            </View>
          ) : null}

          <Yazi boyut={BOYUT.notr} renk={RENK.sis} ortala style={durum.aciklama}>
            {cesitBilgi
              ? cesitBilgi.aciklama
              : 'Telefonu sen tut, rakipten biri omzundan baksın.'}
          </Yazi>

          {takim?.handikap ? (
            <Yazi tur="cokKalin" boyut={BOYUT.kucuk} renk={RENK.dogru}>
              {`EK SÜRE · ${sure} SANİYE`}
            </Yazi>
          ) : null}

          {sonDuzluk ? (
            <View style={[durum.bant, durum.bantDuzluk]}>
              <Yazi tur="cokKalin" boyut={BOYUT.kucuk} renk={RENK.yanlis} harfAraligi={1.4}>
                SON DÜZLÜK · HERKES EŞİT TUR OYNAYACAK
              </Yazi>
            </View>
          ) : null}
        </Animated.View>

        <Buton metin="Başla" ikon="play" titresimAcik={titresimAcik} onPress={basla} />
      </View>

      <CikisOnayi acik={cikisSoruluyor} onVazgec={() => setCikisSoruluyor(false)} />
    </Zemin>
  );
}

const durum = StyleSheet.create({
  kok: { flex: 1, paddingHorizontal: 22 },
  ustSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orta: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: BOSLUK.orta },
  rozet: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: YARICAP.tam,
  },
  aciklama: { maxWidth: 280 },
  bant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: YARICAP.tam,
    borderWidth: 1.5,
  },
  bantIsinma: { borderColor: RENK.cizgi, backgroundColor: RENK.yuzey },
  bantCesit: { borderColor: RENK.pirinc, backgroundColor: 'rgba(212,160,80,0.14)' },
  bantDuzluk: { borderColor: RENK.yanlis, backgroundColor: 'rgba(224,30,55,0.14)' },
});
