/**
 * Oyundan cikis onayi.
 *
 * Uc oyun ekraninda da ayni pencere aciliyor. Once her ekrana kopyalanmisti
 * ve metinler birbirinden kaymaya baslamisti - buraya toplandi. Yonlendirme
 * de burada, boylece yigin davranisi tek yerden duzeltilebiliyor.
 *
 * YIGIN NOTU
 * replace('/') kullanilmiyor. O, yigindaki kurulum ekranlarinin USTUNE
 * ikinci bir ana ekran koyuyor - kullanici cikis onayladiktan sonra
 * donanim geri tusuyla terk edilmis oyunun kurulum ekranlarina geri
 * dusuyordu. dismissAll yigini gercekten koke sariyor.
 */

import { useRouter } from 'expo-router';

import { oyunDeposu } from '../oyun/durum';
import { RENK } from '../tema/renkler';
import { Modal3D } from './Modal3D';

type Ozellikler = {
  acik: boolean;
  /** Tur ortasinda cikiliyorsa turun da yarida kalacagi soylenir. */
  turYaridaMi?: boolean;
  onVazgec: () => void;
};

export function CikisOnayi({ acik, turYaridaMi = false, onVazgec }: Ozellikler) {
  const yonlendir = useRouter();
  const titresimAcik = oyunDeposu((d) => d.ayarlar.titresimAcik);
  const oyunuSifirla = oyunDeposu((d) => d.oyunuSifirla);

  return (
    <Modal3D
      acik={acik}
      ikon="house"
      ikonRenk={RENK.yanlis}
      baslik="Oyundan çıkılsın mı?"
      metin={
        turYaridaMi
          ? 'Tur yarıda kalır, tüm puanlar silinir ve ana ekrana dönülür.'
          : 'Tüm puanlar silinir ve ana ekrana dönülür.'
      }
      birinci="Oyuna Devam Et"
      ikinci="Çık ve Sil"
      titresimAcik={titresimAcik}
      onBirinci={onVazgec}
      onIkinci={() => {
        onVazgec();
        oyunuSifirla();
        if (yonlendir.canDismiss()) yonlendir.dismissAll();
        else yonlendir.replace('/');
      }}
    />
  );
}
