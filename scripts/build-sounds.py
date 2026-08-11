#!/usr/bin/env python3
"""
NafuTabu ses ureteci - MARIMBA AILESI.

Butun sesler tek bir calgidan cikar: marimba. Boylece aralarinda stil
uyumsuzlugu olmasi imkansiz. Anlam farki calgi degistirerek degil,
PERDE, ARALIK ve CALIS TEKNIGI degistirerek verilir - gercek bir
perkusyoncunun yapacagi gibi.

  dogru      yukselen major arpej, can tinili tokmak
  yanlis     alcalan agir ikili, bas marimba
  pas        tek notr nota, yumusak tokmak
  tik        cok kisa tiz tap
  gerisayim  yumusak orta nota
  basla      yukselen uclu, parlak
  korna      alcak ikili uzerinde tremolo (marimba rulosu)
  sonkart    hizlanan yukselen dizi

MARIMBA NEDEN AHSAP DUYULUR
Marimba cubugunun kismi tonlari tam kat degildir - yapimci cubugun altini
oyarak 2. kismi tonu 4x, 3. kismi tonu 10x'e akort eder. Asil onemli olan
ise her kismi tonun FARKLI HIZDA sonmesidir: ana ton uzun surer, ustteki
tonlar cok cabuk kaybolur. Hepsine ayni zarfi verirsen ahsap degil
elektronik org duyulur. Ilk denememdeki hata tam olarak buydu.

Modelin parcalari:
  1  Kismi tonlar (1 : 3.99 : 9.2 : 16.4), her biri kendi sonum hiziyla
  2  Tokmak vurusu - tahtaya carpma sesi, kisa filtrelenmis gurultu
  3  Rezonator borusu - ana tonu besleyen, gec baslayan ve gec biten katman
  4  Vurus anindaki kisa perde dususu
  5  Oda yansimalari - ses havada dursun, kuru kalmasin

Cikti: assets/ses/*.wav  (44.1 kHz, 16 bit, mono)
Calistirma:  python3 scripts/build-sounds.py
"""

import math
import os
import struct
import sys
import wave

SR = 44100
CIKTI_KLASORU = os.path.join(os.path.dirname(__file__), "..", "assets", "ses")

HEDEF_RMS = {
    "dogru":     0.150,
    "yanlis":    0.150,
    "pas":       0.120,
    "tik":       0.062,
    "gerisayim": 0.115,
    "basla":     0.150,
    "korna":     0.185,
    "sonkart":   0.155,
}

NOTA = {
    "C2": 65.41,  "E2": 82.41,  "G2": 98.00,  "A2": 110.00,
    "C3": 130.81, "D3": 146.83, "Eb3": 155.56, "E3": 164.81, "G3": 196.00,
    "A3": 220.00, "B3": 246.94,
    "C4": 261.63, "D4": 293.66, "E4": 329.63, "G4": 392.00, "A4": 440.00,
    "C5": 523.25, "D5": 587.33, "E5": 659.25, "F5": 698.46, "G5": 783.99,
    "A5": 880.00,
    "C6": 1046.50, "D6": 1174.66, "E6": 1318.51, "G6": 1567.98, "A6": 1760.00,
    "C7": 2093.00,
}


# ---------------------------------------------------------------------------
# Temel islemler
# ---------------------------------------------------------------------------

def bos(sure):
    return [0.0] * int(SR * sure)


def karistir(hedef, kaynak, baslangic=0.0, kazanc=1.0):
    ofset = int(SR * baslangic)
    n = len(hedef)
    for i, d in enumerate(kaynak):
        j = ofset + i
        if 0 <= j < n:
            hedef[j] += d * kazanc
    return hedef


def gurultu(sure, tohum=1):
    n = int(SR * sure)
    cikti = [0.0] * n
    durum = (tohum * 2654435761) & 0x7FFFFFFF
    for i in range(n):
        durum = (1103515245 * durum + 12345) & 0x7FFFFFFF
        cikti[i] = (durum / 0x3FFFFFFF) - 1.0
    return cikti


SVF_UST_SINIR = SR / 6.0        # Chamberlin yapisinin kararlilik siniri


def alcak_gecir(veri, kesim, rezonans=0.9):
    f = 2.0 * math.sin(math.pi * min(kesim, SVF_UST_SINIR) / SR)
    q = 1.0 / max(0.5, rezonans)
    alcak = bant = 0.0
    cikti = [0.0] * len(veri)
    for i, x in enumerate(veri):
        yuksek = x - alcak - q * bant
        bant += f * yuksek
        alcak += f * bant
        cikti[i] = alcak
    return cikti


def oda(veri):
    """
    Kisa oda yansimalari. Marimba salonda calinir, tamamen kuru bir
    marimba yapay duyulur.
    """
    taplar = [(0.019, 0.20), (0.031, 0.14), (0.047, 0.10),
              (0.067, 0.07), (0.091, 0.045), (0.123, 0.03)]
    cikti = list(veri)
    for gecikme, kazanc in taplar:
        ofset = int(gecikme * SR)
        for i, x in enumerate(veri):
            j = i + ofset
            if j < len(cikti):
                cikti[j] += x * kazanc
    return cikti


# ---------------------------------------------------------------------------
# Marimba modeli
# ---------------------------------------------------------------------------

# Akort edilmis marimba cubugunun kismi ton oranlari
KISMI_ORAN = [1.000, 3.990, 9.200, 16.40]


def marimba(nota, sure, sertlik=0.5, can=0.0, kazanc=1.0):
    """
    Tek marimba notasi.

    sertlik : 0 yumusak tokmak (az ust ton), 1 sert tokmak (cok ust ton)
    can     : 0 saf ahsap, 1 can tinisi (ust tonlar daha uzun surer)
    """
    frekans = NOTA[nota] if isinstance(nota, str) else float(nota)
    n = int(SR * sure)
    cikti = [0.0] * n
    nyquist = SR / 2.0

    # Yuksek notalar daha cabuk soner - gercek calgida da boyle
    hiz = 1.0 + frekans / 1400.0

    # (oran, genlik, sonum) - ASIL MESELE: her tonun kendi sonum hizi var
    kismi = [
        (KISMI_ORAN[0], 1.00,
         5.5 * hiz),
        (KISMI_ORAN[1], (0.30 + 0.34 * sertlik) * (1 + 0.5 * can),
         (24.0 - 13.0 * can) * hiz),
        (KISMI_ORAN[2], (0.11 + 0.24 * sertlik) * (1 + 0.9 * can),
         (48.0 - 26.0 * can) * hiz),
        (KISMI_ORAN[3], (0.03 + 0.11 * sertlik) * (1 + 1.2 * can),
         (82.0 - 40.0 * can) * hiz),
    ]

    for oran, genlik, sonum in kismi:
        f0 = frekans * oran
        if f0 >= nyquist or genlik <= 0.001:
            continue
        faz = 0.0
        atak_sabit = 0.0006 + 0.0022 * (1.0 - sertlik)
        for i in range(n):
            t = i / SR
            # Vurus anindaki kisa perde dususu
            perde = f0 * (1.0 + 0.018 * math.exp(-70.0 * t))
            faz += 2.0 * math.pi * perde / SR
            atak = min(1.0, t / atak_sabit)
            cikti[i] += math.sin(faz) * genlik * math.exp(-sonum * t) * atak

    # Rezonator borusu: gec baslar, gec biter. Marimbanin ici bos sicakligi.
    faz = 0.0
    for i in range(n):
        t = i / SR
        faz += 2.0 * math.pi * frekans / SR
        zarf = math.exp(-4.2 * hiz * t) * (1.0 - math.exp(-160.0 * t))
        cikti[i] += math.sin(faz) * 0.42 * zarf

    # Tokmagin tahtaya carpmasi
    vurus = gurultu(0.010, tohum=int(frekans) + 7)
    vurus = alcak_gecir(vurus, 1400 + 3200 * sertlik, 1.1)
    for i in range(len(vurus)):
        vurus[i] *= math.exp(-260.0 * i / SR)
    karistir(cikti, vurus, 0.0, 0.14 + 0.20 * sertlik)

    return [x * kazanc for x in cikti]


def rulo(nota, sure, hiz=15.0, sertlik=0.45, can=0.0, kazanc=1.0):
    """
    Marimba rulosu: ayni notaya hizli tekrarli vurus.
    Marimbada uzun ses gerektiginde kullanilan gercek teknik budur.
    """
    toplam = bos(sure + 0.40)
    temel = NOTA[nota] if isinstance(nota, str) else float(nota)
    aralik = 1.0 / hiz
    t = 0.0
    k = 0
    while t < sure:
        oran = t / sure if sure > 0 else 0.0
        seviye = 0.45 + 0.55 * math.sin(math.pi * min(1.0, oran))
        sapma = 1.0 + (0.012 if k % 2 else -0.012)   # el birebir esit vurmaz
        karistir(toplam, marimba(temel * sapma, 0.34, sertlik=sertlik, can=can),
                 t, kazanc * seviye * (0.86 if k % 2 else 1.0))
        t += aralik
        k += 1
    return toplam


# ---------------------------------------------------------------------------
# Son islemler
# ---------------------------------------------------------------------------

def rms(veri):
    return math.sqrt(sum(x * x for x in veri) / len(veri)) if veri else 0.0


def rms_normalize(veri, hedef, tavan=0.95):
    if not veri:
        return veri
    cikti = list(veri)
    for _ in range(6):
        mevcut = rms(cikti)
        if mevcut < 1e-9:
            return cikti
        cikti = [x * (hedef / mevcut) for x in cikti]
        if max(abs(x) for x in cikti) <= tavan:
            break
        cikti = [tavan * math.tanh(x / tavan) for x in cikti]
    tepe = max(abs(x) for x in cikti)
    if tepe > tavan:
        cikti = [x * (tavan / tepe) for x in cikti]
    return cikti


def kuyruk_kirp(veri, esik=0.0016):
    son = len(veri) - 1
    while son > SR * 0.05 and abs(veri[son]) < esik:
        son -= 1
    return veri[:son + 1]


def kenar_yumusat(veri, sure=0.004):
    n = int(sure * SR)
    if len(veri) < 2 * n or n < 1:
        return veri
    cikti = list(veri)
    for i in range(n):
        cikti[i] *= i / n
        cikti[-(i + 1)] *= i / n
    return cikti


def son_isle(veri, ad):
    veri = oda(veri)
    veri = kuyruk_kirp(veri)
    veri = kenar_yumusat(veri)
    return rms_normalize(veri, HEDEF_RMS[ad])


# ---------------------------------------------------------------------------
# Sesler
# ---------------------------------------------------------------------------

def ses_dogru():
    """F5-A5-C6 yukselen major arpej. can=0.75 ile can tinisina yaklasir."""
    t = bos(0.62)
    for nota, baslangic, kazanc in [("F5", 0.000, 0.92),
                                    ("A5", 0.075, 0.96),
                                    ("C6", 0.150, 1.00)]:
        karistir(t, marimba(nota, 0.44, sertlik=0.52, can=0.75), baslangic, kazanc)
    karistir(t, marimba("C7", 0.34, sertlik=0.35, can=0.95), 0.155, 0.13)
    return son_isle(t, "dogru")


def ses_yanlis():
    """G3-Eb3 alcalan kucuk uclu. Bas marimba, yumusak tokmak, can yok."""
    t = bos(0.62)
    karistir(t, marimba("G3", 0.46, sertlik=0.30), 0.000, 1.00)
    karistir(t, marimba("Eb3", 0.52, sertlik=0.26), 0.105, 0.98)
    karistir(t, marimba("Eb3", 0.48, sertlik=0.20), 0.105, 0.34)
    return son_isle(t, "yanlis")


def ses_pas():
    """D5 tek notr nota. Melodik yon tasimaz - ne odul ne ceza."""
    t = bos(0.44)
    karistir(t, marimba("D5", 0.38, sertlik=0.22, can=0.15), 0.0, 1.00)
    karistir(t, marimba("D4", 0.34, sertlik=0.18), 0.0, 0.30)
    return son_isle(t, "pas")


def ses_tik():
    """Son 10 saniye. Ayni calginin en ufak hali."""
    t = bos(0.20)
    karistir(t, marimba("A6", 0.16, sertlik=0.55, can=0.25), 0.0, 1.0)
    return son_isle(t, "tik")


def ses_gerisayim():
    """3-2-1. Cok yumusak tokmak, orta perde."""
    t = bos(0.52)
    karistir(t, marimba("A4", 0.44, sertlik=0.14, can=0.30), 0.0, 1.00)
    karistir(t, marimba("A3", 0.40, sertlik=0.12), 0.0, 0.26)
    return son_isle(t, "gerisayim")


def ses_basla():
    """C5-G5-C6 yukselen. Parlak ve enerjik."""
    t = bos(0.70)
    for nota, baslangic, kazanc in [("C5", 0.000, 0.85),
                                    ("G5", 0.070, 0.92),
                                    ("C6", 0.140, 1.00)]:
        karistir(t, marimba(nota, 0.46, sertlik=0.62, can=0.55), baslangic, kazanc)
    return son_isle(t, "basla")


def ses_korna():
    """Sure doldu. A3+E3 tremolo rulo, sonunda kapanis vurusu."""
    t = bos(1.20)
    karistir(t, rulo("A3", 0.72, hiz=16.0, sertlik=0.42, can=0.10), 0.000, 1.00)
    karistir(t, rulo("E3", 0.72, hiz=16.0, sertlik=0.36, can=0.05), 0.008, 0.68)
    karistir(t, marimba("A2", 0.55, sertlik=0.34), 0.735, 0.95)
    return son_isle(t, "korna")


def ses_sonkart():
    """Hizlanan yukselen dizi. Aciliyet, ama hala tamamen ahsap."""
    t = bos(0.72)
    zaman, aralik = 0.0, 0.085
    for k, nota in enumerate(["D5", "E5", "G5", "A5", "D6"]):
        karistir(t, marimba(nota, 0.34, sertlik=0.58, can=0.45),
                 zaman, 0.72 + 0.07 * k)
        zaman += aralik
        aralik *= 0.82
    return son_isle(t, "sonkart")


SESLER = {
    "dogru":     ses_dogru,
    "yanlis":    ses_yanlis,
    "pas":       ses_pas,
    "tik":       ses_tik,
    "gerisayim": ses_gerisayim,
    "basla":     ses_basla,
    "korna":     ses_korna,
    "sonkart":   ses_sonkart,
}

ACIKLAMA = {
    "dogru":     "F5-A5-C6 yükselen majör, çan tınılı",
    "yanlis":    "G3-Eb3 alçalan ağır ikili, bas marimba",
    "pas":       "D5 tek nötr nota, yumuşak tokmak",
    "tik":       "A6 çok kısa tiz tap",
    "gerisayim": "A4 yumuşak orta nota",
    "basla":     "C5-G5-C6 yükselen üçlü, parlak",
    "korna":     "A3+E3 tremolo rulo, kapanış vuruşu",
    "sonkart":   "Hızlanan yükselen dizi",
}


def wav_yaz(ad, veri):
    os.makedirs(CIKTI_KLASORU, exist_ok=True)
    yol = os.path.join(CIKTI_KLASORU, ad + ".wav")
    kareler = b"".join(
        struct.pack("<h", int(max(-1.0, min(1.0, x)) * 32767)) for x in veri)
    with wave.open(yol, "wb") as d:
        d.setnchannels(1)
        d.setsampwidth(2)
        d.setframerate(SR)
        d.writeframes(kareler)
    return yol


def main():
    print("NafuTabu ses ureteci  -  marimba ailesi\n")
    print(f"  {'ses':11s} {'süre':>7s} {'tepe':>5s} {'RMS':>6s}  açıklama")
    print("  " + "-" * 66)
    for ad, uretici in SESLER.items():
        veri = uretici()
        for x in veri:
            if not math.isfinite(x):
                sys.exit(f"{ad}: NaN uretildi, filtre kararsiz")
        wav_yaz(ad, veri)
        print(f"  {ad:11s} {len(veri) / SR * 1000:6.0f}ms "
              f"{max(abs(x) for x in veri):5.2f} {rms(veri):6.3f}  {ACIKLAMA[ad]}")
    print(f"\n{len(SESLER)} ses uretildi -> assets/ses/")
    print("Hepsi ayni calgidan. Aralarinda stil uyumsuzlugu imkansiz.")


if __name__ == "__main__":
    main()
