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

/**
 * Her ses icin kac calar tutulacagi.
 *
 * Tek calarla ust uste basilinca onceki calma seekTo(0) ile ortasindan
 * kesiliyor ve ses "tam cikmamis" gibi duyuluyordu. Havuzdaki calarlar
 * sirayla kullanilinca iki basma iki ayri calarda calisir, sesler
 * birbirini kesmeden ust uste biner.
 *
 * Ucu yetiyor: en hizli basma bile ses suresinden kisa araliklarla ucten
 * fazla ust uste gelmiyor.
 */
const HAVUZ_BOYU = 3;

const calarlar = new Map<SesAdi, AudioPlayer[]>();
const siradaki = new Map<SesAdi, number>();
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
    const havuz: AudioPlayer[] = [];
    for (let i = 0; i < HAVUZ_BOYU; i++) {
      try {
        havuz.push(createAudioPlayer(KAYNAKLAR[ad]));
      } catch {
        // Tek bir calar acilamazsa havuzdaki digerleri yeter
      }
    }
    calarlar.set(ad, havuz);
    siradaki.set(ad, 0);
  }
}

/**
 * Sesi bastan calar.
 *
 * Havuzdaki calarlar sirayla kullanilir, boylece ust uste basmalarda
 * sesler birbirini kesmez - iki dogru arka arkaya basildiginda ikisi de
 * tam duyulur.
 */
export function sesCal(ad: SesAdi, acikMi: boolean): void {
  if (!acikMi) return;
  const havuz = calarlar.get(ad);
  if (!havuz || havuz.length === 0) return;

  const sira = (siradaki.get(ad) ?? 0) % havuz.length;
  siradaki.set(ad, sira + 1);

  const calar = havuz[sira];
  if (!calar) return;
  try {
    // Bu calar daha once kullanildiysa sonunda duruyordur, basa sar
    calar.seekTo(0);
    calar.play();
  } catch {
    // Ses calinamazsa oyun akisi durmamali
  }
}

/** Uygulama kapanirken bellegi birak. */
export function sesleriBirak(): void {
  for (const havuz of calarlar.values()) {
    for (const calar of havuz) {
      try {
        calar.remove();
      } catch {
        // Zaten birakilmis olabilir
      }
    }
  }
  calarlar.clear();
  siradaki.clear();
  hazirlandi = false;
}
