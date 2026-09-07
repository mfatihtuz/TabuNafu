/**
 * Altin kart parlamasi.
 *
 * Uc katman birlikte calisiyor:
 *   1  NABIZ    Kenar boyunca altin bir halka yavasca parlayip soner.
 *               Kartin altin oldugunu uzaktan bile belli eder.
 *   2  SUPURME  Egik bir isik seridi kartin uzerinden gecer. Metnin
 *               ALTINDA durur, okumayi zorlastirmasin.
 *   3  ESINTI   Kenarlarda kucuk altin izler yukari suzulup kaybolur.
 *               Hafif olmali - dikkati kelimeden calmamali.
 *
 * KURAL
 * Yalnizca transform ve opacity animasyonlanir. Duzen ozelligi
 * (genislik, kenarlik kalinligi, kenar bosluğu) canlandirilmaz - her
 * karede kutu yeniden olculur ve kart bir an kaybolabilir. Bu hata
 * daha once AksiyonButonu ve Buton'da yasandi.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { YARICAP } from '../tema/golgeler';
import { RENK } from '../tema/renkler';

const ALTIN_ACIK = '#FFE9B8';
const ALTIN_PARLAK = '#F2C879';

/** Kenarda yukari suzulen tek bir altin iz. */
function Esinti({ gecikme, sag, yatay }: { gecikme: number; sag: boolean; yatay: number }) {
  const akis = useSharedValue(0);

  useEffect(() => {
    akis.value = withDelay(
      gecikme,
      withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [akis, gecikme]);

  const stil = useAnimatedStyle(() => ({
    // Basta ve sonda gorunmez, ortada belirir
    opacity: interpolate(akis.value, [0, 0.2, 0.7, 1], [0, 0.85, 0.45, 0]),
    transform: [
      { translateY: interpolate(akis.value, [0, 1], [0, -150]) },
      { translateX: interpolate(akis.value, [0, 0.5, 1], [0, sag ? -7 : 7, 0]) },
      { scaleY: interpolate(akis.value, [0, 0.35, 1], [0.4, 1, 0.5]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        durum.esinti,
        sag ? { right: yatay } : { left: yatay },
        stil,
      ]}
    />
  );
}

/**
 * Alt katman: isik seridi ve kenar esintileri.
 * Kartin ICERIGINDEN ONCE cizilir, boylece metnin altinda kalir.
 */
export function AltinParilti() {
  const supurme = useSharedValue(0);

  useEffect(() => {
    supurme.value = withRepeat(
      withTiming(1, { duration: 2300, easing: Easing.inOut(Easing.cubic) }),
      -1,
      false,
    );
  }, [supurme]);

  const supurmeStil = useAnimatedStyle(() => ({
    opacity: interpolate(supurme.value, [0, 0.15, 0.6, 1], [0, 0.55, 0.35, 0]),
    transform: [
      { rotate: '18deg' },
      { translateX: interpolate(supurme.value, [0, 1], [-260, 320]) },
    ],
  }));

  return (
    <>
      {/* 2 - Isik seridi. Metnin ALTINDA, okumayi engellemez. */}
      <View style={durum.supurmeAlani} pointerEvents="none">
        <Animated.View style={[durum.supurme, supurmeStil]}>
          <LinearGradient
            colors={['transparent', ALTIN_ACIK, ALTIN_PARLAK, 'transparent']}
            locations={[0, 0.42, 0.58, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* 3 - Kenar esintileri. Kartin iki yaninda, seyrek ve hafif. */}
      <View style={durum.esintiAlani} pointerEvents="none">
        <Esinti gecikme={0} sag={false} yatay={5} />
        <Esinti gecikme={900} sag={false} yatay={13} />
        <Esinti gecikme={1750} sag={false} yatay={8} />
        <Esinti gecikme={450} sag yatay={6} />
        <Esinti gecikme={1300} sag yatay={14} />
        <Esinti gecikme={2100} sag yatay={9} />
      </View>

    </>
  );
}

/**
 * Ust katman: nabiz halkasi.
 * Kartin ICERIGINDEN SONRA cizilir - kenarda net dursun. Metni ortmez,
 * cunku yalnizca kenarlik boyar.
 */
export function AltinHalka() {
  const nabiz = useSharedValue(0);

  useEffect(() => {
    nabiz.value = withRepeat(
      withTiming(1, { duration: 1150, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [nabiz]);

  const halkaStil = useAnimatedStyle(() => ({
    opacity: interpolate(nabiz.value, [0, 1], [0.45, 1]),
    transform: [{ scale: interpolate(nabiz.value, [0, 1], [1, 1.012]) }],
  }));

  return <Animated.View style={[durum.halka, halkaStil]} pointerEvents="none" />;
}

const durum = StyleSheet.create({
  supurmeAlani: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
  supurme: {
    position: 'absolute',
    top: -160,
    bottom: -160,
    width: 90,
    left: 0,
  },
  esintiAlani: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
  esinti: {
    position: 'absolute',
    bottom: 24,
    width: 3,
    height: 26,
    borderRadius: 2,
    backgroundColor: ALTIN_ACIK,
  },
  halka: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: YARICAP.buyuk - 4,
    borderWidth: 3,
    borderColor: RENK.pirinc,
  },
});
