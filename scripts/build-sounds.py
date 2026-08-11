#!/usr/bin/env python3
"""
NafuTabu ses ureteci.

TEK BIR SES DUNYASI: ahsap ve pirinc.
Oyunun gorsel dunyasi okey/tavla tahtasi oldugu icin sesler de oradan gelir.
Ahsap tas sesi, tokmak vurusu, tahta uzerinde kayma, pirinc korna.
Hicbiri "bip" degil - hepsi fiziksel bir nesnenin sesi gibi kurgulandi.

Her sesin anlami tinisinda:
  dogru      yukselen uc notali marimba          odul, acilma
  yanlis     ahsap tokmak + alcalan govde        kapanma, red
  pas        tahta uzerinde kaydirma             notr, gecistirme
  tik        kisik ahsap tik                     son 10 saniye
  gerisayim  yumusak yuvarlak blip               3-2-1, sicak
  basla      yukselen ikili malet                haydi
  korna      pirinc akor                         tur bitti
  sonkart    tremololu gergin ikili              aceleci

Kullanilan teknikler:
  - Inharmonik malet kismi tonlari (gercek marimba/glockenspiel orani)
  - Durum degiskenli filtre (alcak/band gecir, rezonansli)
  - Gurultu supurmesi (bandpass merkez frekansi kayar)
  - Perde zarfi (vurmali seslerde dusen perde)
  - Tremolo (genlik modulasyonu)
  - Yumusak doygunluk (tanh)
  - Algisal seviye esitleme (RMS)

Cikti: assets/ses/*.wav  (44.1 kHz, 16 bit, mono)
Calistirma:  python3 scripts/build-sounds.py
"""

import math
import os
import struct
import wave

ORNEKLEME_HIZI = 44100
CIKTI_KLASORU = os.path.join(os.path.dirname(__file__), "..", "assets", "ses")

HEDEF_RMS = {
    "dogru":      0.155,
    "yanlis":     0.165,
    "yanlis-b":   0.165,
    "pas":        0.105,
    "pas-b":      0.105,
    "tik":        0.055,
    "gerisayim":  0.130,
    "basla":      0.150,
    "korna":      0.190,
    "sonkart":    0.145,
}

# Gercek marimba cubugunun kismi ton oranlari. Tam kat degildir (inharmonik),
# ahsap tinisini veren sey budur.
MARIMBA = [(1.0, 1.0), (3.93, 0.34), (9.22, 0.11)]
# Glockenspiel/can: daha parlak ve daha inharmonik
CAN = [(1.0, 1.0), (2.76, 0.42), (5.40, 0.18), (8.93, 0.07)]


# ---------------------------------------------------------------------------
# Temel yardimcilar
# ---------------------------------------------------------------------------

def bos(sure):
    return [0.0] * int(ORNEKLEME_HIZI * sure)


def karistir(hedef, kaynak, baslangic_sn=0.0, kazanc=1.0):
    ofset = int(ORNEKLEME_HIZI * baslangic_sn)
    for i, deger in enumerate(kaynak):
        j = ofset + i
        if 0 <= j < len(hedef):
            hedef[j] += deger * kazanc
    return hedef


def perkusif_zarf(uzunluk, atak, sonumleme_hizi):
    """Vurmali zarf. Hizli atak, ussel sonumleme."""
    zarf = [0.0] * uzunluk
    atak_n = max(1, int(atak * ORNEKLEME_HIZI))
    for i in range(uzunluk):
        if i < atak_n:
            zarf[i] = i / atak_n
        else:
            zarf[i] = math.exp(-sonumleme_hizi * (i - atak_n) / ORNEKLEME_HIZI)
    return zarf


def adsr(uzunluk, atak, dusus, surdurme, birakma):
    zarf = [0.0] * uzunluk
    a = max(1, int(atak * ORNEKLEME_HIZI))
    d = max(1, int(dusus * ORNEKLEME_HIZI))
    b = max(1, int(birakma * ORNEKLEME_HIZI))
    s = max(0, uzunluk - a - d - b)
    i = 0
    for k in range(min(a, uzunluk)):
        zarf[i] = k / a; i += 1
    for k in range(d):
        if i >= uzunluk: break
        zarf[i] = 1.0 + (surdurme - 1.0) * (1.0 - math.exp(-4.0 * k / d)); i += 1
    for _ in range(s):
        if i >= uzunluk: break
        zarf[i] = surdurme; i += 1
    for k in range(b):
        if i >= uzunluk: break
        zarf[i] = surdurme * math.exp(-5.0 * k / b); i += 1
    return zarf


def malet(frekans, sure, kismi_tonlar=MARIMBA, perde_bitis=None):
    """
    Inharmonik kismi tonlarla malet (tokmak) sesi.
    perde_bitis verilirse perde asagi/yukari kayar - vurmali seslerde
    ilk anda perdenin dusmesi cok dogal duyulur.
    """
    uzunluk = int(ORNEKLEME_HIZI * sure)
    cikti = [0.0] * uzunluk
    nyquist = ORNEKLEME_HIZI / 2.0
    for oran, genlik in kismi_tonlar:
        faz = 0.0
        for i in range(uzunluk):
            t = i / uzunluk if uzunluk > 1 else 0.0
            temel = frekans if perde_bitis is None else frekans + (perde_bitis - frekans) * t
            f = temel * oran
            if f >= nyquist:
                continue
            faz += 2.0 * math.pi * f / ORNEKLEME_HIZI
            cikti[i] += math.sin(faz) * genlik
    return cikti


def testere(frekans, sure, harmonik=10):
    """Band-limitli testere dalgasi. Pirinc tinisinin temeli."""
    uzunluk = int(ORNEKLEME_HIZI * sure)
    cikti = [0.0] * uzunluk
    nyquist = ORNEKLEME_HIZI / 2.0
    for k in range(1, harmonik + 1):
        f = frekans * k
        if f >= nyquist:
            break
        acisal = 2.0 * math.pi * f / ORNEKLEME_HIZI
        genlik = 1.0 / k
        for i in range(uzunluk):
            cikti[i] += math.sin(acisal * i) * genlik
    return cikti


def gurultu(sure, tohum=12345):
    uzunluk = int(ORNEKLEME_HIZI * sure)
    cikti = [0.0] * uzunluk
    durum = tohum
    for i in range(uzunluk):
        durum = (1103515245 * durum + 12345) & 0x7FFFFFFF
        cikti[i] = (durum / 0x3FFFFFFF) - 1.0
    return cikti


# Chamberlin durum degiskenli filtrenin kararlilik siniri. Bu degerin
# uzerinde filtre kendini besler ve cikti NaN olur.
SVF_UST_SINIR = ORNEKLEME_HIZI / 6.0


def svf(veri, kesim, rezonans=1.0, tur="alcak"):
    """
    Durum degiskenli filtre. Sabit kesim frekansi.
    tur: 'alcak' | 'band' | 'yuksek'
    """
    f = 2.0 * math.sin(math.pi * min(kesim, SVF_UST_SINIR) / ORNEKLEME_HIZI)
    q = 1.0 / max(0.5, rezonans)
    alcak = bant = 0.0
    cikti = [0.0] * len(veri)
    for i, x in enumerate(veri):
        yuksek = x - alcak - q * bant
        bant += f * yuksek
        alcak += f * bant
        cikti[i] = alcak if tur == "alcak" else bant if tur == "band" else yuksek
    return cikti


def svf_supurme(veri, kesim_bas, kesim_son, rezonans=2.0, tur="band"):
    """Kesim frekansi zaman icinde kayan filtre. Kaydirma/supurme sesleri icin."""
    alcak = bant = 0.0
    n = len(veri)
    cikti = [0.0] * n
    q = 1.0 / max(0.5, rezonans)
    for i, x in enumerate(veri):
        t = i / n if n > 1 else 0.0
        kesim = kesim_bas + (kesim_son - kesim_bas) * t
        f = 2.0 * math.sin(math.pi * min(kesim, SVF_UST_SINIR) / ORNEKLEME_HIZI)
        yuksek = x - alcak - q * bant
        bant += f * yuksek
        alcak += f * bant
        cikti[i] = alcak if tur == "alcak" else bant if tur == "band" else yuksek
    return cikti


def tremolo(veri, hiz, derinlik=0.5):
    """Genlik modulasyonu. Gerginlik ve aciliyet hissi verir."""
    return [x * (1.0 - derinlik + derinlik * (0.5 + 0.5 * math.sin(
        2.0 * math.pi * hiz * i / ORNEKLEME_HIZI))) for i, x in enumerate(veri)]


def doygunluk(veri, miktar=1.0):
    if miktar <= 0:
        return veri
    bolen = math.tanh(miktar)
    return [math.tanh(x * miktar) / bolen for x in veri]


def yanki(veri, gecikmeler):
    cikti = list(veri)
    for gecikme_sn, kazanc in gecikmeler:
        ofset = int(gecikme_sn * ORNEKLEME_HIZI)
        for i in range(len(veri)):
            j = i + ofset
            if j < len(cikti):
                cikti[j] += veri[i] * kazanc
    return cikti


def zarfla(veri, zarf):
    return [d * z for d, z in zip(veri, zarf)]


def rms_normalize(veri, hedef):
    if not veri:
        return veri
    for d in veri:
        if not math.isfinite(d):
            raise ValueError("Ses verisinde NaN/sonsuz deger var - filtre kararsiz")
    mevcut = math.sqrt(sum(d * d for d in veri) / len(veri))
    if mevcut < 1e-9:
        return veri
    cikti = [d * (hedef / mevcut) for d in veri]
    tepe = max(abs(d) for d in cikti)
    if tepe > 0.95:
        cikti = [d * (0.95 / tepe) for d in cikti]
    return cikti


def kenar_yumusat(veri, sure=0.004):
    n = int(sure * ORNEKLEME_HIZI)
    if len(veri) < 2 * n or n < 1:
        return veri
    cikti = list(veri)
    for i in range(n):
        oran = i / n
        cikti[i] *= oran
        cikti[-(i + 1)] *= oran
    return cikti


# ---------------------------------------------------------------------------
# Ses tasarimlari
# ---------------------------------------------------------------------------

def ses_dogru():
    """
    Yukselen UC notali marimba arpeji (C6-E6-G6 majör akor) + can parlamasi.
    Uc nota, iki degil - acilma ve odul hissi tam otursun.
    """
    toplam = bos(0.40)
    notalar = [(1046.50, 0.000, 1.00, 24.0),
               (1318.51, 0.070, 0.95, 21.0),
               (1567.98, 0.140, 0.90, 16.0)]
    for frekans, baslangic, kazanc, sonum in notalar:
        n = malet(frekans, 0.24, MARIMBA)
        n = zarfla(n, perkusif_zarf(len(n), 0.0015, sonum))
        karistir(toplam, n, baslangic, kazanc)

    # Ustte cok kisik can parlamasi - sicaklik ve parlaklik
    parlama = malet(2093.0, 0.30, CAN)
    parlama = zarfla(parlama, perkusif_zarf(len(parlama), 0.002, 13.0))
    karistir(toplam, parlama, 0.145, 0.16)

    toplam = svf(toplam, 8500.0, 0.8)
    toplam = yanki(toplam, [(0.032, 0.16), (0.068, 0.08), (0.11, 0.035)])
    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["dogru"]))


def ses_yanlis():
    """
    Ahsap tokmak vurusu. Bip degil - agir bir tahta parcasinin masaya
    carpmasi gibi. Perde hizla duser, govde bogugudur.
    """
    toplam = bos(0.30)

    # Govde: perdesi hizla dusen alcak vurus
    govde = malet(150.0, 0.20, [(1.0, 1.0), (2.0, 0.45), (3.1, 0.18)],
                  perde_bitis=72.0)
    govde = zarfla(govde, perkusif_zarf(len(govde), 0.001, 17.0))
    karistir(toplam, govde, 0.0, 1.0)

    # Tokmak: filtrelenmis gurultu patlamasi, tahta carpma tokmagi
    tokmak = svf(gurultu(0.05, tohum=907), 700.0, 1.6)
    tokmak = zarfla(tokmak, perkusif_zarf(len(tokmak), 0.0004, 85.0))
    karistir(toplam, tokmak, 0.0, 0.85)

    # Ikinci hafif sekme - "tak-tak" hissi, kapanis
    sekme = malet(120.0, 0.12, [(1.0, 1.0), (2.0, 0.3)], perde_bitis=88.0)
    sekme = zarfla(sekme, perkusif_zarf(len(sekme), 0.001, 30.0))
    karistir(toplam, sekme, 0.085, 0.42)

    toplam = doygunluk(toplam, 1.7)
    toplam = svf(toplam, 3200.0, 0.9)
    toplam = yanki(toplam, [(0.038, 0.12)])
    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["yanlis"]))


def ses_yanlis_b():
    """Yanlis - B secenegi: bogucu alcak ugultu, tokmaksiz. Daha yumusak red."""
    toplam = bos(0.30)
    ugultu = malet(196.0, 0.24, [(1.0, 1.0), (1.5, 0.5), (2.0, 0.35)],
                   perde_bitis=155.56)
    ugultu = zarfla(ugultu, adsr(len(ugultu), 0.006, 0.07, 0.45, 0.12))
    karistir(toplam, ugultu, 0.0, 1.0)
    nefes = svf(gurultu(0.06, tohum=313), 420.0, 1.2)
    nefes = zarfla(nefes, perkusif_zarf(len(nefes), 0.003, 30.0))
    karistir(toplam, nefes, 0.0, 0.3)
    toplam = doygunluk(toplam, 1.4)
    toplam = svf(toplam, 2400.0, 0.9)
    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["yanlis-b"]))


def ses_pas():
    """
    Tahta uzerinde tas kaydirma. Perdesiz, notr, kisa.
    Ne odul ne ceza - sadece "gecti" hissi.
    """
    toplam = bos(0.16)

    # Kaydirma: bandpass merkezi yukaridan asagi suzulur
    kayma = gurultu(0.11, tohum=5501)
    kayma = svf_supurme(kayma, 2600.0, 900.0, rezonans=2.6, tur="band")
    kayma = zarfla(kayma, perkusif_zarf(len(kayma), 0.004, 26.0))
    karistir(toplam, kayma, 0.0, 1.0)

    # Baslangictaki kisa tahta tik
    tik = svf(gurultu(0.012, tohum=88), 1900.0, 1.8)
    tik = zarfla(tik, perkusif_zarf(len(tik), 0.0003, 220.0))
    karistir(toplam, tik, 0.0, 0.55)

    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["pas"]), 0.003)


def ses_pas_b():
    """Pas - B secenegi: iki kisa tahta tik. Daha kuru ve belirgin."""
    toplam = bos(0.16)
    for baslangic, kazanc, frekans in [(0.0, 1.0, 1500.0), (0.055, 0.7, 1180.0)]:
        tik = malet(frekans, 0.05, [(1.0, 1.0), (2.4, 0.3)])
        tik = zarfla(tik, perkusif_zarf(len(tik), 0.0005, 120.0))
        karistir(toplam, tik, baslangic, kazanc)
        tahta = svf(gurultu(0.02, tohum=int(frekans)), 2400.0, 1.5)
        tahta = zarfla(tahta, perkusif_zarf(len(tahta), 0.0003, 190.0))
        karistir(toplam, tahta, baslangic, kazanc * 0.4)
    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["pas-b"]), 0.003)


def ses_tik():
    """Son 10 saniye tiki. Cok kisik, kuru, ahsap. Sinir bozmamali."""
    toplam = bos(0.055)
    ping = malet(760.0, 0.045, [(1.0, 1.0), (3.2, 0.22), (6.1, 0.07)])
    ping = zarfla(ping, perkusif_zarf(len(ping), 0.0012, 78.0))
    karistir(toplam, ping, 0.0, 1.0)
    tahta = svf(gurultu(0.016, tohum=451), 1700.0, 1.4)
    tahta = zarfla(tahta, perkusif_zarf(len(tahta), 0.0005, 170.0))
    karistir(toplam, tahta, 0.0, 0.32)
    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["tik"]), 0.002)


def ses_gerisayim():
    """
    3-2-1 blip'i. Yumusak atak, yuvarlak tini, belirgin ama sert degil.
    Son 10 saniye tikinden acikca ayrilir - daha uzun ve perdesi net.
    """
    toplam = bos(0.30)
    ana = malet(523.25, 0.24, [(1.0, 1.0), (2.0, 0.28), (3.0, 0.10)])
    ana = zarfla(ana, perkusif_zarf(len(ana), 0.010, 13.0))   # yumusak atak
    karistir(toplam, ana, 0.0, 1.0)
    alt = malet(261.63, 0.20, [(1.0, 1.0), (2.0, 0.2)])
    alt = zarfla(alt, perkusif_zarf(len(alt), 0.012, 15.0))
    karistir(toplam, alt, 0.0, 0.34)
    toplam = svf(toplam, 4200.0, 0.85)
    toplam = yanki(toplam, [(0.045, 0.14)])
    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["gerisayim"]))


def ses_basla():
    """Geri sayim bitti. Yukselen ikili malet - haydi baslayalim."""
    toplam = bos(0.34)
    for frekans, baslangic, kazanc in [(659.25, 0.0, 0.9), (987.77, 0.075, 1.0)]:
        n = malet(frekans, 0.24, MARIMBA)
        n = zarfla(n, perkusif_zarf(len(n), 0.002, 17.0))
        karistir(toplam, n, baslangic, kazanc)
    toplam = svf(toplam, 8000.0, 0.8)
    toplam = yanki(toplam, [(0.036, 0.16), (0.075, 0.07)])
    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["basla"]))


def ses_korna():
    """
    Tur bitis kornasi. Pirinc akor - kare dalga vizildamasi degil.
    Testere dalgasi + alcak geciren filtre = sicak nefesli calgi tinisi.
    """
    sure = 0.75
    toplam = bos(sure + 0.25)
    detune = 1.0016
    for frekans, kazanc in [(146.83, 0.55), (220.00, 1.00), (293.66, 0.70)]:
        a = testere(frekans, sure, harmonik=12)
        b = testere(frekans * detune, sure, harmonik=12)
        katman = [(x + y) * 0.5 for x, y in zip(a, b)]
        katman = zarfla(katman, adsr(len(katman), 0.025, 0.12, 0.75, 0.28))
        karistir(toplam, katman, 0.0, kazanc)
    toplam = svf(toplam, 2600.0, 1.1)
    toplam = doygunluk(toplam, 1.25)
    toplam = yanki(toplam, [(0.055, 0.16), (0.11, 0.07)])
    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["korna"]))


def ses_sonkart():
    """
    Son kart bonusu basladi. Tremololu ikili - titrek, aceleci, gergin.
    Yarim ses araligi (A4-A#4) kasitli tedirginlik verir.
    """
    toplam = bos(0.40)
    for frekans, baslangic, kazanc in [(440.00, 0.0, 0.9), (466.16, 0.13, 1.0)]:
        n = malet(frekans, 0.26, [(1.0, 1.0), (2.0, 0.4), (3.0, 0.26), (4.7, 0.1)])
        n = zarfla(n, perkusif_zarf(len(n), 0.0025, 15.0))
        n = tremolo(n, 13.0, 0.42)
        karistir(toplam, n, baslangic, kazanc)
    toplam = doygunluk(toplam, 1.4)
    toplam = svf(toplam, 5200.0, 0.9)
    toplam = yanki(toplam, [(0.04, 0.14)])
    return kenar_yumusat(rms_normalize(toplam, HEDEF_RMS["sonkart"]))


SESLER = {
    "dogru":     ses_dogru,
    "yanlis":    ses_yanlis,
    "yanlis-b":  ses_yanlis_b,
    "pas":       ses_pas,
    "pas-b":     ses_pas_b,
    "tik":       ses_tik,
    "gerisayim": ses_gerisayim,
    "basla":     ses_basla,
    "korna":     ses_korna,
    "sonkart":   ses_sonkart,
}


def wav_yaz(ad, veri):
    os.makedirs(CIKTI_KLASORU, exist_ok=True)
    yol = os.path.join(CIKTI_KLASORU, ad + ".wav")
    kareler = b"".join(
        struct.pack("<h", int(max(-1.0, min(1.0, d)) * 32767)) for d in veri)
    with wave.open(yol, "wb") as dosya:
        dosya.setnchannels(1)
        dosya.setsampwidth(2)
        dosya.setframerate(ORNEKLEME_HIZI)
        dosya.writeframes(kareler)
    return yol, len(veri) / ORNEKLEME_HIZI


def main():
    print("NafuTabu ses ureteci  -  ahsap ve pirinc\n")
    for ad, uretici in SESLER.items():
        veri = uretici()
        yol, sure = wav_yaz(ad, veri)
        tepe = max(abs(d) for d in veri)
        print(f"  {ad:11s} {sure * 1000:6.0f} ms  "
              f"{os.path.getsize(yol) / 1024:6.1f} KB  tepe {tepe:.2f}")
    print(f"\n{len(SESLER)} ses uretildi -> assets/ses/")


if __name__ == "__main__":
    main()
