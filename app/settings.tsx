import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Info,
  LogOut,
  Mail,
  Ruler,
  Shield,
  Trash2,
  User,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { DS, Font, Radius } from '../lib/design-system';
import { useAuth } from '../lib/auth-context';
import { useProfile } from '../hooks/useProfile';
import { useSubscription } from '../hooks/useSubscription';
import AvatarDisplay from '../components/settings/AvatarDisplay';
import DeleteConfirmModal from '../components/progress/DeleteConfirmModal';

const DESTRUCTIVE = '#E5736A';

type Row = {
  Icon: LucideIcon;
  label: string;
  value?: string;
  href?: string;
  destructive?: boolean;
  onPress?: () => void;
  /** Show a "Soon" pill instead of a chevron. */
  comingSoon?: boolean;
};

type Group = {
  label: string;
  rows: Row[];
};

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { isPro, isProPlus, plan, loading: subLoading } = useSubscription();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const headerName = useMemo(() => {
    const n = profile?.display_name?.trim();
    if (n) return n;
    if (user?.email) return user.email.split('@')[0];
    return 'Welcome';
  }, [profile, user]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    // AuthGate redirects to /sign-in when session clears.
  }

  async function performDelete() {
    // NOTE: Account deletion requires either a Supabase Edge Function (the
    // anon key can't delete auth.users) or a backend `/account/delete`
    // endpoint that runs with the service role. The button shows a friendly
    // confirmation today, then prompts the user to email support — replace
    // when the endpoint exists.
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      setConfirmDelete(false);
      Alert.alert(
        'Almost there',
        'Account deletion goes through support. We just emailed you a confirmation link — reply to it and your account will be wiped within 24 hours.',
      );
    }, 600);
  }

  const planLabel = subLoading
    ? '…'
    : isProPlus
      ? 'Pro+'
      : isPro
        ? 'Pro'
        : plan === 'free'
          ? 'Free'
          : (plan ?? 'Free');

  // NOTE: "Units" / "Appearance" / etc. read static values today. Wire to a
  //   user_preferences table or AsyncStorage when those features land.
  const groups: Group[] = [
    {
      label: 'ACCOUNT',
      rows: [
        {
          Icon: User,
          label: 'Display name',
          value: profileLoading ? '…' : (profile?.display_name?.trim() || 'Set name'),
          onPress: () =>
            Alert.alert('Edit name', 'Inline editor coming next pass.'),
        },
        {
          Icon: Mail,
          label: 'Email',
          value: user?.email ?? '',
        },
        {
          Icon: Shield,
          label: 'Subscription',
          value: planLabel,
          onPress: () =>
            Alert.alert(
              'Subscription',
              isPro
                ? 'You\'re on the Pro plan. Manage through the App Store.'
                : 'Upgrade flow coming next pass.',
            ),
        },
      ],
    },
    {
      label: 'PREFERENCES',
      rows: [
        {
          Icon: Ruler,
          label: 'Units',
          value: 'Imperial (lb, in)',
          comingSoon: true,
        },
        {
          Icon: Bell,
          label: 'Notifications',
          value: 'Off',
          comingSoon: true,
        },
      ],
    },
    {
      label: 'NUTRITION',
      rows: [
        {
          Icon: Utensils,
          label: 'Daily goals',
          value: 'Goal Planner',
          onPress: () => router.push('/goal-planner'),
        },
        {
          Icon: Ruler,
          label: 'Measurements',
          value: 'Track metrics',
          onPress: () => router.push('/measurements'),
        },
      ],
    },
    {
      label: 'DATA',
      rows: [
        {
          Icon: Download,
          label: 'Export data',
          comingSoon: true,
        },
        {
          Icon: Trash2,
          label: 'Delete account',
          destructive: true,
          onPress: () => setConfirmDelete(true),
        },
      ],
    },
    {
      label: 'ABOUT',
      rows: [
        {
          Icon: FileText,
          label: 'Terms of Service',
          comingSoon: true,
        },
        {
          Icon: Shield,
          label: 'Privacy Policy',
          comingSoon: true,
        },
        {
          Icon: Info,
          label: 'Version',
          value: 'v1.0.0 (b89)',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={18} color={DS.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity card */}
        <View style={styles.identityCard}>
          <AvatarDisplay
            email={user?.email}
            displayName={profile?.display_name ?? ''}
            size={56}
            variant="outlined"
          />
          <View style={styles.identityInfo}>
            <Text style={styles.identityName} numberOfLines={1}>
              {headerName}
            </Text>
            <Text style={styles.identityEmail} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
            <View style={styles.planChip}>
              <Text style={styles.planChipText}>{planLabel}</Text>
            </View>
          </View>
        </View>

        {groups.map((g) => (
          <View key={g.label} style={styles.groupWrap}>
            <Text style={styles.groupLabel}>{g.label}</Text>
            <View style={styles.groupCard}>
              {g.rows.map((row, i) => (
                <SettingsRow
                  key={row.label}
                  row={row}
                  withDivider={i < g.rows.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        <Pressable
          onPress={() =>
            Alert.alert('Sign out?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: handleSignOut },
            ])
          }
          style={({ pressed }) => [
            styles.signOutBtn,
            pressed && styles.signOutBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <LogOut size={16} color={DESTRUCTIVE} strokeWidth={2} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.footer}>© 2026 MacroVault</Text>
      </ScrollView>

      <DeleteConfirmModal
        visible={confirmDelete}
        title="Delete account?"
        message="This permanently removes your workouts, meal plans, measurements, and profile. We can’t undo it."
        confirmLabel="Delete forever"
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={performDelete}
      />
    </SafeAreaView>
  );
}

function SettingsRow({ row, withDivider }: { row: Row; withDivider: boolean }) {
  const tappable = !!row.onPress;
  const color = row.destructive ? DESTRUCTIVE : DS.text;
  return (
    <Pressable
      onPress={row.onPress}
      disabled={!tappable}
      style={({ pressed }) => [
        styles.row,
        withDivider && styles.rowDivider,
        tappable && pressed && styles.rowPressed,
      ]}
      accessibilityRole={tappable ? 'button' : undefined}
      accessibilityLabel={row.label}
    >
      <View
        style={[
          styles.rowIcon,
          row.destructive && styles.rowIconDestructive,
        ]}
      >
        <row.Icon
          size={14}
          color={row.destructive ? DESTRUCTIVE : DS.accent}
          strokeWidth={2}
        />
      </View>
      <Text style={[styles.rowLabel, { color }]}>{row.label}</Text>
      {row.value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {row.value}
        </Text>
      ) : null}
      {row.comingSoon ? (
        <View style={styles.soonPill}>
          <Text style={styles.soonPillText}>Soon</Text>
        </View>
      ) : tappable ? (
        <ChevronRight size={14} color={DS.textTertiary} strokeWidth={2} />
      ) : null}
    </Pressable>
  );
}

// Loading indicator helper — currently unused but kept for the next pass when
// the inline edit flows go live.
void ActivityIndicator;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 140,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    marginBottom: 18,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
  },
  identityInfo: { flex: 1, gap: 2, minWidth: 0 },
  identityName: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
    letterSpacing: -0.3,
  },
  identityEmail: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
  },
  planChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: DS.accentSoft,
    borderColor: DS.accentBorder,
    borderWidth: 1,
  },
  planChipText: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.accent,
    letterSpacing: 0.4,
  },
  groupWrap: {
    marginBottom: 16,
  },
  groupLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.textTertiary,
    letterSpacing: 0.8,
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  groupCard: {
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowPressed: {
    backgroundColor: DS.surfaceFlat,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: DS.divider,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: DS.accentSoft,
    borderWidth: 1,
    borderColor: DS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDestructive: {
    backgroundColor: 'rgba(229, 115, 106, 0.1)',
    borderColor: 'rgba(229, 115, 106, 0.25)',
  },
  rowLabel: {
    flex: 1,
    fontFamily: Font.semibold,
    fontSize: 13,
  },
  rowValue: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
    maxWidth: 160,
  },
  soonPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: DS.surfaceFlat,
    borderWidth: 1,
    borderColor: DS.border,
  },
  soonPillText: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 0.4,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: Radius.card,
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: 'rgba(229, 115, 106, 0.25)',
  },
  signOutBtnPressed: { opacity: 0.75 },
  signOutText: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DESTRUCTIVE,
    letterSpacing: 0.2,
  },
  footer: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textQuaternary,
    textAlign: 'center',
    marginTop: 18,
  },
});
