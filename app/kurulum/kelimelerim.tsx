/**
 * Kendi kelimelerin.
 *
 * Aile ici sakalar, akraba isimleri, eve ozel seyler - hazir destede
 * olamayacak kartlar buradan eklenir. Kartlar diske yazilir, kendi
 * kategorisi olarak gorunur ve KARISIK destesine de girer.
 *
 * Oyunun kuralina uyuluyor: bir ana kelime, TAM BES yasakli kelime.
 * Eksik kart kaydedilemez, yoksa oyun ortasinda bos satir cikardi.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Buton, GeriButonu } from '../../src/arayuz/Buton';
import { UstYazi, Yazi } from '../../src/arayuz/Yazi';
import { Zemin } from '../../src/arayuz/Zemin';
import { Ikon } from '../../src/cizimler/Ikon';
import { oyunDeposu } from '../../src/oyun/durum';
import { type HamKart } from '../../src/oyun/tipler';
import { BOSLUK, PANEL, SAYFA_YAN, YARICAP } from '../../src/tema/golgeler';
import { RENK } from '../../src/tema/renkler';
import { BOYUT } from '../../src/tema/yazitipi';
import { trUpper } from '../../src/yardimci/turkce';

const BOS_YASAKLI = ['', '', '', '', ''];

export default function KelimelerimEkrani() {
  const yonlendir = useRouter();
  const kenar = useSafeAreaInsets();

  const kendiKartlar = oyunDeposu((d) => d.kendiKartlar);
  const kendiKartEkle = oyunDeposu((d) => d.kendiKartEkle);
  const kendiKartSil = oyunDeposu((d) => d.kendiKartSil);
  const titresimAcik = oyunDeposu((d) => d.ayarlar.titresimAcik);

  const [kelime, setKelime] = useState('');
  const [yasaklilar, setYasaklilar] = useState<string[]>([...BOS_YASAKLI]);
  const [uyari, setUyari] = useState<string | null>(null);

  const doluYasakli = yasaklilar.filter((y) => y.trim().length > 0).length;
  const kaydedilebilir = kelime.trim().length > 0 && doluYasakli === 5;

  function yasakliDegis(sira: number, deger: string) {
    setYasaklilar((onceki) => onceki.map((y, i) => (i === sira ? deger : y)));
  }

  function kaydet() {
    const ana = trUpper(kelime.trim());

    if (kendiKartlar.some((k) => k[0] === ana)) {
      setUyari('Bu kelime zaten listende var.');
      return;
    }
    const temiz = yasaklilar.map((y) => trUpper(y.trim()));
    if (temiz.includes(ana)) {
      setUyari('Ana kelime yasaklılar arasında olamaz.');
      return;
    }

    const kart: HamKart = [ana, temiz[0]!, temiz[1]!, temiz[2]!, temiz[3]!, temiz[4]!, 3];
    kendiKartEkle(kart);
    setKelime('');
    setYasaklilar([...BOS_YASAKLI]);
    setUyari(null);
  }

  return (
    <Zemin>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={durum.kacinma}
      >
        <View style={[durum.kok, { paddingTop: kenar.top + 18, paddingBottom: kenar.bottom + 18 }]}>
          <GeriButonu onPress={() => yonlendir.back()} />
          <Yazi tur="baslik" boyut={BOYUT.baslik} style={durum.baslik}>
            Kelimelerim
          </Yazi>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={durum.liste}
            keyboardShouldPersistTaps="handled"
          >
            <View style={durum.form}>
              <UstYazi>YENİ KELİME</UstYazi>
              <TextInput
                value={kelime}
                onChangeText={setKelime}
                maxLength={18}
                placeholder="Anlatılacak kelime"
                placeholderTextColor="#7C6A50"
                style={[durum.girdi, durum.girdiAna]}
                accessibilityLabel="Anlatılacak kelime"
              />

              <Yazi boyut={BOYUT.kucuk} renk={RENK.sis}>
                Beş yasaklı kelimenin hepsi dolu olmalı.
              </Yazi>

              {yasaklilar.map((y, i) => (
                <View key={i} style={durum.yasakliSatir}>
                  <Yazi tur="cokKalin" boyut={BOYUT.kucuk} renk={RENK.sis} style={durum.no}>
                    {i + 1}
                  </Yazi>
                  <TextInput
                    value={y}
                    onChangeText={(d) => yasakliDegis(i, d)}
                    maxLength={14}
                    placeholder={`Yasaklı ${i + 1}`}
                    placeholderTextColor="#7C6A50"
                    style={durum.girdi}
                    accessibilityLabel={`${i + 1}. yasaklı kelime`}
                  />
                </View>
              ))}

              {uyari ? (
                <Yazi tur="cokKalin" boyut={BOYUT.kucuk} renk={RENK.yanlis}>
                  {uyari}
                </Yazi>
              ) : null}

              <Buton
                metin="Kelimeyi Ekle"
                ikon="plus"
                pasif={!kaydedilebilir}
                titresimAcik={titresimAcik}
                onPress={kaydet}
              />
            </View>

            {kendiKartlar.length > 0 ? (
              <View style={durum.form}>
                <UstYazi>{`EKLENENLER (${kendiKartlar.length})`}</UstYazi>
                {kendiKartlar.map((k, i) => (
                  <View key={`${k[0]}-${i}`} style={durum.kart}>
                    <View style={durum.kartMetin}>
                      <Yazi tur="cokKalin" boyut={BOYUT.govde}>{k[0]}</Yazi>
                      <Yazi boyut={BOYUT.kucuk} renk={RENK.sis} numberOfLines={2}>
                        {k.slice(1, 6).join(' · ')}
                      </Yazi>
                    </View>
                    <Pressable
                      onPress={() => kendiKartSil(i)}
                      accessibilityRole="button"
                      accessibilityLabel={`${k[0]} kelimesini sil`}
                      style={durum.sil}
                    >
                      <Ikon ad="x" boyut={18} renk={RENK.yanlis} cizgiKalinligi={2.6} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <Yazi boyut={BOYUT.notr} renk={RENK.sis} ortala style={durum.bosluk}>
                Henüz kelime eklemedin. Eklediklerin kategori ekranında
                Kelimelerim olarak görünür.
              </Yazi>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Zemin>
  );
}

const durum = StyleSheet.create({
  kacinma: { flex: 1 },
  kok: { flex: 1, paddingHorizontal: SAYFA_YAN },
  baslik: { marginBottom: BOSLUK.orta },
  liste: { gap: BOSLUK.buyuk, paddingBottom: BOSLUK.orta },
  form: { gap: BOSLUK.kucuk + 1 },
  girdi: {
    flex: 1,
    minHeight: 46,
    backgroundColor: RENK.yuzeyKoyu,
    borderWidth: 1.5,
    borderColor: RENK.cizgi,
    borderRadius: YARICAP.kucuk + 1,
    paddingHorizontal: 13,
    color: RENK.fildisi,
    fontFamily: 'Manrope_700Bold',
    fontSize: BOYUT.govde,
  },
  girdiAna: { flex: 0 },
  yasakliSatir: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  no: { width: 14 },
  kart: {
    ...PANEL,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  kartMetin: { flex: 1, gap: 2 },
  sil: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bosluk: { maxWidth: 300, alignSelf: 'center' },
});
