/**
 * Dairesel sure sayaci.
 *
 * Halka SVG stroke-dashoffset ile cizilir ve Reanimated worklet
 * uzerinde dondurulur - JS thread'e dokunmaz, boylece kart gecisi
 * sirasinda bile takilmaz.
 *
 * Son 10 saniyede ve son kart modunda kirmiziya doner, nabiz atar.
 */

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { RENK } from '../tema/renkler';
import { BOYUT } from '../tema/yazitipi';
import { Yazi } from './Yazi';

const CanliCircle = Animated.createAnimatedComponent(Circle);

const CAP = 62;
const YARICAP_HALKA = 26;
const CEVRE = 2 * Math.PI * YARICAP_HALKA;

type Ozellikler = {
  kalanSaniye: number;
  oran: number;
  acil: boolean;
};

export function SureHalkasi({ kalanSaniye, oran, acil }: Ozellikler) {
  const ilerleme = useSharedValue(oran);
  const nabiz = useSharedValue(1);

  useEffect(() => {
    ilerleme.value = withTiming(oran, { duration: 320 });
  }, [oran, ilerleme]);

  useEffect(() => {
    if (acil) {
      nabiz.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 480 }),
          withTiming(1, { duration: 480 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(nabiz);
      nabiz.value = withTiming(1, { duration: 200 });
    }
    return () => cancelAnimation(nabiz);
  }, [acil, nabiz]);

  const yayOzellikleri = useAnimatedProps(() => ({
    strokeDashoffset: CEVRE * (1 - ilerleme.value),
  }));

  const nabizStil = useAnimatedStyle(() => ({
    transform: [{ scale: nabiz.value }],
  }));

  const renk = acil ? RENK.yanlis : RENK.pirinc;

  return (
    <Animated.View style={[durum.kok, nabizStil]}>
      <Svg width={CAP} height={CAP} viewBox="0 0 62 62">
        <Circle
          cx={31} cy={31} r={YARICAP_HALKA}
          stroke="rgba(245,234,218,0.14)" strokeWidth={6} fill="none"
        />
        <CanliCircle
          cx={31} cy={31} r={YARICAP_HALKA}
          stroke={renk} strokeWidth={6} fill="none"
          strokeLinecap="round"
          strokeDasharray={CEVRE}
          animatedProps={yayOzellikleri}
          // Sifir noktasi saat 12 olsun
          transform="rotate(-90 31 31)"
        />
      </Svg>
      <View style={durum.yaziAlani} pointerEvents="none">
        <Yazi tur="baslik" boyut={BOYUT.buyuk} renk={acil ? RENK.yanlis : RENK.fildisi}>
          {Math.max(0, kalanSaniye)}
        </Yazi>
      </View>
    </Animated.View>
  );
}

const durum = StyleSheet.create({
  kok: { width: CAP, height: CAP },
  yaziAlani: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
