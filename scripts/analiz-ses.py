#!/usr/bin/env python3
"""
Ses adayi analizi.

Kenney CC0 paketindeki adaylari OLCEREK degerlendirir. Kulakla secim
yapamadigimiz icin her sesin fiziksel ozelliklerine bakariz:

  sure          cok kisa olan aksiyon sesi, uzun olan tur bitisi icin uygun
  tepe/RMS      seviye tutarliligi
  parlaklik     spektral merkez (Hz). Yuksek = tiz/parlak, dusuk = boguk/agir
  perde yonu    ses boyunca merkez frekans yukseliyor mu asagi mi iniyor mu
                yukselen = olumlu/acilma, alcalan = olumsuz/kapanma
  gurultululuk  sifir gecis orani. Yuksek = gurultulu/vurmali, dusuk = tonlu

Boylece "dogru" icin yukselen ve parlak, "yanlis" icin alcalan ve boguk
bir ses secebiliriz - tahminle degil olcumle.

Calistirma:  python3 scripts/analiz-ses.py <klasor> [desen]
"""

import cmath
import math
import os
import struct
import sys
import wave


def oku(yol):
    """WAV dosyasini -1..1 arasi mono ornek listesine cevirir."""
    with wave.open(yol, "rb") as d:
        kanal = d.getnchannels()
        genislik = d.getsampwidth()
        hiz = d.getframerate()
        ham = d.readframes(d.getnframes())
    if genislik != 2:
        return None, hiz
    ornek = struct.unpack(f"<{len(ham) // 2}h", ham)
    if kanal == 2:                                  # stereo -> mono
        ornek = [(ornek[i] + ornek[i + 1]) / 2 for i in range(0, len(ornek) - 1, 2)]
    return [x / 32768.0 for x in ornek], hiz


def dft_merkez(pencere, hiz):
    """
    Pencerenin spektral merkezini (agirlik merkezi frekansi) dondurur.
    Basit DFT - pencere kucuk tutuldugu icin yeterince hizli.
    """
    n = len(pencere)
    if n < 32:
        return 0.0
    # 2'nin kuvvetine indir, hizli olsun
    boy = 1
    while boy * 2 <= n:
        boy *= 2
    boy = min(boy, 1024)
    x = pencere[:boy]
    # Hann penceresi - sizinti azalt
    x = [v * (0.5 - 0.5 * math.cos(2 * math.pi * i / boy)) for i, v in enumerate(x)]

    agirlik = 0.0
    toplam = 0.0
    adim = max(1, boy // 128)                       # 128 frekans noktasi yeter
    for k in range(1, boy // 2, adim):
        gercek = sanal = 0.0
        for i in range(0, boy, 4):                  # 4'te 1 ornekle - yaklasik
            aci = -2 * math.pi * k * i / boy
            gercek += x[i] * math.cos(aci)
            sanal += x[i] * math.sin(aci)
        buyukluk = math.hypot(gercek, sanal)
        frekans = k * hiz / boy
        agirlik += frekans * buyukluk
        toplam += buyukluk
    return agirlik / toplam if toplam > 1e-9 else 0.0


def sifir_gecis(veri):
    """Sifir gecis orani. Gurultulu seslerde yuksek, tonlu seslerde dusuk."""
    if len(veri) < 2:
        return 0.0
    gecis = sum(1 for i in range(1, len(veri))
                if (veri[i - 1] >= 0) != (veri[i] >= 0))
    return gecis / len(veri)


def analiz(yol):
    veri, hiz = oku(yol)
    if not veri:
        return None
    n = len(veri)
    sure = n / hiz
    tepe = max(abs(x) for x in veri)
    rms = math.sqrt(sum(x * x for x in veri) / n)

    # Sesin ilk ve son ucte birinin parlakligi -> perde yonu
    ucte = max(64, n // 3)
    bas = dft_merkez(veri[:ucte], hiz)
    son_bas = max(0, n - ucte)
    son = dft_merkez(veri[son_bas:], hiz)
    orta = dft_merkez(veri[n // 3: 2 * n // 3], hiz)

    yon = "duz"
    if son > bas * 1.18:
        yon = "yukselen"
    elif bas > son * 1.18:
        yon = "alcalan"

    return {
        "ad": os.path.basename(yol),
        "sure": round(sure * 1000),
        "tepe": round(tepe, 2),
        "rms": round(rms, 3),
        "parlaklik": round(orta),
        "yon": yon,
        "gurultu": round(sifir_gecis(veri), 3),
    }


def main():
    klasor = sys.argv[1] if len(sys.argv) > 1 else "."
    desen = sys.argv[2] if len(sys.argv) > 2 else ""

    dosyalar = []
    for kok, _, adlar in os.walk(klasor):
        for a in adlar:
            if a.endswith(".wav") and desen in a:
                dosyalar.append(os.path.join(kok, a))
    dosyalar.sort()

    print(f"{'dosya':26s} {'sure':>6s} {'tepe':>5s} {'RMS':>6s} "
          f"{'parlak':>7s} {'yon':>9s} {'gurultu':>8s}")
    print("-" * 74)
    for yol in dosyalar:
        s = analiz(yol)
        if s:
            print(f"{s['ad']:26s} {s['sure']:5d}ms {s['tepe']:5.2f} {s['rms']:6.3f} "
                  f"{s['parlaklik']:6d}Hz {s['yon']:>9s} {s['gurultu']:8.3f}")


if __name__ == "__main__":
    main()
