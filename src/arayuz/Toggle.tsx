/**
 * Anahtar (toggle) ve sayi secici.
 *
 * Ikisi de kurulum ekranlarinda kullanilir. Dokunma hedefleri
 * bilerek 44px esiginin uzerinde tutuldu.
 */

import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Ikon } from '../cizimler/Ikon';
import { BOSLUK, PANEL, YARICAP } from '../tema/golgeler';
import { RENK } from '../tema/renkler';
import { BOYUT } from '../tema/yazitipi';
import { Yazi } from './Yazi';

type ToggleOzellikleri = {
  baslik: string;
  aciklama?: string;
  acik: boolean;
  titresimAcik?: boolean;
  onDegis: (yeni: boolean) => void;
};

export function Toggle({
  baslik,
  aciklama,
  acik,
  titresimAcik = true,
  onDegis,
}: ToggleOzellikleri) {
  const konum = useSharedValue(acik ? 1 : 0);

  useEffect(() => {
    konum.value = withTiming(acik ? 1 : 0, { duration: 220 });
  }, [acik, konum]);

  const topStil = useAnimatedStyle(() => ({
    transform: [{ translateX: konum.value * 21 }],
    backgroundColor: konum.value > 0.5 ? RENK.fildisi : RENK.sis,
  }));

  const rayStil = useAnimatedStyle(() => ({
    backgroundColor: konum.value > 0.5 ? RENK.dogruKoyu : RENK.yuzeyKoyu,
    borderColor: konum.value > 0.5 ? RENK.dogru : RENK.cizgi,
  }));

  return (
    <Pressable
      onPress={() => {
        if (titresimAcik) void Haptics.selectionAsync();
        onDegis(!acik);
      }}
      accessibilityRole="switch"
      accessibilityLabel={baslik}
      accessibilityState={{ checked: acik }}
      style={durum.toggleSatir}
    >
      <View style={durum.toggleMetin}>
        <Yazi tur="cokKalin" boyut={BOYUT.govde}>{baslik}</Yazi>
        {aciklama ? (
          <Yazi boyut={BOYUT.kucuk + 0.5} renk={RENK.sis}>{aciklama}</Yazi>
        ) : null}
      </View>
      <Animated.View style={[durum.ray, rayStil]}>
        <Animated.View style={[durum.top, topStil]} />
      </Animated.View>
    </Pressable>
  );
}

type SayiOzellikleri = {
  deger: number;
  enAz: number;
  enFazla: number;
  titresimAcik?: boolean;
  onDegis: (yeni: number) => void;
};

export function SayiSecici({
  deger,
  enAz,
  enFazla,
  titresimAcik = true,
  onDegis,
}: SayiOzellikleri) {
  function degistir(yon: number) {
    const yeni = deger + yon;
    if (yeni < enAz || yeni > enFazla) return;
    if (titresimAcik) void Haptics.selectionAsync();
    onDegis(yeni);
  }

  return (
    <View style={durum.adet}>
      <Pressable
        onPress={() => degistir(-1)}
        disabled={deger <= enAz}
        accessibilityRole="button"
        accessibilityLabel="Azalt"
        hitSlop={8}
        style={[durum.adetDugme, deger <= enAz && durum.adetPasif]}
      >
        <Ikon ad="minus" boyut={15} renk={RENK.fildisi} cizgiKalinligi={2.6} />
      </Pressable>

      <Yazi tur="cokKalin" boyut={BOYUT.orta} style={durum.adetDeger}>
        {deger}
      </Yazi>

      <Pressable
        onPress={() => degistir(1)}
        disabled={deger >= enFazla}
        accessibilityRole="button"
        accessibilityLabel="Artır"
        hitSlop={8}
        style={[durum.adetDugme, deger >= enFazla && durum.adetPasif]}
      >
        <Ikon ad="plus" boyut={15} renk={RENK.fildisi} cizgiKalinligi={2.6} />
      </Pressable>
    </View>
  );
}

const durum = StyleSheet.create({
  toggleSatir: {
    ...PANEL,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: BOSLUK.notr,
    paddingVertical: 15,
    paddingHorizontal: 16,
    minHeight: 62,
  },
  toggleMetin: { flex: 1, gap: 3 },
  ray: {
    width: 52,
    height: 31,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    paddingLeft: 2.5,
  },
  top: { width: 23, height: 23, borderRadius: YARICAP.tam },
  adet: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  adetDugme: {
    width: 34,
    height: 34,
    borderRadius: YARICAP.kucuk - 2,
    backgroundColor: 'rgba(245,234,218,0.10)',
    borderWidth: 1.5,
    borderColor: RENK.cizgi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adetPasif: { opacity: 0.3 },
  adetDeger: { minWidth: 20, textAlign: 'center' },
});
