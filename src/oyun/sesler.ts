/**
 * Ses calma.
 *
 * Sesler marimba modeliyle uretiliyor (scripts/build-sounds.py).
 * Hepsi tek calgidan geldigi icin aralarinda stil uyumsuzlugu yok.
 *
 * Sekiz ses onceden yuklenir ve bellekte tutulur. Kart gecisi cok
 * hizli oldugu icin her basista dosya acilsaydi ses gecikirdi.
 */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

export type SesAdi =
  | 'dogru'
  | 'yanlis'
  | 'pas'
  | 'tik'
  | 'gerisayim'
  | 'basla'
  | 'korna'
  | 'sonkart';

/**
 * Statik esleme. React Native paketleyicisi dinamik require desteklemez,
 * yol derleme aninda bilinmeli.
 */
const KAYNAKLAR: Record<SesAdi, number> = {
  dogru: require('../../assets/ses/dogru.wav'),
  yanlis: require('../../assets/ses/yanlis.wav'),
  pas: require('../../assets/ses/pas.wav'),
  tik: require('../../assets/ses/tik.wav'),
  gerisayim: require('../../assets/ses/gerisayim.wav'),
  basla: require('../../assets/ses/basla.wav'),
  korna: require('../../assets/ses/korna.wav'),
  sonkart: require('../../assets/ses/sonkart.wav'),
};

const calarlar = new Map<SesAdi, AudioPlayer>();
let hazirlandi = false;

/** Uygulama acilisinda bir kez cagrilir. */
export async function sesleriHazirla(): Promise<void> {
  if (hazirlandi) return;
  hazirlandi = true;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      // Oyun sesi muzigi kesmesin, ustune binsin
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
    });
  } catch {
    // Ses kipi ayarlanamazsa oyun yine calisir, sadece sessiz kalabilir
  }

  for (const ad of Object.keys(KAYNAKLAR) as SesAdi[]) {
    try {
      calarlar.set(ad, createAudioPlayer(KAYNAKLAR[ad]));
    } catch {
      // Tek bir ses yuklenemezse digerleri calismaya devam etsin
    }
  }
}

/**
 * Sesi bastan calar.
 * Ust uste basmalarda onceki calma kesilir - kart hizli gecerken
 * sesler birikip cakismasin.
 */
export function sesCal(ad: SesAdi, acikMi: boolean): void {
  if (!acikMi) return;
  const calar = calarlar.get(ad);
  if (!calar) return;
  try {
    calar.seekTo(0);
    calar.play();
  } catch {
    // Ses calinamazsa oyun akisi durmamali
  }
}

/** Uygulama kapanirken bellegi birak. */
export function sesleriBirak(): void {
  for (const calar of calarlar.values()) {
    try {
      calar.remove();
    } catch {
      // Zaten birakilmis olabilir
    }
  }
  calarlar.clear();
  hazirlandi = false;
}
