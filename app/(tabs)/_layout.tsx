import { Tabs } from 'expo-router';

// The visible bottom navbar + More sheet are rendered globally in
// app/_layout.tsx so they persist across pushed routes (Settings, Activity,
// etc.). This Tabs navigator only owns routing for the five tab screens;
// its built-in tab bar is suppressed.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => null}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="meals" />
      <Tabs.Screen name="log-workout" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
