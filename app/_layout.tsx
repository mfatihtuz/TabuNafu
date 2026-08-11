/**
 * Uygulama koku.
 *
 * Yazi tipleri gomulu gelir, agdan cekilmez. Yuklenene kadar acilis
 * ekrani beklestirilir - aksi halde ilk kare sistem fontuyla cizilir
 * ve gorunur bir sicrama olur.
 *
 * Not: app/ klasor adi expo-router dayatmasidir, degistirilemiyor.
 * Alt klasorler ve dosya adlari Turkce.
 */

import {
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  useFonts,
} from '@expo-google-fonts/baloo-2';
import {
  Manrope_500Medium,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { sesleriHazirla } from '../src/oyun/sesler';
import { RENK } from '../src/tema/renkler';

void SplashScreen.preventAutoHideAsync();

export default function KokDuzen() {
  const [yaziTipleriHazir] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Manrope_500Medium,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    void sesleriHazirla();
  }, []);

  useEffect(() => {
    if (yaziTipleriHazir) void SplashScreen.hideAsync();
  }, [yaziTipleriHazir]);

  if (!yaziTipleriHazir) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: RENK.zeminUst },
            animation: 'fade',
            animationDuration: 220,
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
