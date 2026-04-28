import { Redirect, Tabs } from 'expo-router';

import { BottomTabBar } from '@gamdojang/ui';

import { useSessionStore } from '../../src/store/session-store';

const tabMeta = {
  index: { title: '홈', icon: 'home' as const },
  walk: { title: '산책', icon: 'walk' as const },
  upload: { title: '업로드', icon: 'upload' as const },
  mailbox: { title: '편지함', icon: 'mailbox' as const },
  'mood-card': { title: '해시카드', icon: 'mood-card' as const }
};

export default function TabsLayout() {
  const sessionToken = useSessionStore((s) => s.sessionToken);
  if (!sessionToken) return <Redirect href="/splash" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false
      }}
      tabBar={({ state, navigation }) => {
        const routes = state.routes.map((route) => {
          const meta = tabMeta[route.name as keyof typeof tabMeta];
          return {
            name: route.name,
            label: meta?.title || route.name,
            icon: meta?.icon || 'home'
          };
        });

        const currentRoute = state.routes[state.index].name;

        return (
          <BottomTabBar
            currentRoute={currentRoute}
            onTabPress={(routeName) => {
              const event = navigation.emit({
                type: 'tabPress',
                target: state.routes.find((r) => r.name === routeName)?.key,
                canPreventDefault: true
              });

              if (!event.defaultPrevented) {
                navigation.navigate(routeName);
              }
            }}
            routes={routes}
          />
        );
      }}
    >
      <Tabs.Screen name="index" options={{ title: tabMeta.index.title }} />
      <Tabs.Screen name="walk" options={{ title: tabMeta.walk.title }} />
      <Tabs.Screen name="upload" options={{ title: tabMeta.upload.title }} />
      <Tabs.Screen name="mailbox" options={{ title: tabMeta.mailbox.title }} />
      <Tabs.Screen name="mood-card" options={{ title: tabMeta['mood-card'].title }} />
    </Tabs>
  );
}
