import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../lib/auth-context';
import { useProfile } from '../../hooks/useProfile';
import { ThemedInput } from '../ThemedInput';
import { ThemedButton } from '../ThemedButton';
import SectionHeader from './SectionHeader';
import AvatarDisplay from './AvatarDisplay';

type SaveStatus = 'idle' | 'saving' | 'saved';

export default function ProfileSection() {
  const { user } = useAuth();
  const { profile, loading, updateDisplayName } = useProfile();

  const [displayName, setDisplayName] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local input with the loaded profile (only once when it lands; later
  // keystrokes are user-driven). When the profile has no name yet, leave the
  // input empty so the placeholder shows.
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name?.trim() ?? '');
    }
  }, [profile]);

  useEffect(
    () => () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    },
    [],
  );

  const currentName = profile?.display_name?.trim() ?? '';
  const trimmedInput = displayName.trim();
  const hasChanges = trimmedInput !== currentName;
  const canSave = hasChanges && saveStatus !== 'saving';

  async function handleSave() {
    setSaveError(null);
    setSaveStatus('saving');
    const { error } = await updateDisplayName(trimmedInput);
    if (error) {
      setSaveError(error);
      setSaveStatus('idle');
      return;
    }
    setSaveStatus('saved');
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
  }

  const buttonTitle =
    saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving…' : 'Save';

  // Name shown in the avatar row: prefer display_name, fall back to the
  // local-part of the email when the user hasn't set one yet.
  const headerName =
    currentName ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Welcome';

  return (
    <View style={styles.card}>
      <SectionHeader
        icon={<Feather name="user" size={14} color={Colors.accentLight} />}
        title="Profile"
      />

      <View style={styles.body}>
        <View style={styles.avatarRow}>
          <AvatarDisplay
            email={user?.email}
            displayName={loading ? '' : currentName}
            size={52}
            variant="outlined"
          />
          <View style={styles.avatarInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {headerName}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.field}>
          <Text style={styles.label}>Display name</Text>
          <Text style={styles.sub}>Shown across the app</Text>
          <ThemedInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={loading ? '' : 'Your name'}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!loading}
            style={styles.input}
            maxLength={60}
          />
          <ThemedButton
            title={buttonTitle}
            onPress={handleSave}
            disabled={!canSave}
            loading={saveStatus === 'saving'}
            loadingTitle="Saving…"
            style={styles.saveButton}
          />
          {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.sub}>Managed by your auth provider</Text>
          <ThemedInput
            value={user?.email ?? ''}
            editable={false}
            style={[styles.input, styles.readonlyInput]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarInfo: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  email: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 18,
    marginHorizontal: -20,
  },
  field: {
    gap: 6,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  sub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    marginTop: 2,
  },
  readonlyInput: {
    opacity: 0.65,
  },
  saveButton: {
    marginTop: 10,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 8,
  },
});
