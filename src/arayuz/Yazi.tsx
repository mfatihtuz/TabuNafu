/**
 * Metin bileseni.
 *
 * Dogrudan Text kullanmak yerine bu bilesen kullanilir cunku:
 *   - Yazi tipi ve renk tek yerden gelir
 *   - Turkce harflerin alt kuyruklari icin satir yuksekligi payi otomatik
 *   - Kullanicinin sistem yazi boyutu ayari kartlari bozmasin diye sinirli
 */

import { Text, type TextProps, type TextStyle } from 'react-native';

import { RENK } from '../tema/renkler';
import { BOYUT, SATIR, YAZI } from '../tema/yazitipi';

type YaziTuru = 'baslik' | 'baslikOrta' | 'govde' | 'kalin' | 'cokKalin';

const AILE: Record<YaziTuru, string> = {
  baslik: YAZI.baslik,
  baslikOrta: YAZI.baslikOrta,
  govde: YAZI.govde,
  kalin: YAZI.govdeKalin,
  cokKalin: YAZI.govdeCokKalin,
};

type YaziOzellikleri = TextProps & {
  tur?: YaziTuru;
  boyut?: number;
  renk?: string;
  satir?: number;
  ortala?: boolean;
  harfAraligi?: number;
};

export function Yazi({
  tur = 'govde',
  boyut = BOYUT.govde,
  renk = RENK.fildisi,
  satir = SATIR.normal,
  ortala = false,
  harfAraligi,
  style,
  ...kalan
}: YaziOzellikleri) {
  const temel: TextStyle = {
    fontFamily: AILE[tur],
    fontSize: boyut,
    color: renk,
    // Turkce kuyruklar (S, C, G) kirpilmasin diye satir yuksekligi bol
    lineHeight: boyut * satir,
    textAlign: ortala ? 'center' : 'auto',
  };
  if (harfAraligi !== undefined) temel.letterSpacing = harfAraligi;

  return (
    <Text
      // Sistem yazi boyutu ayari kart duzenini bozmasin
      maxFontSizeMultiplier={1.25}
      style={[temel, style]}
      {...kalan}
    />
  );
}

/** Kucuk, harf araligi acik, buyuk harf ust yazi. */
export function UstYazi({ style, ...kalan }: YaziOzellikleri) {
  return (
    <Yazi
      tur="cokKalin"
      boyut={BOYUT.kucuk - 1}
      renk={RENK.pirinc}
      harfAraligi={1.6}
      style={style}
      {...kalan}
    />
  );
}
