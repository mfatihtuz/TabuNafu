/**
 * Kurallar ekrani.
 */

import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeriButonu } from '../src/arayuz/Buton';
import { Yazi } from '../src/arayuz/Yazi';
import { Zemin } from '../src/arayuz/Zemin';
import { Ikon } from '../src/cizimler/Ikon';
import { BOSLUK, PANEL, YARICAP } from '../src/tema/golgeler';
import { RENK } from '../src/tema/renkler';
import { BOYUT } from '../src/tema/yazitipi';

const KURALLAR: readonly { ikon: string; baslik: string; metin: string }[] = [
  {
    ikon: 'users',
    baslik: 'Takımlara ayrılın',
    metin: 'En az iki takım kurun. Her turda bir takımdan biri anlatır, kendi takımı tahmin eder.',
  },
  {
    ikon: 'scroll-text',
    baslik: 'Kartı anlat',
    metin: 'Ekrandaki büyük kelimeyi anlat. Altındaki beş kelimeye değemezsin.',
  },
  {
    ikon: 'shield-half',
    baslik: 'Rakip denetler',
    metin: 'Telefon anlatanda. Rakip takımdan biri omzunun üstünden bakar ve yasaklı kelimeyi yakalar.',
  },
  {
    ikon: 'check',
    baslik: 'Doğru bilinirse +1',
    metin: 'Takımın kelimeyi bulunca yeşil tuşa basılır.',
  },
  {
    ikon: 'x',
    baslik: 'Yasaklı kelime −1',
    metin: 'Yasaklı kelime söylenirse veya el hareketi yapılırsa kırmızı tuşa basılır.',
  },
  {
    ikon: 'chevrons-right',
    baslik: 'Pas hakkın sınırlı',
    metin: 'Pas puan götürmez ama hakkın biterse tuş kilitlenir. Pas geçilen kelimeler seri sonunda bir kez daha gelir.',
  },
  {
    ikon: 'timer',
    baslik: 'Süre bitince',
    metin: 'Korna çalar. Son kart hakkı açıksa ekrandaki kart için birkaç saniyen daha olur, o sırada pas kilitlidir.',
  },
  {
    ikon: 'trophy',
    baslik: 'Son düzlük',
    metin: 'Bir takım hedefe ulaşınca oyun hemen bitmez. Sıra başa dönene kadar herkes eşit tur oynar, sonra kazanan belli olur.',
  },
  {
    ikon: 'timer',
    baslik: 'Ek süre',
    metin: 'Küçükler ve oyuna uzak büyükler için takım kurulumundan ek süre açılır. O takımın turu bir buçuk kat uzar.',
  },
  {
    ikon: 'shuffle',
    baslik: 'Özel turlar',
    metin: 'Ayarlardan açarsan araya Tek Kelime, Sessiz, Ters ve Hızlı turlar girer. Puanlama aynı kalır, sadece anlatma biçimi değişir.',
  },
  {
    ikon: 'shapes',
    baslik: 'Altın kart',
    metin: 'Açılırsa destenin yüzde ikisi altın olur. Doğru +2, yanlış −2. Yalnızca zor kelimelerden seçilir.',
  },
  {
    ikon: 'chevron-left',
    baslik: 'Yanlışlıkla bastıysan',
    metin: 'Butonların üstünde beliren Son basışı geri al ile düzeltirsin. Puan, sayaç ve kart birlikte geri sarılır.',
  },
  {
    ikon: 'scroll-text',
    baslik: 'Bozuk kart gördüysen',
    metin: 'Kartın üstüne uzun bas. Kart işaretlenir, ayarlardaki Bildirilen kartlar listesinde birikir.',
  },
  {
    ikon: 'feather',
    baslik: 'Kendi kelimelerin',
    metin: 'Ayarlardan Kelimelerim ile kendi kartlarını yazarsın. Ayrı kategori olarak ve karışık destede gelirler.',
  },
];

export default function NasilOynanir() {
  const yonlendir = useRouter();
  const kenar = useSafeAreaInsets();

  return (
    <Zemin>
      <View style={[durum.kok, { paddingTop: kenar.top + 18 }]}>
        <GeriButonu onPress={() => yonlendir.back()} />
        <Yazi tur="baslik" boyut={BOYUT.baslik} style={durum.baslik}>
          Nasıl Oynanır
        </Yazi>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[durum.liste, { paddingBottom: kenar.bottom + 24 }]}
        >
          {KURALLAR.map((k) => (
            <View key={k.baslik} style={durum.satir}>
              <View style={durum.im}>
                <Ikon ad={k.ikon} boyut={18} renk={RENK.pirincUstu} cizgiKalinligi={2.4} />
              </View>
              <View style={durum.satirMetin}>
                <Yazi tur="cokKalin" boyut={BOYUT.govde}>{k.baslik}</Yazi>
                <Yazi boyut={BOYUT.notr - 0.5} renk={RENK.sis}>{k.metin}</Yazi>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Zemin>
  );
}

const durum = StyleSheet.create({
  kok: { flex: 1, paddingHorizontal: 22 },
  baslik: { marginBottom: BOSLUK.orta },
  liste: { gap: BOSLUK.notr },
  satir: { ...PANEL, flexDirection: 'row', gap: BOSLUK.notr, padding: 14 },
  im: {
    width: 30,
    height: 30,
    borderRadius: YARICAP.kucuk - 2,
    backgroundColor: RENK.pirinc,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satirMetin: { flex: 1, gap: 3 },
});
