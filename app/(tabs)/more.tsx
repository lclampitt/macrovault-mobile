import PlaceholderScreen from '../../components/PlaceholderScreen';

// The "More" tab in the bottom bar opens a bottom sheet instead of navigating here,
// so this route is effectively unreachable in normal use. It exists so Expo Router
// has a registered screen for the `more` route name declared in (tabs)/_layout.tsx.
export default function MoreScreen() {
  return <PlaceholderScreen title="More" subtitle="Tap the More tab to open the menu" />;
}
