/**
 * Bozuk oldugu bildirilen kartlar.
 *
 * Oyun sirasinda karta uzun basilinca kart buraya dusuyor. Amac 5410
 * kartin icinde gozden kacan bir hatayi oyunu bolmeden isaretlemek.
 *
 * Liste CSV satiri olarak gosteriliyor - icerik dosyalari da ayni
 * bicimde, dolayisiyla duzeltirken dogrudan aranip degistirilebilir.
 */

import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeriButonu } from '../../src/arayuz/Buton';
import { Yazi } from '../../src/arayuz/Yazi';
import { Zemin } from '../../src/arayuz/Zemin';
import { Ikon } from '../../src/cizimler/Ikon';
import { oyunDeposu } from '../../src/oyun/durum';
import { BOSLUK, PANEL, SAYFA_YAN, YARICAP } from '../../src/tema/golgeler';
import { RENK } from '../../src/tema/renkler';
import { BOYUT } from '../../src/tema/yazitipi';

export default function BildirilenlerEkrani() {
  const yonlendir = useRouter();
  const kenar = useSafeAreaInsets();

  const bildirilenler = oyunDeposu((d) => d.bildirilenler);
  const bildirimSil = oyunDeposu((d) => d.bildirimSil);

  return (
    <Zemin>
      <View style={[durum.kok, { paddingTop: kenar.top + 18, paddingBottom: kenar.bottom + 18 }]}>
        <GeriButonu onPress={() => yonlendir.back()} />
        <Yazi tur="baslik" boyut={BOYUT.baslik} style={durum.baslik}>
          Bildirilen Kartlar
        </Yazi>
        <Yazi boyut={BOYUT.kucuk} renk={RENK.sis} style={durum.aciklama}>
          Oyunda karta uzun basınca kart buraya düşer. Satırlar içerik
          dosyalarındaki biçimde, aratıp düzeltebilirsin.
        </Yazi>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={durum.liste}>
          {bildirilenler.length === 0 ? (
            <Yazi boyut={BOYUT.notr} renk={RENK.sis} ortala style={durum.bosluk}>
              Bildirilen kart yok.
            </Yazi>
          ) : (
            bildirilenler.map((k, i) => (
              <View key={`${k[0]}-${i}`} style={durum.kart}>
                <View style={durum.kartMetin}>
                  <Yazi tur="cokKalin" boyut={BOYUT.govde}>{k[0]}</Yazi>
                  <Yazi boyut={BOYUT.kucuk} renk={RENK.sis}>
                    {k.slice(0, 6).join(';')}
                  </Yazi>
                </View>
                <Pressable
                  onPress={() => bildirimSil(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`${k[0]} bildirimini kaldır`}
                  style={durum.sil}
                >
                  <Ikon ad="x" boyut={18} renk={RENK.sis} cizgiKalinligi={2.6} />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Zemin>
  );
}

const durum = StyleSheet.create({
  kok: { flex: 1, paddingHorizontal: SAYFA_YAN },
  baslik: { marginBottom: 4 },
  aciklama: { marginBottom: BOSLUK.orta, maxWidth: 330 },
  liste: { gap: BOSLUK.kucuk, paddingBottom: BOSLUK.orta },
  kart: {
    ...PANEL,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: YARICAP.kucuk + 2,
  },
  kartMetin: { flex: 1, gap: 3 },
  sil: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bosluk: { marginTop: BOSLUK.devasa },
});
