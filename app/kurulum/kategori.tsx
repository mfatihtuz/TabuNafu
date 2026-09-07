/**
 * Kategori secimi.
 *
 * Yirmi kategori artı KARIŞIK. Her kutucuk ayni cerceve geometrisini
 * paylasir, sadece ikon ve renk degisir - boylece uyum garanti.
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { GeriButonu } from '../../src/arayuz/Buton';
import { Modal3D } from '../../src/arayuz/Modal3D';
import { Yazi } from '../../src/arayuz/Yazi';
import { Zemin } from '../../src/arayuz/Zemin';
import { Ikon } from '../../src/cizimler/Ikon';
import { oyunDeposu } from '../../src/oyun/durum';
import { KARISIK, KATEGORILER, KENDI, kartSayisi, kategoriBul } from '../../src/oyun/kategoriler';
import type { Kategori } from '../../src/oyun/tipler';
import { BOSLUK, PANEL, YARICAP } from '../../src/tema/golgeler';
import { RENK } from '../../src/tema/renkler';
import { BOYUT } from '../../src/tema/yazitipi';

const YAN_BOSLUK = 22;
const IZGARA_BOSLUK = 11;
const SUTUN = 3;

export default function KategoriEkrani() {
  const yonlendir = useRouter();
  const kenar = useSafeAreaInsets();
  const { width: ekranGenisligi } = useWindowDimensions();
  const kategoriSec = oyunDeposu((d) => d.kategoriSec);
  const zorlukModu = oyunDeposu((d) => d.ayarlar.zorlukModu);
  const kendiKartlar = oyunDeposu((d) => d.kendiKartlar);

  /**
   * Kutucuk genisligi olcerek hesaplanir, yuzdeyle degil.
   * Yuzde kullanilinca 402px ekranda toplam 2.3px tasiyor ve ucuncu
   * kutucuk alt satira dusuyordu - ilk cihaz testinde iki sutun gorunuyordu.
   */
  const kutucukGenisligi = Math.floor(
    (ekranGenisligi - YAN_BOSLUK * 2 - IZGARA_BOSLUK * (SUTUN - 1)) / SUTUN,
  );

  // Kart sayilari her cizimde yeniden hesaplanmasin
  const sayilar = useMemo(() => {
    const harita: Record<string, number> = {};
    for (const k of KATEGORILER) harita[k.kimlik] = kartSayisi(k.kimlik, zorlukModu);
    return harita;
  }, [zorlukModu]);

  const kendiSayi = kartSayisi(KENDI.kimlik, zorlukModu, kendiKartlar);

  /**
   * Kategori ruleti. Kimse "ben cografya bilmem" diye kacamiyor.
   * Kisa bir donme animasyonu, sonra rastgele kategori secilir.
   */
  const [cark, setCark] = useState<string | null>(null);

  function carkiDondur() {
    const havuz = KATEGORILER.map((k) => k.kimlik);
    let adim = 0;
    const z = setInterval(() => {
      setCark(havuz[Math.floor(Math.random() * havuz.length)] ?? null);
      adim++;
      if (adim >= 12) {
        clearInterval(z);
        const secilen = havuz[Math.floor(Math.random() * havuz.length)]!;
        setCark(secilen);
        setTimeout(() => { setCark(null); sec(secilen); }, 520);
      }
    }, 90);
  }

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
              genislik={kutucukGenisligi}
              onPress={() => sec(k.kimlik)}
            />
          ))}

          {kendiKartlar.length > 0 ? (
            <Kutucuk
              kategori={KENDI}
              adet={kendiSayi}
              genislik={kutucukGenisligi}
              onPress={() => sec(KENDI.kimlik)}
            />
          ) : null}

          <Pressable
            onPress={carkiDondur}
            style={durum.karisik}
            accessibilityRole="button"
            accessibilityLabel="Kategori çarkını döndür"
          >
            <View style={[durum.disk, { backgroundColor: RENK.mavi }]}>
              <Ikon ad="dices" boyut={25} renk={RENK.beyaz} cizgiKalinligi={2.2} />
            </View>
            <View style={durum.karisikMetin}>
              <Yazi tur="cokKalin" boyut={BOYUT.govde}>ÇARKI ÇEVİR</Yazi>
              <Yazi boyut={BOYUT.kucuk} renk={RENK.sis}>
                Kategoriyi şans seçsin
              </Yazi>
            </View>
          </Pressable>

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

      {/* Cark donerken kategori adlari hizla degisir - gerilim burada */}
      <Modal3D
        acik={cark !== null}
        ikon="dices"
        ikonRenk={RENK.mavi}
        baslik={cark ? kategoriBul(cark).ad : ''}
        metin="Çark dönüyor..."
        birinci=""
        onBirinci={() => {}}
      />
    </Zemin>
  );
}

function Kutucuk({
  kategori,
  adet,
  genislik,
  onPress,
}: {
  kategori: Kategori;
  adet: number;
  genislik: number;
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
      style={{ width: genislik }}
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
  kok: { flex: 1, paddingHorizontal: YAN_BOSLUK },
  aciklama: { marginTop: 6, marginBottom: BOSLUK.orta },
  izgara: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IZGARA_BOSLUK,
  },
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
