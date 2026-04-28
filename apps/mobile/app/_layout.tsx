import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useSessionStore } from '../src/store/session-store';
import dungGeunMoFont from '../assets/fonts/DungGeunMo.ttf';
import { usePushNotifications } from '../src/hooks/use-push-notifications';

SplashScreen.preventAutoHideAsync().catch(() => {
  return;
});

function PushNotificationWrapper({ children }: { children: React.ReactNode }) {
  usePushNotifications();
  return <>{children}</>;
}

export default function RootLayout() {
  const hydrate = useSessionStore((state) => state.hydrate);
  const isHydrated = useSessionStore((state) => state.isHydrated);

  const [fontsLoaded, fontError] = useFonts({
    DungGeunMo: dungGeunMoFont
  });
  const fontsReady = fontsLoaded || fontError != null;

  const queryClient = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    hydrate().catch(() => {
      return;
    });
  }, [hydrate]);

  useEffect(() => {
    if (fontsReady && isHydrated) {
      SplashScreen.hideAsync().catch(() => {
        return;
      });
    }
  }, [fontsReady, isHydrated]);

  if (!fontsReady || !isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFFDFC'
        }}
      >
        <ActivityIndicator size="large" color="#9A6DFF" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PushNotificationWrapper>
        <Slot />
      </PushNotificationWrapper>
    </QueryClientProvider>
  );
}
