#!/usr/bin/env python3
"""
Uygulama ikonu ve acilis ekrani gorseli ureteci.

Disaridan kutuphane kullanmaz - PNG dosyasini bayt bayt kendisi yazar
(zlib standart kutuphanede var). Boylece depoya ikili gorsel dosyasi
elle eklemek gerekmiyor, ikon kaynak koddan uretiliyor.

Cizim: koyu ceviz zemin uzerinde pirinc bantli fildisi oyun karti.
Uygulamanin kendi gorsel dilinden geliyor.

Cikti:
  assets/ikon.png          1024x1024  uygulama ikonu
  assets/uyarlanabilir.png 1024x1024  Android adaptive icon on plan
  assets/acilis.png        1284x2778  acilis ekrani

Calistirma:  python3 scripts/build-ikon.py
"""

import math
import os
import struct
import zlib

KOK = os.path.join(os.path.dirname(__file__), "..")
CIKTI = os.path.join(KOK, "assets")

# Palet - src/tema/renkler.ts ile ayni
ZEMIN_UST = (0x1F, 0x19, 0x13)
ZEMIN_ALT = (0x41, 0x32, 0x21)
KART = (0xF7, 0xF0, 0xE1)
KART_GOLGE = (0xDB, 0xCD, 0xB0)
PIRINC = (0xD4, 0xA0, 0x50)
METIN = (0x17, 0x12, 0x0A)
METIN_ALT = (0x5C, 0x4A, 0x33)


class Tuval:
    """Basit RGB tuvali. Her piksel bir uclu (r, g, b)."""

    def __init__(self, genislik, yukseklik, arka=(0, 0, 0)):
        self.g = genislik
        self.y = yukseklik
        self.p = [list(arka) for _ in range(genislik * yukseklik)]

    def nokta(self, x, y, renk, alfa=1.0):
        if not (0 <= x < self.g and 0 <= y < self.y):
            return
        i = y * self.g + x
        if alfa >= 1.0:
            self.p[i] = list(renk)
            return
        eski = self.p[i]
        self.p[i] = [int(eski[k] + (renk[k] - eski[k]) * alfa) for k in range(3)]

    def dikey_gecis(self, ust, alt):
        for y in range(self.y):
            t = y / max(1, self.y - 1)
            renk = tuple(int(ust[k] + (alt[k] - ust[k]) * t) for k in range(3))
            for x in range(self.g):
                self.p[y * self.g + x] = list(renk)

    def yuvarlak_dikdortgen(self, x0, y0, x1, y1, r, renk):
        """Kenar yumusatmali yuvarlak kose dikdortgen."""
        for y in range(max(0, int(y0) - 2), min(self.y, int(y1) + 3)):
            for x in range(max(0, int(x0) - 2), min(self.g, int(x1) + 3)):
                # Merkeze en yakin kose noktasina uzaklik
                dx = max(x0 + r - x, 0, x - (x1 - r))
                dy = max(y0 + r - y, 0, y - (y1 - r))
                uzaklik = math.hypot(dx, dy)
                if uzaklik <= r - 0.5:
                    self.nokta(x, y, renk)
                elif uzaklik < r + 0.5:
                    self.nokta(x, y, renk, r + 0.5 - uzaklik)

    def isik_havuzu(self, mx, my, yaricap, renk, guc=0.22):
        """Masaya dusen lamba isigi."""
        for y in range(self.y):
            for x in range(self.g):
                u = math.hypot(x - mx, y - my)
                if u >= yaricap:
                    continue
                a = (1 - u / yaricap) ** 2 * guc
                self.nokta(x, y, renk, a)

    def yaz(self, yol):
        ham = bytearray()
        for y in range(self.y):
            ham.append(0)                       # filtre baytı
            for x in range(self.g):
                ham.extend(self.p[y * self.g + x])

        def parca(etiket, veri):
            return (struct.pack(">I", len(veri)) + etiket + veri
                    + struct.pack(">I", zlib.crc32(etiket + veri) & 0xFFFFFFFF))

        png = (b"\x89PNG\r\n\x1a\n"
               + parca(b"IHDR", struct.pack(">IIBBBBB", self.g, self.y, 8, 2, 0, 0, 0))
               + parca(b"IDAT", zlib.compress(bytes(ham), 9))
               + parca(b"IEND", b""))
        os.makedirs(os.path.dirname(yol), exist_ok=True)
        with open(yol, "wb") as d:
            d.write(png)
        return len(png)


def kart_ciz(tuval, mx, my, kart_g, kart_y):
    """Pirinc bantli fildisi oyun karti, hafif egik."""
    x0, y0 = mx - kart_g / 2, my - kart_y / 2
    x1, y1 = mx + kart_g / 2, my + kart_y / 2
    r = kart_g * 0.11

    # Golge - kartin masaya oturdugu hissi
    kayma = kart_g * 0.045
    tuval.yuvarlak_dikdortgen(x0 + kayma, y0 + kayma * 1.6,
                              x1 + kayma, y1 + kayma * 1.6, r, (0x0D, 0x0A, 0x06))

    tuval.yuvarlak_dikdortgen(x0, y0, x1, y1, r, KART)

    # Ust bant
    bant_y = y0 + kart_y * 0.14
    tuval.yuvarlak_dikdortgen(x0, y0, x1, bant_y, r, PIRINC)
    tuval.yuvarlak_dikdortgen(x0, bant_y - r, x1, bant_y, 0, PIRINC)

    # Ana kelime cizgisi - kalin ve koyu
    ic = kart_g * 0.16
    ana_y = y0 + kart_y * 0.30
    tuval.yuvarlak_dikdortgen(x0 + ic, ana_y, x1 - ic, ana_y + kart_y * 0.075,
                              kart_y * 0.035, METIN)

    # Ayrac
    ayrac_y = y0 + kart_y * 0.44
    tuval.yuvarlak_dikdortgen(x0 + ic * 0.75, ayrac_y, x1 - ic * 0.75,
                              ayrac_y + kart_y * 0.012, kart_y * 0.006, KART_GOLGE)

    # Yasakli kelime cizgileri
    for k in range(4):
        cy = y0 + kart_y * (0.545 + k * 0.098)
        genislik_orani = [0.62, 0.74, 0.56, 0.68][k]
        yari = (kart_g - ic * 1.5) * genislik_orani / 2
        tuval.yuvarlak_dikdortgen(mx - yari, cy, mx + yari, cy + kart_y * 0.045,
                                  kart_y * 0.022, METIN_ALT)


def ikon_uret(boyut, kart_orani):
    t = Tuval(boyut, boyut)
    t.dikey_gecis(ZEMIN_UST, ZEMIN_ALT)
    t.isik_havuzu(boyut / 2, boyut * 0.34, boyut * 0.78, (0xE8, 0xB4, 0x60), 0.20)
    kart_g = boyut * kart_orani
    kart_ciz(t, boyut / 2, boyut / 2, kart_g, kart_g * 1.32)
    return t


def acilis_uret(g, y):
    t = Tuval(g, y)
    t.dikey_gecis(ZEMIN_UST, ZEMIN_ALT)
    t.isik_havuzu(g / 2, y * 0.38, max(g, y) * 0.62, (0xE8, 0xB4, 0x60), 0.18)
    kart_g = g * 0.30
    kart_ciz(t, g / 2, y * 0.44, kart_g, kart_g * 1.32)
    return t


def main():
    print("NafuTabu ikon ureteci\n")
    isler = [
        ("ikon.png", ikon_uret(1024, 0.52)),
        # Android uyarlanabilir ikonda kenarlar kirpilir, kart daha kucuk
        ("uyarlanabilir.png", ikon_uret(1024, 0.38)),
        ("acilis.png", acilis_uret(1284, 2778)),
    ]
    for ad, tuval in isler:
        yol = os.path.join(CIKTI, ad)
        boyut = tuval.yaz(yol)
        print(f"  {ad:22s} {tuval.g:4d}x{tuval.y:<4d} {boyut / 1024:7.1f} KB")
    print("\n-> assets/")


if __name__ == "__main__":
    main()
