/**
 * Ana ve ikincil butonlar.
 *
 * Basili-derinlik: butonun altinda sabit bir kalinlik var, basilinca
 * buton asagi iner ve kalinlik kaybolur.
 */

import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Ikon } from '../cizimler/Ikon';
import { BOSLUK, YARICAP } from '../tema/golgeler';
import { RENK } from '../tema/renkler';
import { BOYUT } from '../tema/yazitipi';
import { Yazi } from './Yazi';
import { Yuva } from './Yuva';

type Ozellikler = {
  metin: string;
  ikon?: string;
  ikonSagda?: boolean;
  ikincil?: boolean;
  pasif?: boolean;
  titresimAcik?: boolean;
  onPress: () => void;
  children?: ReactNode;
};

export function Buton({
  metin,
  ikon,
  ikonSagda = false,
  ikincil = false,
  pasif = false,
  titresimAcik = true,
  onPress,
}: Ozellikler) {
  const bastirma = useSharedValue(0);
  const derinlik = ikincil ? 4 : 6;

  /**
   * Yalnizca transform animasyonlanir.
   *
   * Onceden borderBottomWidth animasyonlaniyordu - o bir duzen ozelligi,
   * her karede butonun kutusu yeniden olculuyor ve buton anlik kaybolabiliyor.
   * Simdi govde sabit bir yuvanin ustunde duruyor, basilinca yuvaya iniyor.
   */
  const stil = useAnimatedStyle(() => ({
    transform: [{ translateY: bastirma.value * derinlik }],
  }));

  const metinRenk = ikincil ? RENK.fildisi : RENK.yesilUstu;

  return (
    <Pressable
      onPressIn={() => { bastirma.value = withSpring(1, { damping: 18, stiffness: 340 }); }}
      onPressOut={() => { bastirma.value = withSpring(0, { damping: 14, stiffness: 260 }); }}
      onPress={() => {
        if (pasif) return;
        if (titresimAcik) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={pasif}
      accessibilityRole="button"
      accessibilityLabel={metin}
      accessibilityState={{ disabled: pasif }}
    >
      <Yuva
        derinlik={derinlik}
        altRenk={ikincil ? 'rgba(0,0,0,0.3)' : RENK.dogruKoyu}
        yaricap={YARICAP.normal}
        style={pasif && durum.pasif}
      >
        <Animated.View
          style={[durum.govde, ikincil ? durum.ikincil : durum.ana, stil]}
        >
          {ikon && !ikonSagda ? <Ikon ad={ikon} boyut={20} renk={metinRenk} /> : null}
          <Yazi tur="cokKalin" boyut={BOYUT.orta - 0.5} renk={metinRenk}>
            {metin}
          </Yazi>
          {ikon && ikonSagda ? <Ikon ad={ikon} boyut={20} renk={metinRenk} /> : null}
        </Animated.View>
      </Yuva>
    </Pressable>
  );
}

/**
 * Oyundan cikis. Oyun ekranlarinin ust satirinda hep SOL kosede durur.
 *
 * Yalniz ikon - ust satirda kategori adi ve sure halkasi icin yer birakmali.
 *
 * Dokunma alani 44px, gorunen kutu 34px. hitSlop kullanilmiyor cunku
 * hitSlop yalnizca ebeveynin kendi sinirlari ICINDE genisletir - satir
 * 34px yuksekse tasan kisim hicbir zaman dokunulabilir olmuyordu.
 */
export function CikisButonu({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Oyundan çık"
      style={durum.cikisAlani}
    >
      <View style={durum.cikisKutu}>
        <Ikon ad="house" boyut={19} renk={RENK.sis} cizgiKalinligi={2.3} />
      </View>
    </Pressable>
  );
}

/**
 * Kucuk metin baglantisi. Ust satirda ikincil bir yol sunar.
 *
 * Etiketi acikca yazar - "Geri" gibi belirsiz bir soz yerine ne olacagini
 * soyler. Yukseklik 44px esiginde.
 */
export function BagButonu({
  metin,
  ikon,
  onPress,
}: {
  metin: string;
  ikon?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={metin}
      style={durum.bag}
    >
      {ikon ? <Ikon ad={ikon} boyut={16} renk={RENK.sis} cizgiKalinligi={2.2} /> : null}
      <Yazi tur="cokKalin" boyut={BOYUT.kucuk + 1} renk={RENK.sis}>{metin}</Yazi>
    </Pressable>
  );
}

/** Geri baglantisi. Ust satirlarda kullanilir. */
export function GeriButonu({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Geri"
      hitSlop={12}
      style={durum.geri}
    >
      <Ikon ad="chevron-left" boyut={18} renk={RENK.sis} />
      <Yazi tur="cokKalin" boyut={BOYUT.notr} renk={RENK.sis}>Geri</Yazi>
    </Pressable>
  );
}

const durum = StyleSheet.create({
  // Butonun oturdugu yuva. Alt boslugu kadar kalinlik gorunur.
  taban: { borderRadius: YARICAP.normal, overflow: 'hidden' },
  // Yuvanin gorunen kalinligi. Buton basilinca ustune iner.
  kalinlik: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  govde: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BOSLUK.kucuk + 2,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: YARICAP.normal,
    minHeight: 56,
  },
  ana: {
    backgroundColor: RENK.dogru,
  },
  ikincil: {
    backgroundColor: RENK.yuzey,
    borderWidth: 1.5,
    borderColor: RENK.cizgi,
  },
  pasif: { opacity: 0.4 },
  // Dokunma alani - gorunmez, sadece 44px esigini saglar
  cikisAlani: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BOSLUK.minik + 2,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  cikisKutu: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: YARICAP.kucuk,
    backgroundColor: RENK.yuzey,
    borderWidth: 1.5,
    borderColor: RENK.cizgi,
  },
  /**
   * alignSelf yalnizca SUTUN yerlesimde dogru - orada "yatayda esneme"
   * demek. Satir yerlesiminde capraz eksen dikey oldugu icin butonu
   * satirin tepesine yapistirir. Bu yuzden GeriButonu sadece sutun
   * yerlesimli ekranlarda kullanilir.
   */
  geri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BOSLUK.minik + 2,
    paddingVertical: 10,
    paddingRight: 14,
    minHeight: 44,
    alignSelf: 'flex-start',
  },
});
