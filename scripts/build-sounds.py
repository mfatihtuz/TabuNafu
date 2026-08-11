#!/usr/bin/env python3
"""
NafuTabu ses ureteci.

Oyunun tum ses efektlerini sifirdan sentezler. Hazir ses dosyasi indirmez,
disaridan kutuphane kullanmaz. Sadece Python standart kutuphanesi.

Kullanilan teknikler:
  - ADSR zarfi (attack / decay / sustain / release)
  - Harmonik katmanlama (marimba, wood block, korna icin ayri tinilar)
  - Band-limitli kare dalga (aliasing olusmasin diye Nyquist'e kadar)
  - Yumusak doygunluk (tanh) - sert dijital kirpme yerine
  - Tek kutuplu alcak geciren filtre (gurultu sekillendirme)
  - Kisa yanki kuyrugu (comb gecikmeler)
  - Algisal seviye esitleme (RMS tabanli)

Cikti: assets/ses/*.wav  (44.1 kHz, 16 bit, mono)

Calistirma:  python3 scripts/build-sounds.py
"""

import math
import os
import struct
import wave

ORNEKLEME_HIZI = 44100
CIKTI_KLASORU = os.path.join(os.path.dirname(__file__), "..", "assets", "ses")

# Her sesin hedef algisal seviyesi (RMS). Kullanicinin kulaginda hepsi
# ayni yukseklikte duyulsun diye ayri ayri ayarlandi.
HEDEF_RMS = {
    "dogru": 0.16,
    "yanlis": 0.17,
    "pas": 0.11,
    "tik": 0.055,
    "korna": 0.20,
    "sonkart": 0.15,
}


# ---------------------------------------------------------------------------
# Temel yardimcilar
# ---------------------------------------------------------------------------

def bos(sure):
    """Verilen saniye uzunlugunda sessiz tampon uretir."""
    return [0.0] * int(ORNEKLEME_HIZI * sure)


def karistir(hedef, kaynak, baslangic_sn=0.0, kazanc=1.0):
    """Kaynak tamponu hedefin uzerine belirtilen saniyeden itibaren ekler."""
    ofset = int(ORNEKLEME_HIZI * baslangic_sn)
    for i, deger in enumerate(kaynak):
        j = ofset + i
        if 0 <= j < len(hedef):
            hedef[j] += deger * kazanc
    return hedef


def adsr(uzunluk, atak, dusus, surdurme_seviyesi, birakma):
    """
    ADSR zarfi uretir. Sureler saniye cinsinden, seviye 0-1 arasinda.
    Dusus ve birakma ussel (exponential) egri kullanir - dogal sonumleme.
    """
    zarf = [0.0] * uzunluk
    atak_n = max(1, int(atak * ORNEKLEME_HIZI))
    dusus_n = max(1, int(dusus * ORNEKLEME_HIZI))
    birakma_n = max(1, int(birakma * ORNEKLEME_HIZI))
    surdurme_n = max(0, uzunluk - atak_n - dusus_n - birakma_n)

    indeks = 0
    for i in range(min(atak_n, uzunluk)):
        zarf[indeks] = i / atak_n
        indeks += 1
    for i in range(dusus_n):
        if indeks >= uzunluk:
            break
        oran = i / dusus_n
        zarf[indeks] = 1.0 + (surdurme_seviyesi - 1.0) * (1.0 - math.exp(-4.0 * oran))
        indeks += 1
    for _ in range(surdurme_n):
        if indeks >= uzunluk:
            break
        zarf[indeks] = surdurme_seviyesi
        indeks += 1
    for i in range(birakma_n):
        if indeks >= uzunluk:
            break
        oran = i / birakma_n
        zarf[indeks] = surdurme_seviyesi * math.exp(-5.0 * oran)
        indeks += 1
    return zarf


def perkusif_zarf(uzunluk, atak, sonumleme_hizi):
    """
    Vurmali calgi zarfi. Cok hizli atak, ardindan ussel sonumleme.
    Marimba, wood block gibi sesler icin.
    """
    zarf = [0.0] * uzunluk
    atak_n = max(1, int(atak * ORNEKLEME_HIZI))
    for i in range(uzunluk):
        if i < atak_n:
            zarf[i] = i / atak_n
        else:
            gecen = (i - atak_n) / ORNEKLEME_HIZI
            zarf[i] = math.exp(-sonumleme_hizi * gecen)
    return zarf


def ton(frekans, sure, harmonikler=None, frekans_bitis=None):
    """
    Harmonik katmanli ton uretir.

    harmonikler: [(carpan, genlik), ...] listesi. Ornegin marimba icin
                 [(1, 1.0), (4, 0.45), (10, 0.12)] - marimba cubuklarinin
                 gercek harmonik yapisi 4:1 ve 10:1 oranlarini one cikarir.
    frekans_bitis: verilirse frekans baslangictan bitise dogru kayar (perde bukumu).
    """
    if harmonikler is None:
        harmonikler = [(1, 1.0)]

    uzunluk = int(ORNEKLEME_HIZI * sure)
    cikti = [0.0] * uzunluk
    nyquist = ORNEKLEME_HIZI / 2.0

    for carpan, genlik in harmonikler:
        faz = 0.0
        for i in range(uzunluk):
            oran = i / uzunluk if uzunluk > 1 else 0.0
            anlik = frekans if frekans_bitis is None else frekans + (frekans_bitis - frekans) * oran
            h_frekans = anlik * carpan
            if h_frekans >= nyquist:
                continue
            faz += 2.0 * math.pi * h_frekans / ORNEKLEME_HIZI
            cikti[i] += math.sin(faz) * genlik
    return cikti


def band_limitli_kare(frekans, sure, harmonik_sayisi=8):
    """
    Band-limitli kare dalga. Tek harmonikleri 1/k genlikle toplar.
    Naif kare dalgadaki aliasing cizirtisini tamamen onler.
    """
    uzunluk = int(ORNEKLEME_HIZI * sure)
    cikti = [0.0] * uzunluk
    nyquist = ORNEKLEME_HIZI / 2.0
    for k in range(1, harmonik_sayisi * 2, 2):
        h_frekans = frekans * k
        if h_frekans >= nyquist:
            break
        genlik = 1.0 / k
        acisal = 2.0 * math.pi * h_frekans / ORNEKLEME_HIZI
        for i in range(uzunluk):
            cikti[i] += math.sin(acisal * i) * genlik
    return cikti


def gurultu(sure, tohum=12345):
    """Deterministik beyaz gurultu. Her calistirmada ayni sonucu verir."""
    uzunluk = int(ORNEKLEME_HIZI * sure)
    cikti = [0.0] * uzunluk
    durum = tohum
    for i in range(uzunluk):
        durum = (1103515245 * durum + 12345) & 0x7FFFFFFF
        cikti[i] = (durum / 0x3FFFFFFF) - 1.0
    return cikti


def alcak_gecir(veri, kesim_frekansi):
    """Tek kutuplu alcak geciren filtre. Gurultuyu yumusatmak icin."""
    if not veri:
        return veri
    rc = 1.0 / (2.0 * math.pi * kesim_frekansi)
    dt = 1.0 / ORNEKLEME_HIZI
    alfa = dt / (rc + dt)
    cikti = [0.0] * len(veri)
    onceki = 0.0
    for i, deger in enumerate(veri):
        onceki = onceki + alfa * (deger - onceki)
        cikti[i] = onceki
    return cikti


def yumusak_doygunluk(veri, miktar=1.0):
    """
    tanh tabanli yumusak doygunluk. Sert dijital kirpmenin aksine
    harmonikleri kademeli ekler, kulaga sicak gelir.
    """
    return [math.tanh(deger * miktar) / math.tanh(miktar) if miktar > 0 else deger
            for deger in veri]


def yanki_kuyrugu(veri, gecikmeler):
    """
    Kisa yanki. gecikmeler: [(saniye, kazanc), ...]
    Sesin havada durmasini saglar, kuru ve ucuz durmasini onler.
    """
    cikti = list(veri)
    for gecikme_sn, kazanc in gecikmeler:
        ofset = int(gecikme_sn * ORNEKLEME_HIZI)
        for i in range(len(veri)):
            j = i + ofset
            if j < len(cikti):
                cikti[j] += veri[i] * kazanc
    return cikti


def zarf_uygula(veri, zarf):
    return [d * z for d, z in zip(veri, zarf)]


def rms_normalize(veri, hedef_rms):
    """Algisal seviye esitleme. Tepe degil RMS baz alinir."""
    if not veri:
        return veri
    kare_toplam = sum(d * d for d in veri)
    mevcut = math.sqrt(kare_toplam / len(veri))
    if mevcut < 1e-9:
        return veri
    kazanc = hedef_rms / mevcut
    cikti = [d * kazanc for d in veri]

    # Tepe degeri 0.95'i asarsa kirpilmayi onlemek icin geri cek
    tepe = max(abs(d) for d in cikti)
    if tepe > 0.95:
        oran = 0.95 / tepe
        cikti = [d * oran for d in cikti]
    return cikti


def kenar_yumusat(veri, sure=0.004):
    """Basta ve sonda kisa rampa. Cit sesini (click) onler."""
    n = int(sure * ORNEKLEME_HIZI)
    if len(veri) < 2 * n or n < 1:
        return veri
    cikti = list(veri)
    for i in range(n):
        oran = i / n
        cikti[i] *= oran
        cikti[-(i + 1)] *= oran
    return cikti


def wav_yaz(ad, veri):
    os.makedirs(CIKTI_KLASORU, exist_ok=True)
    yol = os.path.join(CIKTI_KLASORU, ad + ".wav")
    kareler = b"".join(
        struct.pack("<h", int(max(-1.0, min(1.0, d)) * 32767)) for d in veri
    )
    with wave.open(yol, "wb") as dosya:
        dosya.setnchannels(1)
        dosya.setsampwidth(2)
        dosya.setframerate(ORNEKLEME_HIZI)
        dosya.writeframes(kareler)
    return yol, len(veri) / ORNEKLEME_HIZI


# ---------------------------------------------------------------------------
# Ses tasarimlari
# ---------------------------------------------------------------------------

# Marimba cubuklarinin gercek harmonik yapisi. 4. ve 10. harmonikler
# baskindir, bu yuzden tini ahsap ve yumusak duyulur.
MARIMBA = [(1, 1.0), (4, 0.42), (10, 0.10)]


def ses_dogru():
    """
    Yukselen iki nota, marimba tinisi. C6 -> E6 (buyuk uclu araligi).
    Kisa ustuste binme ile tek bir 'dan-din' hissi verir.
    """
    toplam = bos(0.20)

    nota1 = ton(1046.50, 0.11, MARIMBA)
    nota1 = zarf_uygula(nota1, perkusif_zarf(len(nota1), 0.002, 22.0))
    karistir(toplam, nota1, 0.0, 1.0)

    nota2 = ton(1318.51, 0.14, MARIMBA)
    nota2 = zarf_uygula(nota2, perkusif_zarf(len(nota2), 0.002, 18.0))
    karistir(toplam, nota2, 0.065, 1.0)

    toplam = yanki_kuyrugu(toplam, [(0.028, 0.16), (0.055, 0.07)])
    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["dogru"]))


def ses_yanlis():
    """
    Alcalan iki nota. G3 -> D#3 (kucuk uclu asagi - kapanis, olumsuzluk hissi).
    Hafif doygunluk ile govdeli ama rahatsiz etmeyen bir tini.
    """
    toplam = bos(0.24)

    govde = [(1, 1.0), (2, 0.5), (3, 0.28), (4, 0.14)]

    nota1 = ton(196.00, 0.13, govde)
    nota1 = zarf_uygula(nota1, adsr(len(nota1), 0.004, 0.05, 0.55, 0.06))
    karistir(toplam, nota1, 0.0, 1.0)

    nota2 = ton(155.56, 0.16, govde)
    nota2 = zarf_uygula(nota2, adsr(len(nota2), 0.004, 0.05, 0.50, 0.08))
    karistir(toplam, nota2, 0.075, 1.0)

    toplam = yumusak_doygunluk(toplam, 1.6)
    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["yanlis"]))


def ses_pas():
    """
    Notr tik. Yukari dogru hafif perde bukumu - 'atlandi' hissi.
    Ne odullendirici ne cezalandirici, kasitli olarak duygusuz.
    """
    toplam = bos(0.13)

    kayan = ton(620.0, 0.11, [(1, 1.0), (2, 0.22)], frekans_bitis=910.0)
    kayan = zarf_uygula(kayan, perkusif_zarf(len(kayan), 0.003, 30.0))
    karistir(toplam, kayan, 0.0, 1.0)

    # Basa cok kisa bir gurultu vurusu - dokunma hissini keskinlestirir
    vurus = alcak_gecir(gurultu(0.012, tohum=77), 3000.0)
    vurus = zarf_uygula(vurus, perkusif_zarf(len(vurus), 0.0005, 260.0))
    karistir(toplam, vurus, 0.0, 0.5)

    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["pas"]))


def ses_tik():
    """
    Son 10 saniyede her saniye calan wood block.
    Cok kisa ve kisik - dikkat ceker ama sinir bozmaz.
    """
    toplam = bos(0.05)

    ping = ton(1180.0, 0.04, [(1, 1.0), (3, 0.30), (6, 0.10)])
    ping = zarf_uygula(ping, perkusif_zarf(len(ping), 0.0008, 95.0))
    karistir(toplam, ping, 0.0, 1.0)

    tahta = alcak_gecir(gurultu(0.018, tohum=451), 2200.0)
    tahta = zarf_uygula(tahta, perkusif_zarf(len(tahta), 0.0004, 200.0))
    karistir(toplam, tahta, 0.0, 0.45)

    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["tik"]), 0.002)


def ses_korna():
    """
    Tur bitis kornasi. Iki katmanli, hafif detune edilmis akor.
    Band-limitli kare dalga kullanildigi icin belirgin ama tiz degil.
    Detune (3 cent) sesi canli ve kalin tutar.
    """
    sure = 0.70
    toplam = bos(sure + 0.15)

    detune = 1.0017  # yaklasik 3 cent

    for frekans, kazanc in [(220.0, 1.0), (330.0, 0.62), (146.83, 0.40)]:
        katman_a = band_limitli_kare(frekans, sure, harmonik_sayisi=7)
        katman_b = band_limitli_kare(frekans * detune, sure, harmonik_sayisi=7)
        birlesik = [(a + b) * 0.5 for a, b in zip(katman_a, katman_b)]
        birlesik = zarf_uygula(birlesik, adsr(len(birlesik), 0.018, 0.10, 0.72, 0.22))
        karistir(toplam, birlesik, 0.0, kazanc)

    toplam = alcak_gecir(toplam, 3400.0)
    toplam = yumusak_doygunluk(toplam, 1.3)
    toplam = yanki_kuyrugu(toplam, [(0.045, 0.14), (0.09, 0.06)])
    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["korna"]))


def ses_sonkart():
    """
    Son kart bonusu basladiginda calan gergin cift vurus.
    Yarim ses araligi (A4 - A#4) kasitli olarak tedirgin edici.
    """
    toplam = bos(0.32)

    gergin = [(1, 1.0), (2, 0.40), (3, 0.30), (5, 0.12)]

    vurus1 = ton(440.00, 0.12, gergin)
    vurus1 = zarf_uygula(vurus1, perkusif_zarf(len(vurus1), 0.002, 26.0))
    karistir(toplam, vurus1, 0.0, 1.0)

    vurus2 = ton(466.16, 0.16, gergin)
    vurus2 = zarf_uygula(vurus2, perkusif_zarf(len(vurus2), 0.002, 20.0))
    karistir(toplam, vurus2, 0.115, 1.0)

    toplam = yumusak_doygunluk(toplam, 1.4)
    toplam = yanki_kuyrugu(toplam, [(0.035, 0.15)])
    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["sonkart"]))


SESLER = {
    "dogru": ses_dogru,
    "yanlis": ses_yanlis,
    "pas": ses_pas,
    "tik": ses_tik,
    "korna": ses_korna,
    "sonkart": ses_sonkart,
}


def main():
    print("NafuTabu ses ureteci\n")
    for ad, uretici in SESLER.items():
        veri = uretici()
        yol, sure = wav_yaz(ad, veri)
        boyut = os.path.getsize(yol)
        print(f"  {ad:9s}  {sure * 1000:6.0f} ms  {boyut / 1024:6.1f} KB")
    print(f"\nToplam {len(SESLER)} ses uretildi -> assets/ses/")


if __name__ == "__main__":
    main()
