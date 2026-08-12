/**
 * Basili-derinlik yuvasi.
 *
 * Butonun altinda sabit bir kalinlik durur, buton basilinca onun ustune
 * iner. Fiziksel bir tusa basma hissi verir.
 *
 * NEDEN AYRI BILESEN
 * Bu duzen once borderBottomWidth animasyonuyla yapiliyordu. O bir duzen
 * ozelligi - her karede butonun kutusu yeniden olculuyor, buton anlik
 * kaybolabiliyor. Cozum yuvayi sabit tutup govdeyi transform ile
 * indirmek. Ayni cozum hem Buton hem AksiyonButonu icin gerektigi icin
 * iki yerde birebir kopyalanmisti, buraya toplandi.
 *
 * Kullanan bilesen bastirma degerini (0-1) tutar ve govdeye
 * translateY: bastirma * derinlik uygular.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

type Ozellikler = {
  /** Yuvanin gorunen kalinligi. Govde basilinca bu kadar iner. */
  derinlik: number;
  /** Kalinlik seridinin rengi - govdenin koyu tonu. */
  altRenk: string;
  yaricap: number;
  style?: ViewStyle | ViewStyle[] | false;
  children: ReactNode;
};

export function Yuva({ derinlik, altRenk, yaricap, style, children }: Ozellikler) {
  return (
    <View
      style={[durum.taban, { paddingBottom: derinlik, borderRadius: yaricap }, style]}
    >
      <View style={[durum.kalinlik, { height: derinlik, backgroundColor: altRenk }]} />
      {children}
    </View>
  );
}

const durum = StyleSheet.create({
  // Govdenin oturdugu yuva. Alt boslugu kadar kalinlik gorunur.
  taban: { overflow: 'hidden' },
  // Yuvanin gorunen kalinligi. Govde basilinca ustune iner.
  kalinlik: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
