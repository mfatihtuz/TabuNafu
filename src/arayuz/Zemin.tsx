/**
 * Ekran zemini: ceviz tahta ve masaya dusen lamba isigi.
 *
 * Prototipteki tuval cizimi burada degrade katmanlarina cevrildi.
 * Gercek doku yerine degrade kullanilmasinin sebebi performans:
 * her karede yeniden cizilen bir tuval pil yakar.
 */

import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { RENK } from '../tema/renkler';

/**
 * Icerigin cikabilecegi en fazla genislik.
 *
 * Tablette ekran telefonun iki kati - icerik serbest birakilirsa
 * butonlar bir metre uzayip tuhaf gorunuyor ve kart alani cok
 * yayvanlasiyor. Icerik ortada, telefon genisliginde tutuluyor.
 * Zemin degradeleri tam ekran kaliyor.
 */
const EN_FAZLA_GENISLIK = 560;

export function Zemin({ children }: { children: ReactNode }) {
  return (
    <View style={durum.kok}>
      <LinearGradient
        colors={[RENK.zeminUst, RENK.zeminOrta, RENK.zeminAlt]}
        locations={[0, 0.46, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Masanin ustundeki lamba - sicak isik havuzu */}
      <LinearGradient
        colors={['rgba(232,180,96,0.16)', 'rgba(212,160,80,0.03)', 'transparent']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.85 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={durum.icerik}>{children}</View>
    </View>
  );
}

const durum = StyleSheet.create({
  kok: { flex: 1, backgroundColor: RENK.zeminUst },
  icerik: { flex: 1, width: '100%', maxWidth: EN_FAZLA_GENISLIK, alignSelf: 'center' },
});
