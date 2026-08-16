/**
 * Kazanan ekrani.
 */

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Buton } from '../../src/arayuz/Buton';
import { Yazi } from '../../src/arayuz/Yazi';
import { Zemin } from '../../src/arayuz/Zemin';
import { Ikon } from '../../src/cizimler/Ikon';
import { oyunDeposu } from '../../src/oyun/durum';
import { kazananlar, siraliTakimlar } from '../../src/oyun/puanlama';
import { sesCal } from '../../src/oyun/sesler';
import { BOSLUK, PANEL, YARICAP } from '../../src/tema/golgeler';
import { RENK } from '../../src/tema/renkler';
import { BOYUT } from '../../src/tema/yazitipi';

export default function KazananEkrani() {
  const yonlendir = useRouter();
  const kenar = useSafeAreaInsets();

  const takimlar = oyunDeposu((d) => d.takimlar);
  const sesAcik = oyunDeposu((d) => d.ayarlar.sesAcik);
  const titresimAcik = oyunDeposu((d) => d.ayarlar.titresimAcik);
  const oyunuSifirla = oyunDeposu((d) => d.oyunuSifirla);

  const kazanan = kazananlar(takimlar);
  const beraberlik = kazanan.length > 1;
  const enYuksek = kazanan[0]?.puan ?? 0;

  useEffect(() => {
    sesCal('dogru', sesAcik);
  }, [sesAcik]);

  return (
    <Zemin>
      <View style={[durum.kok, { paddingTop: kenar.top + 24, paddingBottom: kenar.bottom + 24 }]}>
        <View style={durum.orta}>
          <Animated.View entering={ZoomIn.duration(420)} style={durum.kupa}>
            <Ikon ad="trophy" boyut={52} renk={RENK.sariUstu} cizgiKalinligi={2} />
          </Animated.View>

          <Yazi tur="baslik" boyut={BOYUT.devasa} ortala>
            {beraberlik ? 'Berabere' : kazanan[0]?.ad ?? ''}
          </Yazi>

          <Yazi boyut={BOYUT.notr} renk={RENK.sis} ortala>
            {beraberlik
              ? `${enYuksek} puanla eşitlik. Beraberlik turu oynayın.`
              : `${enYuksek} puanla kazandı.`}
          </Yazi>

          <Animated.View entering={FadeInDown.delay(180).duration(360)} style={durum.tablo}>
            {siraliTakimlar(takimlar).map((t, i) => (
              <View key={i} style={[durum.satir, t.puan === enYuksek && durum.lider]}>
                <View style={[durum.nokta, { backgroundColor: t.renk }]} />
                <View style={durum.adAlani}>
                  <Yazi tur="cokKalin" boyut={BOYUT.govde}>{t.ad}</Yazi>
                  {/*
                    Oyun boyunca biriken sayaclar. Skorun yaninda kucuk
                    duruyor - once kim kazandi, sonra nasil oynandi.
                  */}
                  <Yazi boyut={BOYUT.minik} renk={RENK.sis}>
                    {`${t.toplam.dogru} doğru · ${t.toplam.yanlis} yanlış · ${t.toplam.pas} pas · en iyi tur ${t.enIyiTur}`}
                  </Yazi>
                </View>
                <Yazi tur="baslik" boyut={BOYUT.baslik} renk={t.renk}>{t.puan}</Yazi>
              </View>
            ))}
          </Animated.View>
        </View>

        <View style={durum.butonlar}>
          <Buton
            metin="Yeni Oyun"
            ikon="play"
            titresimAcik={titresimAcik}
            onPress={() => {
              oyunuSifirla();
              // Yigini koke sar, sonra kuruluma gir - yoksa terk edilen
              // oyunun kurulum ekranlari yiginda birikiyor
              if (yonlendir.canDismiss()) yonlendir.dismissAll();
              yonlendir.push('/kurulum/takimlar');
            }}
          />
          <Buton
            metin="Ana Ekran"
            ikincil
            titresimAcik={titresimAcik}
            onPress={() => {
              oyunuSifirla();
              if (yonlendir.canDismiss()) yonlendir.dismissAll();
              else yonlendir.replace('/');
            }}
          />
        </View>
      </View>
    </Zemin>
  );
}

const durum = StyleSheet.create({
  kok: { flex: 1, paddingHorizontal: 22 },
  orta: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: BOSLUK.notr },
  kupa: {
    width: 96,
    height: 96,
    borderRadius: YARICAP.buyuk + 4,
    backgroundColor: RENK.pas,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: BOSLUK.kucuk,
  },
  tablo: { width: '100%', gap: BOSLUK.kucuk, marginTop: BOSLUK.kucuk },
  satir: {
    ...PANEL,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  lider: { borderColor: RENK.pirinc, backgroundColor: 'rgba(212,160,80,0.13)' },
  nokta: { width: 26, height: 26, borderRadius: YARICAP.kucuk - 4 },
  adAlani: { flex: 1, gap: 2 },
  butonlar: { gap: BOSLUK.kucuk + 1 },
});
