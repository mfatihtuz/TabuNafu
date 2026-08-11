#!/usr/bin/env python3
"""
Ses dogrulamasi.

Sesleri duyamadigimiz icin tasarimin gercekten kagit uzerindeki gibi
ciktigini olcerek kontrol ederiz.

Genel perde takibi (otokorelasyon) marimbada guvenilir degil: 2. kismi
ton tam 4x'te oldugu icin alt harmonige kilitleniyor. Bunun yerine
BEKLENEN frekanslara bakan Goertzel suzgeci kullanilir - hangi notayi
aradigimizi bildigimiz icin en kesin yontem budur.

Kontroller:
  1  Arpej notalari tasarlanan SIRAYLA giriyor mu
  2  Seviyeler hedefte mi (aralarinda ses sicramasi olmasin)
  3  Kirpma var mi
  4  Basta ve sonda cit sesi olusturacak sicrama var mi
  5  Sessiz dosya var mi

Calistirma:  python3 scripts/test-ses.py
"""

import math
import os
import struct
import sys
import wave

SR = 44100
SES_KLASORU = os.path.join(os.path.dirname(__file__), "..", "assets", "ses")

# Her sesin icinde arandigi notalar ve beklenen giris sirasi
BEKLENEN_DIZI = {
    "dogru":   [("F5", 698.46), ("A5", 880.00), ("C6", 1046.50)],
    "basla":   [("C5", 523.25), ("G5", 783.99), ("C6", 1046.50)],
    "sonkart": [("D5", 587.33), ("G5", 783.99), ("D6", 1174.66)],
    "yanlis":  [("G3", 196.00), ("Eb3", 155.56)],
}

HEDEF_RMS = {
    "dogru": 0.150, "yanlis": 0.150, "pas": 0.120, "tik": 0.062,
    "gerisayim": 0.115, "basla": 0.150, "korna": 0.185, "sonkart": 0.155,
}

sorun = 0


def bildir(gecti, ad, ek=""):
    global sorun
    print(f"  {'TAMAM' if gecti else 'SORUN'}  {ad}" + (f"   {ek}" if ek else ""))
    if not gecti:
        sorun += 1


def oku(yol):
    with wave.open(yol, "rb") as d:
        n = d.getnframes()
        return [x / 32768.0 for x in struct.unpack(f"<{n}h", d.readframes(n))]


def goertzel(pencere, frekans):
    """Tek frekansta enerji. Aradigimiz notayi bildigimiz icin en kesin olcum."""
    n = len(pencere)
    if n < 64:
        return 0.0
    k = 2.0 * math.cos(2.0 * math.pi * frekans / SR)
    s1 = s2 = 0.0
    for v in pencere:
        s0 = v + k * s1 - s2
        s2, s1 = s1, s0
    return math.sqrt(max(0.0, s1 * s1 + s2 * s2 - k * s1 * s2)) / n


def tepe_ani(veri, frekans, pencere_ms=50):
    """Verilen frekansin en guclu oldugu an (ms)."""
    p = int(SR * pencere_ms / 1000)
    adim = p // 3
    en_iyi_t, en_iyi_g = 0.0, -1.0
    for bas in range(0, max(1, len(veri) - p), adim):
        g = goertzel(veri[bas:bas + p], frekans)
        if g > en_iyi_g:
            en_iyi_g, en_iyi_t = g, bas / SR * 1000
    return en_iyi_t, en_iyi_g


def main():
    print("\nSes dogrulamasi\n")

    dosyalar = sorted(f for f in os.listdir(SES_KLASORU) if f.endswith(".wav"))
    if not dosyalar:
        sys.exit("assets/ses bos - once build-sounds.py calistir")

    # --- 1. Arpej sirasi ---
    print("  Nota sirasi (Goertzel)")
    for ad, notalar in BEKLENEN_DIZI.items():
        yol = os.path.join(SES_KLASORU, ad + ".wav")
        if not os.path.exists(yol):
            bildir(False, f"{ad} dosyasi yok")
            continue
        veri = oku(yol)
        anlar = [(nota, *tepe_ani(veri, f)) for nota, f in notalar]
        sirali = all(anlar[i][1] <= anlar[i + 1][1] + 25 for i in range(len(anlar) - 1))
        iz = " -> ".join(f"{n}@{t:.0f}ms" for n, t, _ in anlar)
        bildir(sirali, f"{ad:9s} notalar sırayla giriyor", iz)

    # --- 2-5. Genel saglik ---
    print("\n  Genel")
    seviyeler = []
    for f in dosyalar:
        ad = f[:-4]
        veri = oku(os.path.join(SES_KLASORU, f))
        if not veri:
            bildir(False, f"{ad} bos dosya")
            continue
        tepe = max(abs(x) for x in veri)
        rms = math.sqrt(sum(x * x for x in veri) / len(veri))
        seviyeler.append((ad, rms, tepe, veri))

    kirpan = [a for a, _, t, _ in seviyeler if t >= 0.999]
    bildir(not kirpan, "Hiçbir seste kırpma yok", ", ".join(kirpan))

    sessiz = [a for a, r, _, _ in seviyeler if r < 0.01]
    bildir(not sessiz, "Sessiz dosya yok", ", ".join(sessiz))

    citli = [a for a, _, _, v in seviyeler if abs(v[0]) > 0.02 or abs(v[-1]) > 0.02]
    bildir(not citli, "Başta/sonda çıt sesi yok", ", ".join(citli))

    sapan = [f"{a} {r:.3f}≠{HEDEF_RMS[a]:.3f}"
             for a, r, _, _ in seviyeler
             if a in HEDEF_RMS and abs(r - HEDEF_RMS[a]) / HEDEF_RMS[a] > 0.06]
    bildir(not sapan, "Seviyeler hedefte, aralarında sıçrama yok", ", ".join(sapan))

    kisa = [f"{a} {len(v) / SR * 1000:.0f}ms" for a, _, _, v in seviyeler
            if len(v) / SR < 0.15 and a != "tik"]
    bildir(not kisa, "Çok kısa ses yok (tik hariç)", ", ".join(kisa))

    print("\n" + "=" * 56)
    if sorun:
        print(f"{sorun} sorun bulundu.")
        sys.exit(1)
    print("Ses seti ölçüm kontrollerinden geçti.")
    print("Tını değerlendirmesi kulakla yapılmalı - ölçüm bunu kapsamaz.")


if __name__ == "__main__":
    main()
