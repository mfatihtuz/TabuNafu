/**
 * Ortali pencere. Seri bitisi sorusu icin kullanilir.
 *
 * Ekran karartilir ve pencere yaylanarak girer - arkadaki oyun
 * durdu hissi versin.
 */

import { Modal, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Ikon } from '../cizimler/Ikon';
import { BOSLUK, YARICAP } from '../tema/golgeler';
import { RENK } from '../tema/renkler';
import { BOYUT } from '../tema/yazitipi';
import { Buton } from './Buton';
import { Yazi } from './Yazi';

type Ozellikler = {
  acik: boolean;
  ikon: string;
  ikonRenk?: string;
  baslik: string;
  metin: string;
  birinci: string;
  ikinci?: string;
  titresimAcik?: boolean;
  onBirinci: () => void;
  onIkinci?: () => void;
};

export function Modal3D({
  acik,
  ikon,
  ikonRenk = RENK.pas,
  baslik,
  metin,
  birinci,
  ikinci,
  titresimAcik = true,
  onBirinci,
  onIkinci,
}: Ozellikler) {
  return (
    <Modal
      visible={acik}
      transparent
      animationType="fade"
      statusBarTranslucent
      // Android donanim geri tusu - basilinca birinci secenege denk gelir.
      // Verilmezse RN geri tusunu yutar ve pencere kapanmaz.
      onRequestClose={onBirinci}
    >
      <View style={durum.ortu}>
        <Animated.View entering={ZoomIn.duration(300)} style={durum.pencere}>
          <View style={[durum.ikon, { backgroundColor: ikonRenk }]}>
            <Ikon ad={ikon} boyut={30} renk={RENK.sariUstu} cizgiKalinligi={2.4} />
          </View>

          <Yazi tur="baslik" boyut={BOYUT.buyuk + 3} ortala>{baslik}</Yazi>
          <Yazi boyut={BOYUT.notr} renk={RENK.sis} ortala>{metin}</Yazi>

          <View style={durum.butonlar}>
            {/* Bos etiketli buton cizilmez - cark gibi kendiliginden
                kapanan pencerelerde dugmeye gerek yok */}
            {birinci ? (
              <Buton metin={birinci} titresimAcik={titresimAcik} onPress={onBirinci} />
            ) : null}
            {ikinci && onIkinci ? (
              <Buton metin={ikinci} ikincil titresimAcik={titresimAcik} onPress={onIkinci} />
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const durum = StyleSheet.create({
  ortu: {
    flex: 1,
    backgroundColor: RENK.ortu,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  pencere: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#3B3022',
    borderWidth: 1.5,
    borderColor: 'rgba(245,234,218,0.2)',
    borderRadius: YARICAP.buyuk,
    padding: 24,
    alignItems: 'center',
    gap: BOSLUK.notr + 3,
  },
  ikon: {
    width: 60,
    height: 60,
    borderRadius: YARICAP.normal - 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  butonlar: { width: '100%', gap: BOSLUK.kucuk + 1 },
});
