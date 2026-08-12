/**
 * Tur ozeti.
 *
 * Anlatilan kelimeler KASITLI olarak gosterilmez - pas turunda hangi
 * kelimelerin geri gelecegi surpriz kalmali.
 *
 * Belirginlik sirasi: tur puani > takimlar arasi fark > sayaclar.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Buton, CikisButonu } from '../../src/arayuz/Buton';
import { CikisOnayi } from '../../src/arayuz/CikisOnayi';
import { UstYazi, Yazi } from '../../src/arayuz/Yazi';
import { Zemin } from '../../src/arayuz/Zemin';
import { Ikon } from '../../src/cizimler/Ikon';
import { aktifTakimSec, oyunBittiMiSec, oyunDeposu } from '../../src/oyun/durum';
import { turPuani } from '../../src/oyun/puanlama';
import { BOSLUK, PANEL, YARICAP } from '../../src/tema/golgeler';
import { RENK } from '../../src/tema/renkler';
import { BOYUT } from '../../src/tema/yazitipi';

export default function OzetEkrani() {
  const yonlendir = useRouter();
  const kenar = useSafeAreaInsets();

  const takimlar = oyunDeposu((d) => d.takimlar);
  const sayaclar = oyunDeposu((d) => d.turSayaclari);
  const takim = oyunDeposu(aktifTakimSec);
  const bitti = oyunDeposu(oyunBittiMiSec);
  const titresimAcik = oyunDeposu((d) => d.ayarlar.titresimAcik);
  const siradakiTakimaGec = oyunDeposu((d) => d.siradakiTakimaGec);

  const [cikisSoruluyor, setCikisSoruluyor] = useState(false);

  const puan = turPuani(sayaclar);
  const enYuksek = Math.max(...takimlar.map((t) => t.puan));

  const KUTULAR = [
    { ikon: 'check', etiket: 'DOĞRU', deger: sayaclar.dogru, renk: RENK.dogru },
    { ikon: 'chevrons-right', etiket: 'PAS', deger: sayaclar.pas, renk: RENK.pas },
    { ikon: 'x', etiket: 'YANLIŞ', deger: sayaclar.yanlis, renk: RENK.yanlis },
  ];

  return (
    <Zemin>
      <View style={[durum.kok, { paddingTop: kenar.top + 18, paddingBottom: kenar.bottom + 18 }]}>
        {/* Turlar arasi cikis yolu. Diger oyun ekranlariyla ayni kosede. */}
        <View style={durum.ustSatir}>
          <CikisButonu onPress={() => setCikisSoruluyor(true)} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={durum.icerik}
        >
          <View style={durum.tepe}>
            <UstYazi>TUR BİTTİ</UstYazi>
            <View style={durum.puanSatir}>
              <Yazi
                tur="baslik"
                boyut={BOYUT.puan}
                renk={puan >= 0 ? RENK.dogru : RENK.yanlis}
              >
                {puan >= 0 ? `+${puan}` : `${puan}`}
              </Yazi>
              <Yazi tur="cokKalin" boyut={BOYUT.orta} renk={RENK.sis}>
                {' '}puan
              </Yazi>
            </View>
            <Yazi tur="cokKalin" boyut={BOYUT.govde}>{takim?.ad ?? ''}</Yazi>
          </View>

          <View style={durum.skorTablo}>
            {takimlar.map((t, i) => (
              <View
                key={i}
                style={[durum.skorSatir, t.puan === enYuksek && durum.skorLider]}
              >
                <View style={[durum.renkNokta, { backgroundColor: t.renk }]} />
                <Yazi tur="cokKalin" boyut={BOYUT.govde} style={durum.skorAd}>
                  {t.ad}
                </Yazi>
                <Yazi tur="baslik" boyut={BOYUT.baslik + 2} renk={t.renk}>
                  {t.puan}
                </Yazi>
              </View>
            ))}
          </View>

          <View style={durum.sayaclar}>
            {KUTULAR.map((k) => (
              <View key={k.etiket} style={durum.sayacKutu}>
                <Ikon ad={k.ikon} boyut={17} renk={k.renk} cizgiKalinligi={3} />
                <Yazi tur="baslik" boyut={BOYUT.buyuk + 1} renk={k.renk}>
                  {k.deger}
                </Yazi>
                <Yazi tur="cokKalin" boyut={BOYUT.minik} renk={RENK.sis} harfAraligi={1}>
                  {k.etiket}
                </Yazi>
              </View>
            ))}
          </View>
        </ScrollView>

        <Buton
          metin={bitti ? 'Sonucu Gör' : 'Sıradaki Takım'}
          ikon={bitti ? 'trophy' : 'arrow-right'}
          ikonSagda
          titresimAcik={titresimAcik}
          onPress={() => {
            if (bitti) {
              yonlendir.replace('/oyun/kazanan');
              return;
            }
            siradakiTakimaGec();
            yonlendir.replace('/oyun/sira');
          }}
        />
      </View>

      <CikisOnayi acik={cikisSoruluyor} onVazgec={() => setCikisSoruluyor(false)} />
    </Zemin>
  );
}

const durum = StyleSheet.create({
  kok: { flex: 1, paddingHorizontal: 22 },
  ustSatir: { flexDirection: 'row', alignItems: 'center' },
  icerik: { flexGrow: 1, justifyContent: 'center', gap: BOSLUK.orta },
  tepe: { alignItems: 'center', gap: 2, paddingVertical: 18 },
  puanSatir: { flexDirection: 'row', alignItems: 'baseline' },
  skorTablo: { gap: BOSLUK.kucuk },
  skorSatir: {
    ...PANEL,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  skorLider: {
    borderColor: RENK.pirinc,
    backgroundColor: 'rgba(212,160,80,0.13)',
  },
  renkNokta: { width: 26, height: 26, borderRadius: YARICAP.kucuk - 4 },
  skorAd: { flex: 1 },
  sayaclar: { flexDirection: 'row', gap: 9 },
  sayacKutu: {
    ...PANEL,
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingTop: 13,
    paddingBottom: 11,
    borderRadius: YARICAP.orta,
  },
});
