/**
 * Oyun karti.
 *
 * "Hafif 3D" burada uc parcadan olusuyor:
 *   1  Kart hafifce geriye yatik durur (rotateX)
 *   2  Katmanli golge masaya oturmus hissi verir
 *   3  Yeni kelimede Y ekseninde cevrilir
 *
 * Gercek 3D motor kullanilmiyor - pil yakar ve bu his icin gereksiz.
 *
 * Kart fildisi, metin neredeyse siyah. Sebep: denetci anlatanin
 * omzunun ustunden, acili ve uzaktan bakiyor. Kontrast 16.4:1.
 */

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { KART_GOLGE, YARICAP } from '../tema/golgeler';
import { RENK } from '../tema/renkler';
import { BOYUT, SATIR } from '../tema/yazitipi';
import { Yazi } from './Yazi';

type Ozellikler = {
  kelime: string;
  yasaklilar: readonly string[];
  sonKartMi?: boolean;
  pasTuruMu?: boolean;
  /** Her degistiginde kart cevrilir. */
  cevirmeAnahtari: number;
};

/** Uzun kelimeler dar ekranda tasmasin diye font kademeli kuculur. */
function anaBoyut(kelime: string): number {
  if (kelime.length > 14) return BOYUT.baslik - 1;
  if (kelime.length > 9) return BOYUT.devasa - 6;
  return BOYUT.kart;
}

export function Kart3D({
  kelime,
  yasaklilar,
  sonKartMi = false,
  pasTuruMu = false,
  cevirmeAnahtari,
}: Ozellikler) {
  const cevirme = useSharedValue(0);

  useEffect(() => {
    cevirme.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 220 }),
    );
  }, [cevirmeAnahtari, cevirme]);

  const govdeStil = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateX: '4deg' },
      { rotateY: `${interpolate(cevirme.value, [0, 1], [0, -84])}deg` },
      { scale: interpolate(cevirme.value, [0, 1], [1, 0.9]) },
    ],
  }));

  const rozetVar = sonKartMi || pasTuruMu;

  return (
    <Animated.View
      style={[
        durum.kart,
        KART_GOLGE,
        sonKartMi && durum.kartSonKart,
        govdeStil,
      ]}
    >
      <View style={[durum.bant, sonKartMi && { backgroundColor: RENK.yanlis }]} />

      {pasTuruMu ? (
        <View style={[durum.rozet, durum.rozetPas]}>
          <Yazi tur="cokKalin" boyut={BOYUT.minik - 0.5}
                renk={RENK.sariUstu} harfAraligi={1.7}>
            PAS TURU
          </Yazi>
        </View>
      ) : null}

      {sonKartMi ? (
        <View style={[durum.rozet, durum.rozetSon, pasTuruMu && durum.rozetAlt]}>
          <Yazi tur="cokKalin" boyut={BOYUT.minik - 0.5}
                renk={RENK.beyaz} harfAraligi={1.7}>
            SON KART
          </Yazi>
        </View>
      ) : null}

      <View style={[durum.ic, rozetVar && durum.icRozetli]}>
        <Yazi
          tur="baslik"
          boyut={anaBoyut(kelime)}
          renk={RENK.metinAna}
          satir={SATIR.sik}
          ortala
          numberOfLines={2}
          adjustsFontSizeToFit
          style={durum.anaKelime}
        >
          {kelime}
        </Yazi>

        <View style={durum.ayrac} />

        <View style={durum.yasakliListe}>
          {yasaklilar.map((y, i) => (
            <Yazi
              key={`${y}-${i}`}
              tur="cokKalin"
              boyut={BOYUT.buyuk}
              renk={RENK.metinAlt}
              satir={SATIR.normal}
              ortala
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {y}
            </Yazi>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const durum = StyleSheet.create({
  kart: {
    width: '100%',
    maxWidth: 340,
    flex: 1,
    maxHeight: 470,
    backgroundColor: RENK.kart,
    borderRadius: YARICAP.buyuk - 4,
    overflow: 'hidden',
  },
  kartSonKart: {
    borderWidth: 4,
    borderColor: RENK.yanlis,
  },
  bant: {
    height: 13,
    backgroundColor: RENK.kartBant,
  },
  ic: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
  },
  // Rozet varken ana kelime asagi kayar, ustuste binmez
  icRozetli: { paddingTop: 48 },
  anaKelime: { paddingVertical: 14 },
  ayrac: {
    height: 2.5,
    borderRadius: 2,
    backgroundColor: RENK.metinAna,
    opacity: 0.13,
  },
  yasakliListe: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingTop: 8,
  },
  rozet: {
    position: 'absolute',
    top: 26,
    alignSelf: 'center',
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: YARICAP.tam,
    zIndex: 2,
  },
  rozetPas: { backgroundColor: RENK.pas },
  rozetSon: { backgroundColor: RENK.yanlis },
  // Ikisi ayni anda gorunurse son kart rozeti asagi iner
  rozetAlt: { top: undefined, bottom: 18 },
});
