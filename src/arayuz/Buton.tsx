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
      <View style={[durum.taban, { paddingBottom: derinlik }, pasif && durum.pasif]}>
        <View
          style={[
            durum.kalinlik,
            { height: derinlik, backgroundColor: ikincil ? 'rgba(0,0,0,0.3)' : RENK.dogruKoyu },
          ]}
        />
        <Animated.View
          style={[durum.govde, ikincil ? durum.ikincil : durum.ana, stil]}
        >
          {ikon && !ikonSagda ? <Ikon ad={ikon} boyut={20} renk={metinRenk} /> : null}
          <Yazi tur="cokKalin" boyut={BOYUT.orta - 0.5} renk={metinRenk}>
            {metin}
          </Yazi>
          {ikon && ikonSagda ? <Ikon ad={ikon} boyut={20} renk={metinRenk} /> : null}
        </Animated.View>
      </View>
    </Pressable>
  );
}

/**
 * Oyundan cikis. Tur ekraninin ust satirinda durur.
 *
 * Yalniz ikon - ust satirda kategori adi ve sure halkasi icin yer birakmali.
 * Dokunma hedefi hitSlop ile 44px esiginin uzerine cikarilir.
 */
export function CikisButonu({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Oyundan çık"
      hitSlop={14}
      style={durum.cikis}
    >
      <Ikon ad="house" boyut={19} renk={RENK.sis} cizgiKalinligi={2.3} />
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
  cikis: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: YARICAP.kucuk,
    backgroundColor: RENK.yuzey,
    borderWidth: 1.5,
    borderColor: RENK.cizgi,
  },
  geri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BOSLUK.minik + 2,
    paddingVertical: 10,
    paddingRight: 14,
    alignSelf: 'flex-start',
  },
});
