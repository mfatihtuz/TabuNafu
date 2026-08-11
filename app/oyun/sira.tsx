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

import { Buton } from '../../src/arayuz/Buton';
import { Yazi } from '../../src/arayuz/Yazi';
import { Zemin } from '../../src/arayuz/Zemin';
import { anlatanAdiSec, aktifTakimSec, oyunDeposu } from '../../src/oyun/durum';
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

  const [geriSayim, setGeriSayim] = useState<number | null>(null);
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
        <Animated.View entering={FadeIn.duration(300)} style={durum.orta}>
          <View style={[durum.rozet, { backgroundColor: (takim?.renk ?? RENK.pirinc) + '2E' }]}>
            <Yazi tur="cokKalin" boyut={BOYUT.kucuk} harfAraligi={1.8}
                  renk={takim?.renk ?? RENK.pirinc}>
              {isimlerAcik ? 'SIRA SENDE' : 'SIRA BU TAKIMDA'}
            </Yazi>
          </View>

          <Yazi tur="baslik" boyut={BOYUT.devasa} ortala>{anlatan}</Yazi>

          <Yazi boyut={BOYUT.notr} renk={RENK.sis} ortala style={durum.aciklama}>
            Telefonu sen tut, rakipten biri omzundan baksın.
          </Yazi>
        </Animated.View>

        <Buton metin="Başla" ikon="play" titresimAcik={titresimAcik} onPress={basla} />
      </View>
    </Zemin>
  );
}

const durum = StyleSheet.create({
  kok: { flex: 1, paddingHorizontal: 22 },
  orta: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: BOSLUK.orta },
  rozet: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: YARICAP.tam,
  },
  aciklama: { maxWidth: 260 },
});
