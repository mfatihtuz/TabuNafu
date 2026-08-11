/**
 * Kategori secimi.
 *
 * Yirmi kategori artı KARIŞIK. Her kutucuk ayni cerceve geometrisini
 * paylasir, sadece ikon ve renk degisir - boylece uyum garanti.
 */

import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { GeriButonu } from '../../src/arayuz/Buton';
import { Yazi } from '../../src/arayuz/Yazi';
import { Zemin } from '../../src/arayuz/Zemin';
import { Ikon } from '../../src/cizimler/Ikon';
import { oyunDeposu } from '../../src/oyun/durum';
import { KARISIK, KATEGORILER, kartSayisi } from '../../src/oyun/kategoriler';
import type { Kategori } from '../../src/oyun/tipler';
import { BOSLUK, PANEL, YARICAP } from '../../src/tema/golgeler';
import { RENK } from '../../src/tema/renkler';
import { BOYUT } from '../../src/tema/yazitipi';

export default function KategoriEkrani() {
  const yonlendir = useRouter();
  const kenar = useSafeAreaInsets();
  const kategoriSec = oyunDeposu((d) => d.kategoriSec);

  // Kart sayilari her cizimde yeniden hesaplanmasin
  const sayilar = useMemo(() => {
    const harita: Record<string, number> = {};
    for (const k of KATEGORILER) harita[k.kimlik] = kartSayisi(k.kimlik);
    return harita;
  }, []);

  function sec(kimlik: string) {
    kategoriSec(kimlik);
    yonlendir.push('/oyun/sira');
  }

  return (
    <Zemin>
      <View style={[durum.kok, { paddingTop: kenar.top + 18 }]}>
        <GeriButonu onPress={() => yonlendir.back()} />
        <Yazi tur="baslik" boyut={BOYUT.baslik}>Kategori</Yazi>
        <Yazi boyut={BOYUT.notr} renk={RENK.sis} style={durum.aciklama}>
          Bir kategori seç. Deste bitmeden hiçbir kelime tekrar gelmez.
        </Yazi>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[durum.izgara, { paddingBottom: kenar.bottom + 24 }]}
        >
          {KATEGORILER.map((k) => (
            <Kutucuk
              key={k.kimlik}
              kategori={k}
              adet={sayilar[k.kimlik] ?? 0}
              onPress={() => sec(k.kimlik)}
            />
          ))}

          <Pressable onPress={() => sec(KARISIK.kimlik)} style={durum.karisik}
                     accessibilityRole="button" accessibilityLabel="Karışık kategori">
            <View style={[durum.disk, { backgroundColor: RENK.pirinc }]}>
              <Ikon ad="shuffle" boyut={25} renk={RENK.pirincUstu} cizgiKalinligi={2.2} />
            </View>
            <View style={durum.karisikMetin}>
              <Yazi tur="cokKalin" boyut={BOYUT.govde}>KARIŞIK</Yazi>
              <Yazi boyut={BOYUT.kucuk} renk={RENK.sis}>
                Tüm kategoriler tek destede
              </Yazi>
            </View>
          </Pressable>
        </ScrollView>
      </View>
    </Zemin>
  );
}

function Kutucuk({
  kategori,
  adet,
  onPress,
}: {
  kategori: Kategori;
  adet: number;
  onPress: () => void;
}) {
  const olcek = useSharedValue(1);
  const stil = useAnimatedStyle(() => ({ transform: [{ scale: olcek.value }] }));

  return (
    <Pressable
      onPressIn={() => { olcek.value = withSpring(0.93, { damping: 16, stiffness: 320 }); }}
      onPressOut={() => { olcek.value = withSpring(1, { damping: 12, stiffness: 260 }); }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${kategori.ad}, ${adet} kart`}
      style={durum.kutucukSar}
    >
      <Animated.View style={[durum.kutucuk, stil]}>
        <Yazi tur="cokKalin" boyut={BOYUT.minik - 1} renk={RENK.sis} style={durum.rozet}>
          {adet}
        </Yazi>
        <View style={[durum.disk, { backgroundColor: kategori.renk }]}>
          <Ikon
            ad={kategori.ikon}
            boyut={25}
            renk={kategori.ikonMetin ?? RENK.pirincUstu}
            cizgiKalinligi={2.1}
          />
        </View>
        <Yazi tur="cokKalin" boyut={BOYUT.minik} ortala numberOfLines={2}>
          {kategori.ad}
        </Yazi>
      </Animated.View>
    </Pressable>
  );
}

const durum = StyleSheet.create({
  kok: { flex: 1, paddingHorizontal: 22 },
  aciklama: { marginTop: 6, marginBottom: BOSLUK.orta },
  izgara: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },
  kutucukSar: { width: '31.5%' },
  kutucuk: {
    ...PANEL,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 5,
    borderRadius: YARICAP.normal - 1,
  },
  rozet: { position: 'absolute', top: 7, right: 8 },
  disk: {
    width: 46,
    height: 46,
    borderRadius: YARICAP.orta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  karisik: {
    ...PANEL,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: BOSLUK.notr + 2,
    padding: 15,
    borderColor: 'rgba(212,160,80,0.45)',
    backgroundColor: 'rgba(212,160,80,0.12)',
  },
  karisikMetin: { flex: 1, gap: 2 },
});
