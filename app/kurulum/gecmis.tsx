/**
 * Gecmis oyunlar.
 *
 * Son bes oyunun sonuc tablosu burada durur. Amac hatira: sonuc ekrani
 * yanlislikla gecilirse tablo kaybolmasin, istenirse sonradan acilip
 * fotograflanabilsin.
 *
 * Uzun donem istatistik tutulmuyor - bes oyun isi goruyor ve depolamayi
 * sismeye birakmiyor.
 */

import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeriButonu } from '../../src/arayuz/Buton';
import { UstYazi, Yazi } from '../../src/arayuz/Yazi';
import { Zemin } from '../../src/arayuz/Zemin';
import { oyunDeposu } from '../../src/oyun/durum';
import { kategoriBul } from '../../src/oyun/kategoriler';
import { BOSLUK, PANEL, SAYFA_YAN, YARICAP } from '../../src/tema/golgeler';
import { RENK } from '../../src/tema/renkler';
import { BOYUT } from '../../src/tema/yazitipi';

/** Gun ve saat - takvim kutuphanesi eklemeye deger bir is degil. */
function zamanYazisi(zaman: number): string {
  const t = new Date(zaman);
  const iki = (n: number) => String(n).padStart(2, '0');
  return `${iki(t.getDate())}.${iki(t.getMonth() + 1)}.${t.getFullYear()} · ${iki(t.getHours())}:${iki(t.getMinutes())}`;
}

export default function GecmisEkrani() {
  const yonlendir = useRouter();
  const kenar = useSafeAreaInsets();
  const gecmis = oyunDeposu((d) => d.gecmisOyunlar);

  return (
    <Zemin>
      <View style={[durum.kok, { paddingTop: kenar.top + 18, paddingBottom: kenar.bottom + 18 }]}>
        <GeriButonu onPress={() => yonlendir.back()} />
        <Yazi tur="baslik" boyut={BOYUT.baslik} style={durum.baslik}>
          Geçmiş Oyunlar
        </Yazi>
        <Yazi boyut={BOYUT.kucuk} renk={RENK.sis} style={durum.aciklama}>
          Son beş oyunun tablosu burada durur. Ekran görüntüsü alıp
          saklayabilirsin.
        </Yazi>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={durum.liste}>
          {gecmis.length === 0 ? (
            <Yazi boyut={BOYUT.notr} renk={RENK.sis} ortala style={durum.bosluk}>
              Henüz tamamlanmış oyun yok.
            </Yazi>
          ) : (
            gecmis.map((oyun) => {
              const enYuksek = Math.max(...oyun.takimlar.map((t) => t.puan));
              return (
                <View key={oyun.zaman} style={durum.kart}>
                  <View style={durum.ust}>
                    <UstYazi>{kategoriBul(oyun.kategori).ad}</UstYazi>
                    <Yazi boyut={BOYUT.minik} renk={RENK.sis}>
                      {zamanYazisi(oyun.zaman)}
                    </Yazi>
                  </View>

                  {[...oyun.takimlar]
                    .sort((a, b) => b.puan - a.puan)
                    .map((t, i) => (
                      <View
                        key={`${t.ad}-${i}`}
                        style={[durum.satir, t.puan === enYuksek && durum.lider]}
                      >
                        <View style={[durum.nokta, { backgroundColor: t.renk }]} />
                        <View style={durum.adAlani}>
                          <Yazi tur="cokKalin" boyut={BOYUT.notr}>{t.ad}</Yazi>
                          <Yazi boyut={BOYUT.minik} renk={RENK.sis}>
                            {`${t.toplam.dogru} doğru · ${t.toplam.yanlis} yanlış · ${t.toplam.pas} pas · en iyi tur ${t.enIyiTur}`}
                          </Yazi>
                        </View>
                        <Yazi tur="baslik" boyut={BOYUT.buyuk} renk={t.renk}>
                          {t.puan}
                        </Yazi>
                      </View>
                    ))}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Zemin>
  );
}

const durum = StyleSheet.create({
  kok: { flex: 1, paddingHorizontal: SAYFA_YAN },
  baslik: { marginBottom: 4 },
  aciklama: { marginBottom: BOSLUK.orta, maxWidth: 330 },
  liste: { gap: BOSLUK.orta, paddingBottom: BOSLUK.orta },
  kart: { ...PANEL, gap: BOSLUK.kucuk, padding: 14, borderRadius: YARICAP.orta },
  ust: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: YARICAP.kucuk,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  lider: { borderColor: RENK.pirinc, backgroundColor: 'rgba(212,160,80,0.11)' },
  nokta: { width: 20, height: 20, borderRadius: 6 },
  adAlani: { flex: 1, gap: 1 },
  bosluk: { marginTop: BOSLUK.devasa },
});
