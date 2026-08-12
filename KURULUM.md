# NafuTabu — Telefona Kurma Rehberi

Bu rehber **senin ne yapman gerektiğini** anlatır. Kod tarafındaki her şey
hazır, GitHub Actions üzerinden otomatik çalışıyor. Senden istenen tek şey
birkaç hesap açmak ve bir anahtar yapıştırmak.

---

## ⚠️ Windows kullanıyorsan önce bunu yap

PowerShell varsayılan olarak betik çalıştırmayı engelliyor. `npm` ve `npx`
birer `.ps1` betiği olduğu için ikisi de şu hatayı verir:

```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because
running scripts is disabled on this system.
```

**Çözüm** — PowerShell'i aç ve şunu yaz:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Onay sorduğunda **Y** yazıp Enter'a bas. Yönetici yetkisi gerekmez, sadece
senin kullanıcın için geçerli olur ve bir kez yapılır.

> `RemoteSigned` güvenli tarafta kalan ayardır: kendi bilgisayarındaki
> betikler çalışır, internetten indirilenler imza ister.

**Bunu yapmak istemiyorsan** alternatif olarak her komuta `.cmd` ekle:

```powershell
npm.cmd ci
npx.cmd eas-cli login
```

Aynı işi görür. PowerShell `.cmd` dosyalarını engellemiyor.

---

## Yol A — iPhone / TestFlight

Apple sertifika istediği için burada bilgisayarında **bir kez** komut
çalıştırman gerekiyor. Derleme Apple'ın değil Expo'nun bulut sunucusunda
olur, yani **Mac'e ihtiyacın yok**.

### Ön koşullar

- Apple Developer hesabı (yıllık 99 dolar) — sende var
- Node 22 — https://nodejs.org adresinden **LTS** sürümü kur
- Expo hesabı (ücretsiz) — https://expo.dev/signup
- Windows'taysan yukarıdaki PowerShell ayarı

### Adım 1 · Projeyi hazırla

```powershell
git clone https://github.com/mfatihtuz/TabuNafu.git
cd TabuNafu
git checkout claude/tabu-xl-mobile-game-d3dicr
npm ci
```

> `npm ci` yaklaşık 590 paket indirir, birkaç dakika sürer.

### Adım 2 · Expo hesabına gir

```powershell
npx eas-cli login
```

expo.dev'de açtığın hesabın e-postası ve şifresi sorulur.

### Adım 3 · iOS derlemesini başlat

```powershell
npx eas-cli build --platform ios --profile yayin
```

> **Profil `yayin` olmalı, `onizleme` değil.** `onizleme` sadece kayıtlı
> cihazlara link ile kurulan ad-hoc paket üretir ve TestFlight'a
> gönderilemez. TestFlight App Store imzası ister, onu `yayin` verir.

Sırayla şunlar sorulacak:

| Soru | Cevabın |
|---|---|
| "Would you like to automatically create an EAS project?" | **Y** |
| "Do you want to log in to your Apple account?" | **Y** |
| Apple ID | Apple Developer hesabının e-postası |
| Password | Apple hesap şifren |
| İki adımlı doğrulama kodu | Telefonuna gelen 6 haneli kod |
| Birden fazla Apple Team varsa | Developer hesabının olduğu takımı seç |
| "Generate a new Apple Distribution Certificate?" | **Y** |
| "Generate a new Apple Provisioning Profile?" | **Y** |

Sonra derleme başlar, ~15-20 dakika sürer. Terminal bir bağlantı gösterir,
oradan ilerlemeyi izleyebilirsin.

> Sertifikalar bir kez üretilir ve Expo hesabında saklanır. Bir daha
> sorulmaz.

### Adım 4 · Değişen dosyayı geri gönder

İlk derlemede EAS `app.json` dosyasına bir proje kimliği ekler. Bu kimlik
GitHub Actions'ın da çalışması için gerekli:

```powershell
git add app.json
git commit -m "EAS proje kimligi eklendi"
git push
```

### Adım 5 · TestFlight'a gönder

```powershell
npx eas-cli submit --platform ios --latest
```

Apple'ın işlemesi 10-30 dakika sürer. Sonra:

1. https://appstoreconnect.apple.com adresine gir
2. **My Apps → NafuTabu → TestFlight**
3. **Internal Testing** grubuna aile üyelerinin Apple ID e-postalarını ekle
4. Onlara davet gider. App Store'dan **TestFlight** uygulamasını kurup
   oyunu oradan indirirler

### Bundan sonrası otomatik

3. adımı bir kez yaptıktan sonra iOS derlemelerini GitHub'dan
çalıştırabilirsin, bilgisayara gerek kalmaz. Bunun için `EXPO_TOKEN`
secret'ını eklemen yeterli (aşağıda Yol B'nin 2. ve 3. adımı).

Sonra: https://github.com/mfatihtuz/TabuNafu/actions/workflows/testflight.yml
→ **Run workflow**

---

## Yol B — Android APK  (bilgisayara kurulum yok)

Toplam süre: ilk sefer ~20 dakika, sonrakiler 2 dakika.

### Adım 1 · Expo hesabı aç  *(1 dakika, ücretsiz)*

1. https://expo.dev/signup adresine git
2. E-posta ve şifre ile kaydol
3. E-postanı doğrula

> Ücretsiz plan aylık 30 derleme veriyor. Aile testi için fazlasıyla yeter.

### Adım 2 · Erişim anahtarı üret  *(1 dakika)*

1. https://expo.dev/settings/access-tokens adresine git
2. **Create token** düğmesine bas
3. İsim ver, örneğin `github-actions`
4. **Create** de
5. Çıkan uzun metni kopyala

> ⚠️ Bu anahtar bir daha gösterilmez. Kopyaladığından emin ol.
> Kaybedersen sil ve yenisini üret, sorun olmaz.

### Adım 3 · Anahtarı GitHub'a gir  *(1 dakika)*

1. https://github.com/mfatihtuz/TabuNafu/settings/secrets/actions adresine git
2. **New repository secret** düğmesine bas
3. **Name** kutusuna tam olarak şunu yaz: `EXPO_TOKEN`
4. **Secret** kutusuna 2. adımda kopyaladığın anahtarı yapıştır
5. **Add secret** de

> Bu anahtar şifrelenmiş olarak saklanır, kimse göremez, sen bile bir daha
> okuyamazsın. Sadece iş akışları kullanabilir.

### Adım 4 · APK üret  *(ilk sefer ~15 dakika, sonra ~8 dakika)*

1. https://github.com/mfatihtuz/TabuNafu/actions/workflows/apk.yml adresine git
2. Sağdaki **Run workflow** düğmesine bas
3. Dal olarak `claude/tabu-xl-mobile-game-d3dicr` seç
4. Profil `onizleme` kalsın
5. Yeşil **Run workflow** düğmesine bas

Sonra bekle. Sayfayı yenileyip çalışan işe tıklarsan ilerlemeyi görürsün.

> İlk derlemede EAS sana Android imza anahtarı üretmek isteyecek ve otomatik
> üretecek. Hiçbir şey girmen gerekmiyor.

### Adım 5 · Telefona kur  *(2 dakika)*

1. İş bitince aynı sayfada **Summary** bölümüne bak, orada indirme
   bağlantısı yazıyor
2. Bağlantıyı Android telefonunda aç, APK inecek
3. İndirilen dosyaya dokun
4. Android "bilinmeyen kaynak" uyarısı verirse **Ayarlar → İzin ver** de
5. Kur ve aç

Bitti. Aileyle oynayabilirsin.

> APK'yı WhatsApp'tan da gönderebilirsin, herkes kendi telefonuna kurar.

---

## Yol C — Hızlı bakış  (derleme beklemeden)

Sadece "çalışıyor mu" görmek istiyorsan, derleme beklemeden telefonunda
açabilirsin.

### Bilgisayarda

```bash
git clone https://github.com/mfatihtuz/TabuNafu.git
cd TabuNafu
git checkout claude/tabu-xl-mobile-game-d3dicr
npm ci
npm start
```

Terminalde bir QR kod çıkacak.

### Telefonda

1. **Expo Go** uygulamasını kur
   - Android: Google Play
   - iPhone: App Store
2. Telefon ile bilgisayar **aynı Wi-Fi ağında** olsun
3. Expo Go'yu aç, **Scan QR code** de, terminaldeki kodu okut

> Aynı ağda değilseniz veya QR çalışmazsa: `npm start -- --tunnel`
> Bu daha yavaştır ama farklı ağlardan da çalışır.

**Sınırı:** Expo Go geliştirme aracıdır. Uygulama çalışır ama açılışı yavaştır
ve kalıcı değildir. Gerçek testi APK veya TestFlight ile yap.

---

## Senden istenen değerlerin tamamı

Tek listede topluyorum. Bunlar dışında hiçbir şey girmen gerekmiyor.

| Nerede | Ne | Zorunlu mu |
|---|---|---|
| expo.dev | E-posta ve şifre (hesap açmak için) | Android için evet |
| GitHub secret | `EXPO_TOKEN` anahtarı | Android için evet |
| Terminal (bir kez) | Apple ID, şifre, doğrulama kodu | Sadece iPhone için |

Android imza anahtarını EAS kendisi üretir. Uygulama adı, paket kimliği,
sürüm numarası, ikon, renkler — hepsi kodda tanımlı, dokunman gerekmiyor.

---

## Sık karşılaşılan sorunlar

**PowerShell "running scripts is disabled" diyor**
Rehberin en başındaki `Set-ExecutionPolicy` komutunu çalıştır, ya da
komutlara `.cmd` ekle: `npm.cmd ci`

**"EXPO_TOKEN sirri tanimli degil" hatası**
3. adımı atlamışsın veya secret adını yanlış yazmışsın. Adı tam olarak
`EXPO_TOKEN` olmalı, büyük harf ve alt çizgi ile.

**Android "Bu uygulama kurulamadı" diyor**
Ayarlar → Güvenlik → Bilinmeyen kaynaklardan kuruluma izin ver. Telefon
markasına göre menü adı değişebilir.

**Derleme kuyrukta uzun bekliyor**
Ücretsiz planda sıra bekleme olabilir. İş akışı sayfasında kalan süreyi
görürsün, bir şey yapman gerekmiyor.

**Expo Go'da QR çalışmıyor**
`npm start -- --tunnel` dene. Kurumsal ağlarda veya misafir Wi-Fi'da
normal mod çalışmaz.

**Aylık derleme hakkım bitti**
Ücretsiz planda ayda 30 derleme var. Beklersen ayın başında sıfırlanır.

---

## Neler otomatik çalışıyor

Sen hiçbir şey yapmadan, her kod gönderiminde şunlar kontrol ediliyor:

- TypeScript tip denetimi
- 54 birim testi
- Kelime kalite kapısı (kök çakışması, tekrar, uzunluk, büyük harf)
- Üretilen JSON'un kaynak CSV ile senkron olup olmadığı
- Android ve iOS paketlerinin gerçekten derlenip derlenmediği

Bir şey bozulursa GitHub sana e-posta atar. Sonuçları
https://github.com/mfatihtuz/TabuNafu/actions adresinden görebilirsin.
