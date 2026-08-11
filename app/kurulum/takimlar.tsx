/**
 * Takim kurulumu.
 *
 * Oyuncu isimleri toggle'i kapaliyken sadece takim adlari girilir ve
 * kurulum on saniyede biter. Acilinca her takimin kisi sayisi secilir
 * ve isimler alinir, uygulama sirayi kendisi takip eder.
 */

import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Buton, GeriButonu } from '../../src/arayuz/Buton';
import { SayiSecici, Toggle } from '../../src/arayuz/Toggle';
import { Yazi } from '../../src/arayuz/Yazi';
import { Zemin } from '../../src/arayuz/Zemin';
import { oyunDeposu } from '../../src/oyun/durum';
import { BOSLUK, PANEL, YARICAP } from '../../src/tema/golgeler';
import { RENK } from '../../src/tema/renkler';
import { BOYUT } from '../../src/tema/yazitipi';

export default function TakimKurulumu() {
  const yonlendir = useRouter();
  const kenar = useSafeAreaInsets();

  const takimlar = oyunDeposu((d) => d.takimlar);
  const isimlerAcik = oyunDeposu((d) => d.ayarlar.isimlerAcik);
  const titresimAcik = oyunDeposu((d) => d.ayarlar.titresimAcik);
  const takimSayisiniAyarla = oyunDeposu((d) => d.takimSayisiniAyarla);
  const takimGuncelle = oyunDeposu((d) => d.takimGuncelle);
  const oyuncuSayisiniAyarla = oyunDeposu((d) => d.oyuncuSayisiniAyarla);
  const oyuncuGuncelle = oyunDeposu((d) => d.oyuncuGuncelle);
  const ayarGuncelle = oyunDeposu((d) => d.ayarGuncelle);

  return (
    <Zemin>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={durum.kok}
      >
        <View style={[durum.ic, { paddingTop: kenar.top + 18, paddingBottom: kenar.bottom + 18 }]}>
          <View style={durum.ustSatir}>
            <GeriButonu onPress={() => yonlendir.back()} />
            <SayiSecici
              deger={takimlar.length}
              enAz={2}
              enFazla={4}
              titresimAcik={titresimAcik}
              onDegis={takimSayisiniAyarla}
            />
          </View>

          <Yazi tur="baslik" boyut={BOYUT.baslik}>Takımlar</Yazi>
          <Yazi boyut={BOYUT.notr} renk={RENK.sis} style={durum.aciklama}>
            En az iki takım kurun. İsimleri istediğiniz gibi değiştirin.
          </Yazi>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={durum.liste}
          >
            <Toggle
              baslik="Oyuncu İsimleri Girilsin"
              aciklama="Açarsan sıra kimde olduğunu uygulama takip eder"
              acik={isimlerAcik}
              titresimAcik={titresimAcik}
              onDegis={(v) => ayarGuncelle({ isimlerAcik: v })}
            />

            {takimlar.map((takim, sira) => (
              <View key={sira} style={durum.takimKart}>
                <View style={durum.takimUst}>
                  <View style={[durum.renkNokta, { backgroundColor: takim.renk }]} />
                  <TextInput
                    value={takim.ad}
                    onChangeText={(ad) => takimGuncelle(sira, { ad })}
                    maxLength={18}
                    placeholder="Takım adı"
                    placeholderTextColor="#7C6A50"
                    style={durum.girdi}
                    accessibilityLabel={`${sira + 1}. takım adı`}
                  />
                  {isimlerAcik ? (
                    <SayiSecici
                      deger={takim.oyuncular.length}
                      enAz={2}
                      enFazla={8}
                      titresimAcik={titresimAcik}
                      onDegis={(adet) => oyuncuSayisiniAyarla(sira, adet)}
                    />
                  ) : null}
                </View>

                {isimlerAcik ? (
                  <View style={durum.oyuncuListe}>
                    {takim.oyuncular.map((oyuncu, oSira) => (
                      <View key={oSira} style={durum.oyuncuSatir}>
                        <Yazi tur="cokKalin" boyut={BOYUT.kucuk - 1} renk={RENK.sis}
                              style={durum.oyuncuNo}>
                          {oSira + 1}
                        </Yazi>
                        <TextInput
                          value={oyuncu}
                          onChangeText={(ad) => oyuncuGuncelle(sira, oSira, ad)}
                          maxLength={14}
                          placeholder="Oyuncu adı"
                          placeholderTextColor="#7C6A50"
                          style={[durum.girdi, durum.girdiKucuk]}
                        />
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <Buton
            metin="Devam"
            ikon="arrow-right"
            ikonSagda
            titresimAcik={titresimAcik}
            onPress={() => yonlendir.push('/kurulum/ayarlar')}
          />
        </View>
      </KeyboardAvoidingView>
    </Zemin>
  );
}

const durum = StyleSheet.create({
  kok: { flex: 1 },
  ic: { flex: 1, paddingHorizontal: 22 },
  ustSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aciklama: { marginTop: 6, marginBottom: BOSLUK.orta },
  liste: { gap: BOSLUK.notr + 2, paddingBottom: BOSLUK.orta },
  takimKart: { ...PANEL, padding: 14, gap: 11 },
  takimUst: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  renkNokta: { width: 34, height: 34, borderRadius: YARICAP.kucuk - 1 },
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
  girdiKucuk: { minHeight: 42, fontSize: BOYUT.notr },
  oyuncuListe: { gap: 7, paddingLeft: 45 },
  oyuncuSatir: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  oyuncuNo: { width: 16 },
});
