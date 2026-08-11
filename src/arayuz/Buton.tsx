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

  const stil = useAnimatedStyle(() => ({
    transform: [{ translateY: bastirma.value * (derinlik - 1) }],
    borderBottomWidth: derinlik - bastirma.value * (derinlik - 1),
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
      <Animated.View
        style={[
          durum.govde,
          ikincil ? durum.ikincil : durum.ana,
          pasif && durum.pasif,
          stil,
        ]}
      >
        {ikon && !ikonSagda ? <Ikon ad={ikon} boyut={20} renk={metinRenk} /> : null}
        <Yazi tur="cokKalin" boyut={BOYUT.orta - 0.5} renk={metinRenk}>
          {metin}
        </Yazi>
        {ikon && ikonSagda ? <Ikon ad={ikon} boyut={20} renk={metinRenk} /> : null}
      </Animated.View>
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
    borderBottomColor: RENK.dogruKoyu,
  },
  ikincil: {
    backgroundColor: RENK.yuzey,
    borderWidth: 1.5,
    borderColor: RENK.cizgi,
    borderBottomColor: 'rgba(0,0,0,0.3)',
  },
  pasif: { opacity: 0.4 },
  geri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BOSLUK.minik + 2,
    paddingVertical: 10,
    paddingRight: 14,
    alignSelf: 'flex-start',
  },
});
