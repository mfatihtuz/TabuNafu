/**
 * Ikon seti.
 *
 * Hepsi tek aileden: Lucide (ISC lisansi). Ayni 24x24 izgara, ayni 2px
 * cizgi kalinligi, ayni kose yuvarlamasi. Boylece 40 simge yan yana
 * dururken uyumsuzluk olmasi imkansiz.
 *
 * Iki tanesi elle cizildi ama ayni cizim dilinde kaldi:
 *   turk-bayragi  cerceve cizgili, ay-yildiz dolu
 *   hilal         Din Kulturu icin tek basina hilal
 *
 * Bu dosya scripts/build-ikonlar.py ile uretilir, elle duzenlenmez.
 */

import type { ReactElement } from 'react';
import { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect, Svg } from 'react-native-svg';

import { RENK } from '../tema/renkler';

export const IKON_GOVDE: Record<string, ReactElement> = {
  'check': (
    <>
      <Path d="M20 6 9 17l-5-5" />
    </>
  ),
  'x': (
    <>
      <Path d="M18 6 6 18" />
      <Path d="m6 6 12 12" />
    </>
  ),
  'chevrons-right': (
    <>
      <Path d="m6 17 5-5-5-5" />
      <Path d="m13 17 5-5-5-5" />
    </>
  ),
  'lock': (
    <>
      <Rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  'play': (
    <>
      <Path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
    </>
  ),
  'settings': (
    <>
      <Path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
      <Circle cx="12" cy="12" r="3" />
    </>
  ),
  'chevron-left': (
    <>
      <Path d="m15 18-6-6 6-6" />
    </>
  ),
  'users': (
    <>
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Path d="M16 3.128a4 4 0 0 1 0 7.744" />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <Circle cx="9" cy="7" r="4" />
    </>
  ),
  'timer': (
    <>
      <Line  />
      <Line  />
      <Circle cx="12" cy="14" r="8" />
    </>
  ),
  'trophy': (
    <>
      <Path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" />
      <Path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" />
      <Path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" />
      <Path d="M4 22h16" />
      <Path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
      <Path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" />
    </>
  ),
  'volume-2': (
    <>
      <Path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
      <Path d="M16 9a5 5 0 0 1 0 6" />
      <Path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
    </>
  ),
  'vibrate': (
    <>
      <Path d="m2 8 2 2-2 2 2 2-2 2" />
      <Path d="m22 8-2 2 2 2-2 2 2 2" />
      <Rect width="8" height="14" x="8" y="5" rx="1" />
    </>
  ),
  'arrow-right': (
    <>
      <Path d="M5 12h14" />
      <Path d="m12 5 7 7-7 7" />
    </>
  ),
  'minus': (
    <>
      <Path d="M5 12h14" />
    </>
  ),
  'plus': (
    <>
      <Path d="M5 12h14" />
      <Path d="M12 5v14" />
    </>
  ),
  'layers': (
    <>
      <Path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
      <Path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
      <Path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
    </>
  ),
  'shapes': (
    <>
      <Path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" />
      <Rect x="3" y="14" width="7" height="7" rx="1" />
      <Circle cx="17.5" cy="17.5" r="3.5" />
    </>
  ),
  'sofa': (
    <>
      <Path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
      <Path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z" />
      <Path d="M4 18v2" />
      <Path d="M20 18v2" />
      <Path d="M12 4v9" />
    </>
  ),
  'utensils-crossed': (
    <>
      <Path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
      <Path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" />
      <Path d="m2.1 21.8 6.4-6.3" />
      <Path d="m19 5-7 7" />
    </>
  ),
  'atom': (
    <>
      <Circle cx="12" cy="12" r="1" />
      <Path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
      <Path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
    </>
  ),
  'brain-circuit': (
    <>
      <Path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <Path d="M9 13a4.5 4.5 0 0 0 3-4" />
      <Path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <Path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <Path d="M6 18a4 4 0 0 1-1.967-.516" />
      <Path d="M12 13h4" />
      <Path d="M12 18h6a2 2 0 0 1 2 2v1" />
      <Path d="M12 8h8" />
      <Path d="M16 8V5a2 2 0 0 1 2-2" />
      <Circle cx="16" cy="13" r=".5" />
      <Circle cx="18" cy="3" r=".5" />
      <Circle cx="20" cy="21" r=".5" />
      <Circle cx="20" cy="8" r=".5" />
    </>
  ),
  'landmark': (
    <>
      <Path d="M10 18v-7" />
      <Path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z" />
      <Path d="M14 18v-7" />
      <Path d="M18 18v-7" />
      <Path d="M3 22h18" />
      <Path d="M6 18v-7" />
    </>
  ),
  'mountain': (
    <>
      <Path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </>
  ),
  'turk-bayragi': (
    <>
      <Rect x="2" y="4.5" width="20" height="15" rx="2.5" />
      <Path d="M13.10 9.03 A4.15 4.15 0 1 0 13.10 14.97 A3.35 3.35 0 1 1 13.10 9.03Z" fill="currentColor" stroke="none" />
      <Path d="M16.60 9.50L17.22 11.15L18.98 11.23L17.60 12.32L18.07 14.02L16.60 13.05L15.13 14.02L15.60 12.32L14.22 11.23L15.98 11.15Z" fill="currentColor" stroke="none" />
    </>
  ),
  'hilal': (
    <>
      <Path d="M17.43 5.33 A8.60 8.60 0 1 0 17.43 18.67 A7.10 7.10 0 1 1 17.43 5.33Z" />
    </>
  ),
  'feather': (
    <>
      <Path d="M14.086 18.412A2 2 0 0112.67 19H5v-7.672a2 2 0 01.586-1.414L11.75 3.75a6 6 0 118.49 8.49z" />
      <Path d="M16 8 2 22" />
      <Path d="M17.488 15H9" />
    </>
  ),
  'clapperboard': (
    <>
      <Path d="m12.296 3.464 3.02 3.956" />
      <Path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z" />
      <Path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Path d="m6.18 5.276 3.1 3.899" />
    </>
  ),
  'guitar': (
    <>
      <Path d="m11.9 12.1 4.514-4.514" />
      <Path d="M20.1 2.3a1 1 0 0 0-1.4 0l-1.114 1.114A2 2 0 0 0 17 4.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 17.828 7h1.344a2 2 0 0 0 1.414-.586L21.7 5.3a1 1 0 0 0 0-1.4z" />
      <Path d="m6 16 2 2" />
      <Path d="M8.23 9.85A3 3 0 0 1 11 8a5 5 0 0 1 5 5 3 3 0 0 1-1.85 2.77l-.92.38A2 2 0 0 0 12 18a4 4 0 0 1-4 4 6 6 0 0 1-6-6 4 4 0 0 1 4-4 2 2 0 0 0 1.85-1.23z" />
    </>
  ),
  'trending-up': (
    <>
      <Path d="M16 7h6v6" />
      <Path d="m22 7-8.5 8.5-5-5L2 17" />
    </>
  ),
  'volleyball': (
    <>
      <Path d="M11 7a16 16 20 0 1 10.98 4.362" />
      <Path d="M12 12a13 13 0 0 1-8.66 5" />
      <Path d="M16.83 13.634a16 16 0 0 1-9.267 7.328" />
      <Path d="M20.66 17A13 13 0 0 0 12 12a13 13 0 0 1 0-10" />
      <Path d="M8.17 15.366a16 16 0 0 1-1.713-11.69" />
      <Circle cx="12" cy="12" r="10" />
    </>
  ),
  'shield-half': (
    <>
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <Path d="M12 22V2" />
    </>
  ),
  'briefcase': (
    <>
      <Path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <Rect width="20" height="14" x="2" y="6" rx="2" />
    </>
  ),
  'stethoscope': (
    <>
      <Path d="M11 2v2" />
      <Path d="M5 2v2" />
      <Path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
      <Path d="M8 15a6 6 0 0 0 12 0v-3" />
      <Circle cx="20" cy="10" r="2" />
    </>
  ),
  'dices': (
    <>
      <Rect width="12" height="12" x="2" y="10" rx="2" ry="2" />
      <Path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" />
      <Path d="M6 18h.01" />
      <Path d="M10 14h.01" />
      <Path d="M15 6h.01" />
      <Path d="M18 9h.01" />
    </>
  ),
  'plane': (
    <>
      <Path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </>
  ),
  'graduation-cap': (
    <>
      <Path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <Path d="M22 10v6" />
      <Path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </>
  ),
  'shuffle': (
    <>
      <Path d="m18 14 4 4-4 4" />
      <Path d="m18 2 4 4-4 4" />
      <Path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" />
      <Path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" />
      <Path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" />
    </>
  ),
  'scroll-text': (
    <>
      <Path d="M15 12h-5" />
      <Path d="M15 8h-5" />
      <Path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <Path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
    </>
  ),
  'book-open-text': (
    <>
      <Path d="M12 5v16" />
      <Path d="M16 13h2" />
      <Path d="M16 9h2" />
      <Path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />
      <Path d="M6 13h2" />
      <Path d="M6 9h2" />
    </>
  ),
  'house': (
    <>
      <Path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <Path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </>
  ),
};

export type IkonAdi = keyof typeof IKON_GOVDE;

type IkonOzellikleri = {
  ad: string;
  boyut?: number;
  renk?: string;
  cizgiKalinligi?: number;
};

/**
 * Not: Turk bayragi ikonunda ay-yildiz dolu cizilmis ve fill="currentColor"
 * kullaniyor. react-native-svg bunu ancak Svg elemaninda color prop'u
 * verilirse cozer - asagida veriliyor.
 */
export function Ikon({
  ad,
  boyut = 24,
  renk = RENK.fildisi,
  cizgiKalinligi = 2,
}: IkonOzellikleri) {
  const govde = IKON_GOVDE[ad];
  if (!govde) return null;
  return (
    <Svg
      width={boyut}
      height={boyut}
      viewBox="0 0 24 24"
      fill="none"
      color={renk}
      stroke={renk}
      strokeWidth={cizgiKalinligi}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {govde}
    </Svg>
  );
}
