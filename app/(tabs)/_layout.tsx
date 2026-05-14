import { useCallback, useRef } from 'react';
import { Tabs } from 'expo-router';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomTabBar } from '../../components/BottomTabBar';
import { MoreSheet } from '../../components/MoreSheet';

export default function TabsLayout() {
  const moreSheetRef = useRef<BottomSheetModal>(null);
  const openMore = useCallback(() => {
    moreSheetRef.current?.present();
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <BottomTabBar {...props} onOpenMore={openMore} />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="meals" />
        <Tabs.Screen name="log-workout" />
        <Tabs.Screen name="progress" />
        <Tabs.Screen name="more" />
      </Tabs>
      <MoreSheet ref={moreSheetRef} />
    </>
  );
}
