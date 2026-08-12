/**
 * Oyun ayarlari: sure, pas hakki, bitis modu, son kart hakki, ses.
 */

import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Buton, GeriButonu } from '../../src/arayuz/Buton';
import { Secici } from '../../src/arayuz/Secici';
import { Toggle } from '../../src/arayuz/Toggle';
import { UstYazi, Yazi } from '../../src/arayuz/Yazi';
import { Zemin } from '../../src/arayuz/Zemin';
import { oyunDeposu } from '../../src/oyun/durum';
import {
  PAS_SECENEKLERI,
  PUAN_SECENEKLERI,
  SON_KART_SURE_SECENEKLERI,
  SURE_SECENEKLERI,
  TUR_SECENEKLERI,
  type BitisModu,
} from '../../src/oyun/tipler';
import { BOSLUK, SAYFA_YAN, YARICAP } from '../../src/tema/golgeler';
import { RENK } from '../../src/tema/renkler';
import { BOYUT } from '../../src/tema/yazitipi';

const MODLAR: readonly { kimlik: BitisModu; etiket: string }[] = [
  { kimlik: 'puan', etiket: 'Hedef Puan' },
  { kimlik: 'tur', etiket: 'Tur Sayısı' },
  { kimlik: 'sinirsiz', etiket: 'Sınırsız' },
];

export default function AyarEkrani() {
  const yonlendir = useRouter();
  const kenar = useSafeAreaInsets();

  const ayarlar = oyunDeposu((d) => d.ayarlar);
  const ayarGuncelle = oyunDeposu((d) => d.ayarGuncelle);
  const titresim = ayarlar.titresimAcik;

  return (
    <Zemin>
      <View style={[durum.kok, { paddingTop: kenar.top + 18, paddingBottom: kenar.bottom + 18 }]}>
        {/*
          Yan bosluk koke degil ogelere veriliyor. Boylece dikey ScrollView
          tam genislikte kalir ve icindeki yatay raylari kendi sinirinda
          kirpmaz - raylar ekran kenarina kadar akabilir.
        */}
        <View style={durum.yanBosluklu}>
          <GeriButonu onPress={() => yonlendir.back()} />
          <Yazi tur="baslik" boyut={BOYUT.baslik} style={durum.baslik}>
            Oyun Ayarları
          </Yazi>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={durum.liste}>
          <Secici
            baslik="TUR SÜRESİ"
            birim="saniye"
            secenekler={SURE_SECENEKLERI}
            deger={ayarlar.sure}
            titresimAcik={titresim}
            onSec={(sure) => ayarGuncelle({ sure })}
          />

          <Secici
            baslik="PAS HAKKI"
            birim="hak"
            secenekler={PAS_SECENEKLERI}
            deger={ayarlar.pasHakki}
            titresimAcik={titresim}
            onSec={(pasHakki) => ayarGuncelle({ pasHakki })}
          />

          <View style={durum.blok}>
            <View style={[durum.yanBosluklu, durum.blokBasi]}>
              <UstYazi>OYUN NASIL BİTSİN</UstYazi>
              <View style={durum.segment}>
                {MODLAR.map((m) => {
                  const secili = ayarlar.bitisModu === m.kimlik;
                  return (
                    <Pressable
                      key={m.kimlik}
                      onPress={() => ayarGuncelle({ bitisModu: m.kimlik })}
                      accessibilityRole="button"
                      accessibilityState={{ selected: secili }}
                      style={[durum.segmentDugme, secili && durum.segmentSecili]}
                    >
                      <Yazi
                        tur="cokKalin"
                        boyut={BOYUT.notr - 0.5}
                        renk={secili ? RENK.pirincUstu : RENK.sis}
                      >
                        {m.etiket}
                      </Yazi>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {ayarlar.bitisModu === 'puan' ? (
              <Secici
                baslik="HEDEF PUAN"
                secenekler={PUAN_SECENEKLERI}
                deger={ayarlar.hedefPuan}
                titresimAcik={titresim}
                onSec={(hedefPuan) => ayarGuncelle({ hedefPuan })}
              />
            ) : null}

            {ayarlar.bitisModu === 'tur' ? (
              <Secici
                baslik="TUR SAYISI"
                birim="tur"
                secenekler={TUR_SECENEKLERI}
                deger={ayarlar.turSayisi}
                titresimAcik={titresim}
                onSec={(turSayisi) => ayarGuncelle({ turSayisi })}
              />
            ) : null}

            {ayarlar.bitisModu === 'sinirsiz' ? (
              <Yazi boyut={BOYUT.notr} renk={RENK.sis} style={durum.yanBosluklu}>
                Kazanan ilan edilmez. Siz bırakana kadar puan sayılır.
              </Yazi>
            ) : null}
          </View>

          <View style={durum.yanBosluklu}>
            <Toggle
              baslik="Son Kart Hakkı"
              aciklama="Süre bitince ekrandaki kart için birkaç saniye daha. Pas kilitlenir."
              acik={ayarlar.sonKartHakki}
              titresimAcik={titresim}
              onDegis={(sonKartHakki) => ayarGuncelle({ sonKartHakki })}
            />
          </View>

          {ayarlar.sonKartHakki ? (
            <Secici
              baslik="BONUS SÜRE"
              birim="saniye"
              secenekler={SON_KART_SURE_SECENEKLERI}
              deger={ayarlar.sonKartSure}
              titresimAcik={titresim}
              onSec={(sonKartSure) => ayarGuncelle({ sonKartSure })}
            />
          ) : null}

          <View style={[durum.yanBosluklu, durum.blokBasi]}>
            <Toggle
              baslik="Ses Efektleri"
              acik={ayarlar.sesAcik}
              titresimAcik={titresim}
              onDegis={(sesAcik) => ayarGuncelle({ sesAcik })}
            />
            <Toggle
              baslik="Titreşim"
              acik={ayarlar.titresimAcik}
              titresimAcik={titresim}
              onDegis={(titresimAcik) => ayarGuncelle({ titresimAcik })}
            />
          </View>
        </ScrollView>

        <View style={durum.yanBosluklu}>
          <Buton
            metin="Kategori Seç"
            ikon="arrow-right"
            ikonSagda
            titresimAcik={titresim}
            onPress={() => yonlendir.push('/kurulum/kategori')}
          />
        </View>
      </View>
    </Zemin>
  );
}

const durum = StyleSheet.create({
  // Yan bosluk yok - yatay raylarin kenara kadar akmasi icin gerekli
  kok: { flex: 1 },
  yanBosluklu: { paddingHorizontal: SAYFA_YAN },
  baslik: { marginBottom: BOSLUK.orta + 2 },
  liste: { gap: BOSLUK.buyuk, paddingBottom: BOSLUK.orta },
  blok: { gap: BOSLUK.kucuk + 1 },
  blokBasi: { gap: BOSLUK.kucuk + 1 },
  segment: {
    flexDirection: 'row',
    gap: 5,
    padding: 5,
    borderRadius: YARICAP.orta + 1,
    backgroundColor: RENK.yuzeyKoyu,
    borderWidth: 1.5,
    borderColor: RENK.cizgi,
  },
  segmentDugme: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: YARICAP.kucuk,
  },
  segmentSecili: { backgroundColor: RENK.pirinc },
});
