import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

export type Profile = {
  display_name: string | null;
};

type UpdateResult = { error: string | null };

type State = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateDisplayName: (newName: string) => Promise<UpdateResult>;
  refetch: () => Promise<void>;
};

/**
 * Loads the signed-in user's profile row (display_name only for now)
 * and exposes an updater. Mirrors the web's pattern: `.maybeSingle()`
 * on read (rows may not yet exist) and `.upsert()` on write so a row
 * is created the first time the user saves a display name.
 */
export function useProfile(): State {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();
      if (queryError) throw queryError;
      setProfile((data as Profile | null) ?? { display_name: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load profile';
      console.error('[useProfile]', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateDisplayName = useCallback(
    async (newName: string): Promise<UpdateResult> => {
      if (!user) return { error: 'Not authenticated' };
      const trimmed = newName.trim();
      try {
        // The `profiles` table is column-locked-down (see
        // supabase_profiles_lockdown_migration.sql): `id` has INSERT-only
        // grant, no UPDATE grant. A PostgREST upsert compiles to
        // `INSERT … ON CONFLICT DO UPDATE SET id = excluded.id, …`, which
        // needs UPDATE(id) and fails with "permission denied". So we UPDATE
        // the allowed column directly, and only INSERT a fresh row (id +
        // display_name, both INSERT-granted) if none exists yet.
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({ display_name: trimmed })
          .eq('id', user.id)
          .select('display_name');
        if (updateError) throw updateError;

        if (!updated || updated.length === 0) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ id: user.id, display_name: trimmed });
          if (insertError) throw insertError;
        }

        setProfile((p) => ({ ...(p ?? {}), display_name: trimmed }));
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to save';
        console.error('[useProfile.update]', message);
        return { error: message };
      }
    },
    [user],
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  return { profile, loading, error, updateDisplayName, refetch: fetchProfile };
}
