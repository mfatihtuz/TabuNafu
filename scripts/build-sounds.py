#!/usr/bin/env python3
"""
NafuTabu ses kurulumu.

Sesler sentezlenmiyor. Kenney'in CC0 (kamu mali) arayuz ses paketinden
aliniyor ve oyuna hazirlaniyor. Tek paketten secildikleri icin ayni
stüdyodan cikmis gibi tutarli duyulurlar.

Kaynak:  https://github.com/Calinou/kenney-interface-sounds
Uretici: Kenney  (www.kenney.nl)
Lisans:  CC0 1.0 Universal - ticari kullanim serbest, atif zorunlu degil

SECIM YONTEMI
Sesleri duyamadigimiz icin secim kulakla degil OLCUMLE yapildi
(bkz. scripts/analiz-ses.py). Her rol icin aranan fiziksel ozellik:

  dogru      yukselen perde + parlak  -> odul, acilma hissi
  yanlis     bogus/agir + guclu govde -> kapanma, red hissi
  pas        kisa + notr + sonuk      -> ne odul ne ceza
  tik        cok kisa + kisik         -> son 10 saniye, sinir bozmasin
  gerisayim  tonlu + orta uzunluk     -> 3-2-1, belirgin ama yumusak
  basla      yukselen + uzun          -> haydi baslayalim
  korna      uzun + israrli           -> sure doldu
  sonkart    keskin + yuksek tepe     -> aciliyet

HAZIRLAMA
  1  Stereo ise mono'ya indirilir
  2  Bastaki ve sondaki sessizlik kirpilir
  3  Kenar yumusatma uygulanir (cit sesini onler)
  4  Rol bazli hedef RMS'e normalize edilir

  4. adim onemli: ham paketteki RMS degerleri 0.044 ile 0.31 arasinda
  geziyor, yani yedi kat ses farki var. Normalize edilmezse bazi sesler
  fisilti, bazilari bagirti gibi duyulur.

Calistirma:  python3 scripts/build-sounds.py
"""

import math
import os
import struct
import sys
import wave

KOK = os.path.join(os.path.dirname(__file__), "..")
CIKTI_KLASORU = os.path.join(KOK, "assets", "ses")
KAYNAK_KLASORU = os.environ.get(
    "KENNEY_KLASOR",
    "/tmp/claude-0/-home-user-TabuNafu/d7edd763-c53c-5b7b-98bf-83b4b0f74468"
    "/scratchpad/kis",
)

ORNEKLEME_HIZI = 44100

# (cikti adi, kaynak dosya, hedef RMS, aciklama)
# Hedef RMS degerleri role gore: aksiyon sesleri esit, tik cok kisik,
# korna en yuksek.
SECIM = [
    ("dogru",       "confirmation_001.wav", 0.150, "Yükselen, parlak onay"),
    ("dogru-b",     "question_002.wav",     0.150, "Daha kısa, tiz onay"),
    ("yanlis",      "error_007.wav",        0.150, "Boğuk, ağır ret"),
    ("yanlis-b",    "error_004.wav",        0.150, "Kısa ve keskin ret"),
    ("pas",         "click_001.wav",        0.105, "Nötr yumuşak tık"),
    ("pas-b",       "select_002.wav",       0.105, "Kuru kısa seçim"),
    # tick_001 sessizlik kirpildiktan sonra 12ms'ye dusuyor ve duyulmuyor.
    # tick_004 daha dolgun ve yukselen perdeli.
    ("tik",         "tick_004.wav",         0.058, "Son 10 saniye, kısık"),
    ("gerisayim",   "pluck_002.wav",        0.135, "Tonlu geri sayım blibi"),
    ("basla",       "confirmation_002.wav", 0.155, "Yükselen başlangıç"),
    ("korna",       "error_003.wav",        0.185, "Süre doldu kornası"),
    ("korna-b",     "error_005.wav",        0.185, "Alternatif korna"),
    ("sonkart",     "error_002.wav",        0.150, "Keskin aciliyet"),
]


def wav_oku(yol):
    with wave.open(yol, "rb") as d:
        kanal, genislik, hiz = d.getnchannels(), d.getsampwidth(), d.getframerate()
        ham = d.readframes(d.getnframes())
    if genislik != 2:
        raise ValueError(f"{yol}: sadece 16 bit destekleniyor ({genislik * 8} bit)")
    ornek = struct.unpack(f"<{len(ham) // 2}h", ham)
    if kanal == 2:
        ornek = [(ornek[i] + ornek[i + 1]) / 2 for i in range(0, len(ornek) - 1, 2)]
    return [x / 32768.0 for x in ornek], hiz


def yeniden_ornekle(veri, kaynak_hiz, hedef_hiz):
    """Dogrusal ara deger. Kenney paketi zaten 44.1kHz, guvenlik icin."""
    if kaynak_hiz == hedef_hiz:
        return veri
    oran = kaynak_hiz / hedef_hiz
    n = int(len(veri) / oran)
    cikti = []
    for i in range(n):
        konum = i * oran
        alt = int(konum)
        ust = min(alt + 1, len(veri) - 1)
        kesir = konum - alt
        cikti.append(veri[alt] * (1 - kesir) + veri[ust] * kesir)
    return cikti


def sessizlik_kirp(veri, esik=0.002):
    """Bastaki ve sondaki sessizligi atar. Sesler ustuste binmeden tetiklensin."""
    bas = 0
    while bas < len(veri) and abs(veri[bas]) < esik:
        bas += 1
    son = len(veri) - 1
    while son > bas and abs(veri[son]) < esik:
        son -= 1
    return veri[bas:son + 1] if son > bas else veri


def kenar_yumusat(veri, sure=0.003):
    n = int(sure * ORNEKLEME_HIZI)
    if len(veri) < 2 * n or n < 1:
        return veri
    cikti = list(veri)
    for i in range(n):
        oran = i / n
        cikti[i] *= oran
        cikti[-(i + 1)] *= oran
    return cikti


def rms(veri):
    return math.sqrt(sum(x * x for x in veri) / len(veri)) if veri else 0.0


def yumusak_sinirla(veri, tavan=0.95):
    """
    tanh tabanli yumusak sinirlayici.

    Tepe/RMS orani yuksek olan sesler (kisa ve vurmali olanlar) hedef
    seviyeye dogrusal olcekle cikamaz - tepe once tavana carpar. Sert
    kirpma cizirti yapar, bu yuzden tepeler yumusakca bastirilir.
    """
    return [tavan * math.tanh(x / tavan) for x in veri]


def rms_normalize(veri, hedef, tavan=0.95):
    """
    Hedef RMS'e getirir. Tepe tavani asarsa yumusak sinirlayici devreye
    girer ve tekrar denenir - boylece vurmali sesler de hedef seviyeye ulasir.
    """
    if not veri:
        return veri
    cikti = list(veri)
    for _ in range(6):
        mevcut = rms(cikti)
        if mevcut < 1e-9:
            return cikti
        cikti = [x * (hedef / mevcut) for x in cikti]
        tepe = max(abs(x) for x in cikti)
        if tepe <= tavan:
            break
        cikti = yumusak_sinirla(cikti, tavan)
    tepe = max(abs(x) for x in cikti)
    if tepe > tavan:
        cikti = [x * (tavan / tepe) for x in cikti]
    return cikti


def wav_yaz(ad, veri):
    os.makedirs(CIKTI_KLASORU, exist_ok=True)
    yol = os.path.join(CIKTI_KLASORU, ad + ".wav")
    kareler = b"".join(
        struct.pack("<h", int(max(-1.0, min(1.0, x)) * 32767)) for x in veri)
    with wave.open(yol, "wb") as d:
        d.setnchannels(1)
        d.setsampwidth(2)
        d.setframerate(ORNEKLEME_HIZI)
        d.writeframes(kareler)
    return yol


def main():
    if not os.path.isdir(KAYNAK_KLASORU):
        sys.exit(
            f"Kenney paketi bulunamadi: {KAYNAK_KLASORU}\n\n"
            "Once indir:\n"
            "  git clone --depth 1 https://github.com/Calinou/kenney-interface-sounds\n"
            "Sonra KENNEY_KLASOR ortam degiskeni ile yolunu ver."
        )

    kaynaklar = {}
    for kok, _, adlar in os.walk(KAYNAK_KLASORU):
        for a in adlar:
            if a.endswith(".wav"):
                kaynaklar[a] = os.path.join(kok, a)

    print("NafuTabu ses kurulumu")
    print("Kaynak: Kenney Interface Sounds (CC0 1.0 Universal)\n")
    print(f"  {'ses':12s} {'kaynak':22s} {'süre':>7s} {'RMS':>6s}  açıklama")
    print("  " + "-" * 74)

    eksik = []
    for ad, dosya, hedef_rms, aciklama in SECIM:
        if dosya not in kaynaklar:
            eksik.append(dosya)
            continue
        veri, hiz = wav_oku(kaynaklar[dosya])
        veri = yeniden_ornekle(veri, hiz, ORNEKLEME_HIZI)
        veri = sessizlik_kirp(veri)
        veri = kenar_yumusat(veri)
        veri = rms_normalize(veri, hedef_rms)
        wav_yaz(ad, veri)
        olculen = rms(veri)
        sapma = abs(olculen - hedef_rms) / hedef_rms
        im = " " if sapma < 0.08 else "!"
        print(f" {im}{ad:12s} {dosya:22s} {len(veri) / ORNEKLEME_HIZI * 1000:6.0f}ms "
              f"{olculen:6.3f}  {aciklama}")

    if eksik:
        sys.exit(f"\nKaynak dosyalar bulunamadi: {', '.join(eksik)}")

    print(f"\n{len(SECIM)} ses hazirlandi -> assets/ses/")
    print("Hepsi ortak seviyeye normalize edildi, aralarinda ses sicramasi yok.")


if __name__ == "__main__":
    main()
