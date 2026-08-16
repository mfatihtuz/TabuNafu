/**
 * Oyun karti.
 *
 * DERINLIK NASIL VERILIYOR
 * Ilk surumde perspective + rotateY ile gercek bir cevirme animasyonu
 * vardi. Web prototipinde guzel calisiyordu ama React Native'de ayni
 * degil: kart yamuluyor, ekran disina tasiyor ve animasyon ortasinda
 * takili kalabiliyor. Ilk cihaz testinde tam olarak bu oldu.
 *
 * Yerine daha saglam bir yol secildi:
 *   - Katmanli golge kartin masaya oturdugu hissini verir
 *   - Pirinc ust bant kalinlik hissi verir
 *   - Yeni kelimede kart hafifce buyuyup solarak degisir
 *
 * Ayni "hafif 3D" hissi, kirilganlik yok.
 *
 * Kart fildisi, metin neredeyse siyah. Sebep: denetci anlatanin
 * omzunun ustunden, acili ve uzaktan bakiyor. Kontrast 16.4:1.
 */

import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { KART_GOLGE, YARICAP } from '../tema/golgeler';
import { RENK } from '../tema/renkler';
import { BOYUT } from '../tema/yazitipi';
import { Yazi } from './Yazi';

type Ozellikler = {
  kelime: string;
  yasaklilar: readonly string[];
  sonKartMi?: boolean;
  pasTuruMu?: boolean;
  /** Her degistiginde kart cevrilir. */
  cevirmeAnahtari: number;
  /**
   * Karta uzun basilinca calisir - bozuk kart bildirmek icin.
   * Ayri bir dugme konmadi cunku tur ekraninda yer yok ve bildirme
   * nadir bir eylem. Nasil Oynanir ekraninda anlatiliyor.
   */
  onUzunBas?: () => void;
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
  onUzunBas,
}: Ozellikler) {
  // 0 = yerinde duruyor, 1 = degisim aninin ortasi
  const gecis = useSharedValue(0);

  useEffect(() => {
    // Ilk kartta animasyon oynatma, dogrudan yerinde dursun
    if (cevirmeAnahtari === 0) return;
    gecis.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 210 }),
    );
  }, [cevirmeAnahtari, gecis]);

  const govdeStil = useAnimatedStyle(() => ({
    opacity: interpolate(gecis.value, [0, 1], [1, 0.15]),
    transform: [
      { scale: interpolate(gecis.value, [0, 1], [1, 0.94]) },
      { translateY: interpolate(gecis.value, [0, 1], [0, 10]) },
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
          ortala
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
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
              ortala
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {y}
            </Yazi>
          ))}
        </View>
      </View>

      {/*
        Uzun basma katmani EN USTTE olmali - alta konursa ustundeki
        metin gorunumleri dokunusu yakalar. Normal dokunus bir sey yapmaz,
        yalnizca uzun basma bozuk kart bildirir.
      */}
      {onUzunBas ? (
        <Pressable
          onLongPress={onUzunBas}
          delayLongPress={700}
          accessibilityRole="button"
          accessibilityLabel={`${kelime}. Bozuk kartı bildirmek için uzun basın.`}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
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
  // Satir yuksekligi isletim sistemine birakildi (adjustsFontSizeToFit),
  // Turkce kuyruklar icin payi kutu veriyor
  anaKelime: { paddingTop: 16, paddingBottom: 18, minHeight: 74 },
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
