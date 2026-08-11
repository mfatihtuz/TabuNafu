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
python3 scripts/build-sounds.py      # marimba ses ailesini üret
python3 scripts/test-ses.py          # ses doğrulaması
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

## Tasarım

**Tema: Okey Tahtası.** Oyunun dünyası bir Türk aile masası, palet de oradan geliyor:
koyu ceviz zemin, fildişi okey taşı rengi kart, pirinç kaplama ve okey taşlarının
dört rengi (kırmızı, mavi, sarı, yeşil).

```
CEVİZ   #1F1913     TAŞ     #F7F0E1     PİRİNÇ  #D4A050
DOĞRU   #12A150     YANLIŞ  #E01E37     PAS     #F5A524
```

Kart metni kontrastı 16.4:1, yasaklı kelimeler 7.5:1. İkisi de WCAG AAA.
Omuz üstünden bakan denetçi rahatça okur.

**Ses: Marimba ailesi.** Bütün sesler tek çalgıdan üretiliyor, bu yüzden aralarında
stil uyumsuzluğu olması yapısal olarak imkânsız. Anlam farkı çalgı değiştirerek değil,
**perde, aralık ve çalış tekniğiyle** veriliyor — gerçek bir perküsyoncunun yapacağı gibi.

```
doğru      F5·A5·C6 yükselen majör, çan tınılı tokmak
yanlış     G3·Eb3 alçalan ağır ikili, bas marimba
pas        D5 tek nötr nota, melodik yön taşımaz
tik        A6 çok kısa tiz tap
geri sayım A4 yumuşak orta nota
başla      C5·G5·C6 yükselen üçlü
korna      A3+E3 tremolo rulo, kapanış vuruşu
son kart   hızlanan yükselen dizi
```

Marimbayı ahşap yapan şey her kısmi tonun **farklı hızda** sönmesi: ana ton uzun sürer,
üstteki tonlar çabuk kaybolur. Hepsine aynı zarf verilirse elektronik org duyulur.
Model ayrıca tokmağın tahtaya çarpmasını, rezonatör borusunun içi boş tınısını ve
vuruş anındaki kısa perde düşüşünü içeriyor.

Doğrulama `scripts/test-ses.py` ile yapılıyor. Marimbanın 2. kısmi tonu tam 4x'te
olduğu için otokorelasyonla perde takibi oktav hatası veriyor — bunun yerine beklenen
frekanslara bakan Goertzel süzgeci kullanılıyor. Notaların tasarlanan sırayla girdiği,
seviyelerin hedefte olduğu ve kırpma olmadığı ölçülüyor.

**Türkçe büyük harf** iki yerde tuzak kuruyor ve ikisi de kapatıldı:
CSS `text-transform` tarayıcı diline bakar, JS `toUpperCase()` ise `i` harfini
`İ` değil `I` yapar. Metinler doğrudan doğru büyük harfle yazılıyor, kod tarafında
`trUpper()` kullanılıyor.

## Lisanslar

- İkonlar: [Lucide](https://lucide.dev) — ISC
- Yazı tipleri: Baloo 2, Manrope — SIL Open Font License 1.1
- Ses efektleri: bu depoda marimba modeliyle üretildi, dış bağımlılık yok

**Yazı tipi notu:** Başlık fontu Fredoka'dan Baloo 2'ye geçirildi. Fredoka'nın
Ş çengeli ve İ noktası gövdeden çok daha ince çizilmiş, büyük puntoda göze batıyordu.
Baloo 2'nin Latin Extended çizimleri gövdeyle aynı ağırlıkta.
