/**
 * Tur ekranindaki uc aksiyon butonu: YANLIŞ - PAS - DOĞRU.
 *
 * Basili-derinlik efekti: butonun altinda sabit bir kalinlik var,
 * basilinca buton asagi iner ve kalinlik kaybolur. Gercek bir tusa
 * basmis hissi verir, gorsel sus degil - dokunusun kaydedildigini
 * anlatir.
 *
 * Pas hakki bitince veya son kart modunda buton kilit ikonuna doner.
 */

import * as Haptics from 'expo-haptics';
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

export type AksiyonTipi = 'yanlis' | 'pas' | 'dogru';

const BICIM = {
  yanlis: {
    ikon: 'x',
    etiket: 'YANLIŞ',
    daire: RENK.yanlis,
    ikonRenk: RENK.beyaz,
    zemin: 'rgba(224,30,55,0.13)',
    alt: 'rgba(224,30,55,0.30)',
    sayacRenk: RENK.yanlis,
  },
  pas: {
    ikon: 'chevrons-right',
    etiket: 'PAS',
    daire: RENK.pas,
    ikonRenk: RENK.sariUstu,
    zemin: 'rgba(245,165,36,0.13)',
    alt: 'rgba(245,165,36,0.30)',
    sayacRenk: RENK.pas,
  },
  dogru: {
    ikon: 'check',
    etiket: 'DOĞRU',
    daire: RENK.dogru,
    ikonRenk: RENK.yesilUstu,
    zemin: 'rgba(18,161,80,0.13)',
    alt: 'rgba(18,161,80,0.30)',
    sayacRenk: RENK.dogru,
  },
} as const;

type Ozellikler = {
  tip: AksiyonTipi;
  sayac: string;
  kilitli?: boolean;
  titresimAcik?: boolean;
  onPress: () => void;
};

export function AksiyonButonu({
  tip,
  sayac,
  kilitli = false,
  titresimAcik = true,
  onPress,
}: Ozellikler) {
  const bicim = BICIM[tip];
  const bastirma = useSharedValue(0);

  const govdeStil = useAnimatedStyle(() => ({
    transform: [{ translateY: bastirma.value * 4 }],
    borderBottomWidth: 5 - bastirma.value * 4,
  }));

  function basildi() {
    if (kilitli) return;
    if (titresimAcik) {
      const siddet =
        tip === 'dogru' ? Haptics.ImpactFeedbackStyle.Medium
        : tip === 'yanlis' ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Light;
      void Haptics.impactAsync(siddet);
    }
    onPress();
  }

  return (
    <Pressable
      onPressIn={() => { bastirma.value = withSpring(1, { damping: 18, stiffness: 320 }); }}
      onPressOut={() => { bastirma.value = withSpring(0, { damping: 14, stiffness: 260 }); }}
      onPress={basildi}
      disabled={kilitli}
      accessibilityRole="button"
      accessibilityLabel={`${bicim.etiket}, ${sayac}`}
      accessibilityState={{ disabled: kilitli }}
      style={durum.dokunmaAlani}
    >
      <Animated.View
        style={[
          durum.govde,
          { backgroundColor: bicim.zemin, borderBottomColor: bicim.alt },
          kilitli && durum.kilitli,
          govdeStil,
        ]}
      >
        <View
          style={[
            durum.daire,
            { backgroundColor: kilitli ? '#6B5A44' : bicim.daire },
          ]}
        >
          <Ikon
            ad={kilitli ? 'lock' : bicim.ikon}
            boyut={26}
            renk={kilitli ? '#2A2015' : bicim.ikonRenk}
            cizgiKalinligi={3}
          />
        </View>
        <Yazi tur="cokKalin" boyut={BOYUT.minik} renk={RENK.sis} harfAraligi={1.1}>
          {bicim.etiket}
        </Yazi>
        <Yazi tur="cokKalin" boyut={BOYUT.orta} renk={bicim.sayacRenk}>
          {sayac}
        </Yazi>
      </Animated.View>
    </Pressable>
  );
}

const durum = StyleSheet.create({
  dokunmaAlani: { flex: 1 },
  govde: {
    alignItems: 'center',
    gap: BOSLUK.minik + 2,
    paddingTop: 13,
    paddingBottom: 10,
    borderRadius: YARICAP.normal,
    borderBottomWidth: 5,
    // Dokunma hedefi Apple ve Google esigi olan 44px'in uzerinde
    minHeight: 106,
  },
  daire: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kilitli: { opacity: 0.42 },
});
