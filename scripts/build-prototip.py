#!/usr/bin/env python3
"""
Prototip derleyici.

tasarim/prototip.html kaynagini alir, icine su varliklari gomer:
  - Yazi tipleri (Fredoka + Manrope, latin + latin-ext)  -> woff2 data URI
  - Ikonlar (Lucide, ISC lisansi)                        -> JSON
  - Ses efektleri (build-sounds.py ciktisi)              -> base64 WAV

Ayrica %%ikon-adi%% isaretleyicilerini <i data-i="ikon-adi"></i> dugumlerine
cevirir. Boylece kaynak dosya okunabilir kalir, cikti tek parca calisir.

Cikti: tasarim/prototip-derli.html  (tek dosya, disa bagimliligi yok)
"""

import base64
import json
import os
import re
import sys

KOK = os.path.join(os.path.dirname(__file__), "..")
KAYNAK = os.path.join(KOK, "tasarim", "prototip.html")
CIKTI = os.path.join(KOK, "tasarim", "prototip-derli.html")
SES_KLASORU = os.path.join(KOK, "assets", "ses")
VARLIK_KLASORU = os.path.join(KOK, "tasarim", "varliklar")

SES_ADLARI = ["dogru", "dogru-b", "yanlis", "yanlis-b", "pas", "pas-b",
              "tik", "gerisayim", "basla", "korna", "korna-b", "sonkart"]


def oku(yol):
    with open(yol, encoding="utf-8") as d:
        return d.read()


def main():
    html = oku(KAYNAK)

    # --- Yazi tipleri ---
    font_yolu = os.path.join(VARLIK_KLASORU, "fonts.css")
    if not os.path.exists(font_yolu):
        sys.exit(f"Yazi tipi CSS bulunamadi: {font_yolu}")
    fontlar = oku(font_yolu)

    # --- Ikonlar ---
    ikon_yolu = os.path.join(VARLIK_KLASORU, "ikonlar.json")
    if not os.path.exists(ikon_yolu):
        sys.exit(f"Ikon JSON bulunamadi: {ikon_yolu}")
    ikonlar = oku(ikon_yolu)

    # --- Sesler ---
    sesler = {}
    for ad in SES_ADLARI:
        yol = os.path.join(SES_KLASORU, ad + ".wav")
        if not os.path.exists(yol):
            sys.exit(f"Ses bulunamadi: {yol}  (once build-sounds.py calistir)")
        with open(yol, "rb") as d:
            sesler[ad] = base64.b64encode(d.read()).decode()

    # --- Isaretleyicileri dugume cevir ---
    isaret_sayisi = len(re.findall(r"%%[a-z0-9-]+%%", html))
    html = re.sub(r"%%([a-z0-9-]+)%%", r'<i data-i="\1"></i>', html)

    # --- Gomme ---
    html = html.replace("__FONTS__", fontlar)
    html = html.replace("__IKONLAR__", ikonlar)
    html = html.replace("__SESLER__", json.dumps(sesler))

    for kalan in ("__FONTS__", "__IKONLAR__", "__SESLER__"):
        if kalan in html:
            sys.exit(f"Yer tutucu doldurulamadi: {kalan}")

    with open(CIKTI, "w", encoding="utf-8") as d:
        d.write(html)

    boyut = os.path.getsize(CIKTI)
    print("Prototip derlendi\n")
    print(f"  yazi tipi   {len(fontlar) / 1024:8.1f} KB")
    print(f"  ikon        {len(ikonlar) / 1024:8.1f} KB   "
          f"({len(json.loads(ikonlar))} adet, tek aile)")
    print(f"  ses         {sum(len(v) for v in sesler.values()) / 1024:8.1f} KB   "
          f"({len(sesler)} adet)")
    print(f"  isaretleyici{isaret_sayisi:8d}    ikon dugumune cevrildi")
    print(f"\n  -> {os.path.relpath(CIKTI, KOK)}   {boyut / 1024:.0f} KB")


if __name__ == "__main__":
    main()
