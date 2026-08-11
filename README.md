# NafuTabu — Yasak Kelime Anlat Bakalım

Tek telefonda oynanan, tamamen çevrimdışı Türkçe kelime anlatma oyunu.
Reklam yok, satın alma yok, hesap yok, internet yok.

## Şu anki durum

**Adım 0 — Tasarım onayı.** Henüz React Native kodu yazılmadı. Önce tıklanabilir
prototip hazırlandı, onay gelince uygulamaya geçilecek.

## Klasörler

```
tasarim/
  prototip.html          kaynak (okunabilir, yer tutuculu)
  prototip-derli.html    derlenmiş tek dosya (yazı tipi + ikon + ses gömülü)
  varliklar/             yazı tipleri ve ikon seti
  ekranlar/              test sırasında alınan ekran görüntüleri
assets/ses/              sentezlenmiş ses efektleri (WAV)
scripts/                 üretim ve doğrulama araçları
```

## Komutlar

```bash
python3 scripts/build-sounds.py      # ses efektlerini sıfırdan sentezle
python3 scripts/build-prototip.py    # prototipi tek dosyaya derle
node scripts/validate-words.mjs      # kelime kalite kapısı
node scripts/test-prototip.mjs       # tarayıcıda tam akış testi
node scripts/test-pas-turu.mjs       # pas turu mekaniği testi
```

`test-*` betikleri Playwright ister: `npm i playwright`

## Oyun kuralları

Anlatan telefonu tutar, rakip takımdan biri omzunun üstünden ekrana bakıp
yasaklı kelimeleri denetler.

- Doğru **+1**, yasaklı kelime veya kural dışı **−1**, pas **0**
- Süre 30–150 saniye (5'er), pas hakkı 0–7
- Bitiş: hedef puan, tur sayısı veya sınırsız

### Seri akışı

1. **Ana geçiş** — kategori karılır, deste bitmeden hiçbir kart tekrar gelmez
2. **Pas turu** — ana geçişte pas geçilenler tek seferlik mini seri olur.
   Bu turda pas geçilenler tekrar toplanmaz, sonsuz döngü olmaz
3. **Seri bitti** — yeniden karıştır veya kategori değiştir, puanlar korunur

### Son kart hakkı (ayardan açılır, varsayılan kapalı)

Süre bitince korna çalar, kart kırmızıya döner, 5 saniyelik ikinci sayaç başlar.
**Pas kilitlenir** — yeni kart alıp turu uzatma suistimali engellenir.

## Kelime havuzu

20 kategori + KARIŞIK. Genel 600, diğerleri 250'şer kart. Toplam **5.350 kart**.
Zorluk dağılımı: %10 çok kolay · %35 kolay · %35 orta · %15 zor · %5 çok zor.

Kaynak format CSV (Excel'de düzenlenebilir), build adımında JSON'a çevrilir.

## Lisanslar

- İkonlar: [Lucide](https://lucide.dev) — ISC
- Yazı tipleri: Fredoka, Manrope — SIL Open Font License 1.1
- Ses efektleri: bu depoda sıfırdan sentezlendi
