/**
 * Surum damgasini uretir.
 *
 * NEDEN GEREKLI
 * Ilk cihaz testinde duzeltilmis hatalar "hala duruyor" gorundu. Sebep
 * kodun yanlis olmasi degildi - telefondaki paket eski koddan derlenmisti.
 * Ekranda hangi kodun calistigi yazmadigi icin bunu anlamak zor oldu.
 *
 * NEDEN COMMIT HASH'I DEGIL
 * Iki sebep. Birincisi damga kendi commit'ini iceremez, hep bir adim
 * geride kalir. Ikincisi EAS bulutta derlerken git gecmisi bulunmayabilir -
 * damganin en cok gerektigi yer tam da orasi.
 *
 * Onun yerine kaynak dosyalarin icerigi ozetlenir. Ayni kod her yerde ayni
 * damgayi verir, kod degisince damga da degisir, git'e ihtiyac yoktur.
 *
 * Kullanim:
 *   node scripts/surum-yaz.mjs
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const DAMGA_YOLU = join(KOK, 'src', 'surum.ts');

/** Ozete girecek klasorler - ekranlar, bilesenler ve kelime destesi. */
const KLASORLER = ['app', 'src', 'assets/kelimeler'];
const UZANTILAR = ['.ts', '.tsx', '.json'];

/** Klasoru derinlemesine gezer, sirali dosya listesi dondurur. */
function dosyalar(klasor) {
  const bulunan = [];
  function gez(yol) {
    for (const ad of readdirSync(yol).sort()) {
      const tam = join(yol, ad);
      if (statSync(tam).isDirectory()) gez(tam);
      else if (UZANTILAR.some((u) => ad.endsWith(u))) bulunan.push(tam);
    }
  }
  gez(join(KOK, klasor));
  return bulunan;
}

const ozet = createHash('sha256');
for (const klasor of KLASORLER) {
  for (const yol of dosyalar(klasor)) {
    // Damganin kendisi ozete girmez - yoksa sonuc kendine bagimli olur
    if (yol === DAMGA_YOLU) continue;
    ozet.update(relative(KOK, yol).replace(/\\/g, '/'));
    ozet.update(readFileSync(yol));
  }
}

const { expo } = JSON.parse(readFileSync(join(KOK, 'app.json'), 'utf-8'));
const yapim = ozet.digest('hex').slice(0, 7);

writeFileSync(
  DAMGA_YOLU,
  `/**
 * Surum damgasi - ELLE DUZENLEME.
 * scripts/surum-yaz.mjs tarafindan uretilir.
 */

/** app.json icindeki surum. */
export const SURUM = '${expo.version}';

/** Kaynak dosyalarin ozeti. Cihazdaki kodu kesin olarak tanimlar. */
export const YAPIM = '${yapim}';
`,
  'utf-8',
);

console.log(`  src/surum.ts  ->  ${expo.version} · ${yapim}`);
