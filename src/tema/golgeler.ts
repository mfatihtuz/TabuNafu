/**
 * Golgeler ve derinlik.
 *
 * "Hafif 3D" icin gercek 3D motor kullanilmiyor - pil yakar. Bunun
 * yerine katmanli golge, perspektif donusumu ve basili-derinlik
 * efekti kullaniliyor.
 */

import { Platform } from 'react-native';
import { RENK } from './renkler';

/** Kartin masaya oturmus hissi. */
export const KART_GOLGE = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 26,
  },
  android: { elevation: 16 },
  default: {},
});

export const PANEL = {
  backgroundColor: RENK.yuzey,
  borderWidth: 1.5,
  borderColor: RENK.cizgi,
  borderRadius: 20,
} as const;

export const YARICAP = {
  kucuk: 12,
  orta: 15,
  normal: 20,
  buyuk: 26,
  tam: 999,
} as const;

export const BOSLUK = {
  minik: 4,
  kucuk: 8,
  notr: 12,
  orta: 16,
  buyuk: 22,
  devasa: 32,
} as const;

/**
 * Ekranlarin yan boslugu.
 *
 * Kenara kadar akan yatay raylar bunu kendi ic bosluklari olarak kullanir.
 * Sabit olmasinin sebebi su: ray sayfa boslugunu negatif marjla asmaya
 * calisirsa ust ScrollView onu kendi sinirinda kirpar ve pullar ortasindan
 * kesik gorunur. Onun yerine sayfa boslugunu tek tek ogeler tasir, rayin
 * kendisi tam genislikte kalir.
 */
export const SAYFA_YAN = 22;
