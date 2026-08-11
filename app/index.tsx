/**
 * Ana ekran.
 */

import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Buton } from '../src/arayuz/Buton';
import { Yazi } from '../src/arayuz/Yazi';
import { Zemin } from '../src/arayuz/Zemin';
import { oyunDeposu } from '../src/oyun/durum';
import { BOSLUK, KART_GOLGE, YARICAP } from '../src/tema/golgeler';
import { RENK } from '../src/tema/renkler';
import { BOYUT } from '../src/tema/yazitipi';

export default function AnaEkran() {
  const yonlendir = useRouter();
  const kenar = useSafeAreaInsets();
  const yeniOyun = oyunDeposu((d) => d.yeniOyun);
  const titresimAcik = oyunDeposu((d) => d.ayarlar.titresimAcik);

  return (
    <Zemin>
      <View style={[durum.kok, { paddingTop: kenar.top + 24, paddingBottom: kenar.bottom + 24 }]}>
        <View style={durum.marka}>
          <View style={[durum.logoKart, KART_GOLGE]}>
            <View style={durum.logoBant} />
            <View style={[durum.logoCizgi, durum.logoAna]} />
            <View style={[durum.logoCizgi, { top: 50 }]} />
            <View style={[durum.logoCizgi, { top: 61, right: 24 }]} />
            <View style={[durum.logoCizgi, { top: 72, right: 32 }]} />
          </View>

          <Yazi tur="baslik" boyut={BOYUT.devasa + 10} renk={RENK.pirinc}>
            NafuTabu
          </Yazi>
          <Yazi tur="cokKalin" boyut={BOYUT.kucuk} renk={RENK.sis} harfAraligi={3.2}>
            ANLAT BAKALIM
          </Yazi>

          <Yazi
            boyut={BOYUT.notr}
            renk={RENK.sis}
            ortala
            style={durum.aciklama}
          >
            Kelimeyi anlat, yasaklı beşine değme. Telefon anlatanda,
            rakip omzunun üstünden bakar.
          </Yazi>
        </View>

        <View style={durum.menu}>
          <Buton
            metin="Yeni Oyun"
            ikon="play"
            titresimAcik={titresimAcik}
            onPress={() => {
              yeniOyun();
              yonlendir.push('/kurulum/takimlar');
            }}
          />
          <Buton
            metin="Nasıl Oynanır"
            ikon="book-open-text"
            ikincil
            titresimAcik={titresimAcik}
            onPress={() => yonlendir.push('/nasil-oynanir')}
          />
        </View>
      </View>
    </Zemin>
  );
}

const durum = StyleSheet.create({
  kok: { flex: 1, paddingHorizontal: 22 },
  marka: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  logoKart: {
    width: 74,
    height: 96,
    borderRadius: YARICAP.kucuk,
    backgroundColor: RENK.kart,
    marginBottom: BOSLUK.orta,
    transform: [{ rotate: '-7deg' }],
    overflow: 'hidden',
  },
  logoBant: { height: 16, backgroundColor: RENK.kartBant },
  logoCizgi: {
    position: 'absolute',
    left: 11,
    right: 11,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DCCDB4',
  },
  logoAna: { top: 32, right: 26, height: 8, backgroundColor: RENK.metinAna },
  aciklama: { maxWidth: 290, marginTop: BOSLUK.orta },
  menu: { gap: BOSLUK.notr },
});
