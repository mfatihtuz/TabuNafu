/**
 * Yatay kaydirmali deger secici. Sure, pas hakki, hedef puan ve tur
 * sayisi ekranlarinda kullanilir.
 *
 * Secili pul buyur ve renk degistirir - dokunusun karsiligi aninda
 * gorunur olsun diye yaylanarak (spring) animasyonlanir.
 */

import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { BOSLUK, SAYFA_YAN, YARICAP } from '../tema/golgeler';
import { RENK } from '../tema/renkler';
import { BOYUT } from '../tema/yazitipi';
import { UstYazi, Yazi } from './Yazi';

type Ozellikler = {
  baslik: string;
  birim?: string;
  secenekler: readonly number[];
  deger: number;
  titresimAcik?: boolean;
  onSec: (deger: number) => void;
};

export function Secici({
  baslik,
  birim,
  secenekler,
  deger,
  titresimAcik = true,
  onSec,
}: Ozellikler) {
  return (
    <View style={durum.kok}>
      <View style={durum.ustSatir}>
        <UstYazi>{baslik}</UstYazi>
        <View style={durum.degerAlani}>
          <Yazi tur="baslik" boyut={BOYUT.baslik - 1} renk={RENK.pirinc}>
            {deger}
          </Yazi>
          {birim ? (
            <Yazi tur="cokKalin" boyut={BOYUT.kucuk + 1} renk={RENK.sis}>
              {' '}{birim}
            </Yazi>
          ) : null}
        </View>
      </View>

      {/*
        Ray tam genislikte kalir, sayfa boslugunu contentContainer tasir.
        Negatif marjla sayfa boslugunu asmayi denemiyoruz - ust ScrollView
        icerigini kendi sinirinda kirptigi icin pullar ekran kenarina
        varmadan ortasindan kesiliyordu.
      */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={durum.ray}
        // Secili degeri gorunur tutmak icin en yakin pula yaslanir
        snapToAlignment="center"
        decelerationRate="fast"
      >
        {secenekler.map((s) => (
          <Pul
            key={s}
            deger={s}
            secili={s === deger}
            onPress={() => {
              if (titresimAcik) void Haptics.selectionAsync();
              onSec(s);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Pul({
  deger,
  secili,
  onPress,
}: {
  deger: number;
  secili: boolean;
  onPress: () => void;
}) {
  const olcek = useSharedValue(secili ? 1.12 : 1);
  const ilkCizim = useRef(true);

  useEffect(() => {
    if (ilkCizim.current) {
      ilkCizim.current = false;
      olcek.value = secili ? 1.12 : 1;
      return;
    }
    olcek.value = withSpring(secili ? 1.12 : 1, { damping: 12, stiffness: 240 });
  }, [secili, olcek]);

  const stil = useAnimatedStyle(() => ({ transform: [{ scale: olcek.value }] }));

  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      accessibilityState={{ selected: secili }}>
      <Animated.View style={[durum.pul, secili && durum.pulSecili, stil]}>
        <Yazi
          tur="cokKalin"
          boyut={BOYUT.govde}
          renk={secili ? RENK.yesilUstu : RENK.sis}
        >
          {deger}
        </Yazi>
      </Animated.View>
    </Pressable>
  );
}

const durum = StyleSheet.create({
  kok: { gap: BOSLUK.kucuk + 1 },
  ustSatir: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    // Baslik satiri sayfa boslugunu kendisi tasir, ray tasimaz
    paddingHorizontal: SAYFA_YAN,
  },
  degerAlani: { flexDirection: 'row', alignItems: 'baseline' },
  // Ic bosluk burada: ilk ve son pul kenara yapismaz
  ray: { gap: BOSLUK.kucuk, paddingVertical: 4, paddingHorizontal: SAYFA_YAN },
  pul: {
    minWidth: 58,
    // Dokunma hedefi 44px esiginin uzerinde
    minHeight: 48,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: YARICAP.orta,
    backgroundColor: RENK.yuzey,
    borderWidth: 1.5,
    borderColor: RENK.cizgi,
  },
  pulSecili: {
    backgroundColor: RENK.dogru,
    borderColor: 'transparent',
  },
});
