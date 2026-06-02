// Thin wrappers around Supabase auth that match the contract the auth flow
// spec describes. The spec is written for a custom REST backend; we map each
// endpoint to the equivalent Supabase call. Behavior parity matters more
// than wire-format parity:
//
//   POST /auth/login           → supabase.auth.signInWithPassword
//   POST /auth/register        → supabase.auth.signUp + profile insert
//   POST /auth/check-email     → query profiles by email
//   POST /auth/refresh         → Supabase handles this automatically
//   POST /auth/logout          → supabase.auth.signOut
//   GET  /auth/me              → supabase.auth.getUser + profile fetch
//
// Web parity: web app uses the same Supabase project, so accounts created
// here sign in there and vice versa.

import { supabase } from './supabase';

export type RegistrationPayload = {
  firstName: string;
  email: string;
  password: string;
  profile?: {
    sex?: 'male' | 'female' | null;
    dateOfBirth?: string | null; // ISO YYYY-MM-DD
    units?: 'imperial' | 'metric';
    heightInches?: number | null;
    heightCm?: number | null;
    weightLb?: number | null;
    weightKg?: number | null;
    goal?: 'cut' | 'maintain' | 'bulk' | null;
    activityLevel?: 'sedentary' | 'light' | 'moderate' | 'high' | null;
    targetWeightLb?: number | null;
    targetWeightKg?: number | null;
  };
};

export type AuthError = {
  /** machine-readable */
  code:
    | 'invalid_credentials'
    | 'email_exists'
    | 'validation_failed'
    | 'rate_limited'
    | 'network'
    | 'unknown';
  /** human-readable */
  message: string;
};

type LoginResult = {
  user: { id: string; email: string; firstName: string | null } | null;
  error: AuthError | null;
};

function mapSupabaseError(message: string | undefined): AuthError {
  const m = (message ?? '').toLowerCase();
  if (m.includes('invalid login')) {
    return { code: 'invalid_credentials', message: 'Email or password is incorrect.' };
  }
  if (m.includes('already registered') || m.includes('already exists')) {
    return {
      code: 'email_exists',
      message: 'An account with this email already exists.',
    };
  }
  if (m.includes('rate') || m.includes('too many')) {
    return {
      code: 'rate_limited',
      message: 'Too many attempts. Try again in a few minutes.',
    };
  }
  if (m.includes('network')) {
    return {
      code: 'network',
      message: 'Connection failed. Check your internet and try again.',
    };
  }
  if (m.includes('password')) {
    return { code: 'validation_failed', message: message ?? 'Password is invalid.' };
  }
  return { code: 'unknown', message: message || 'Something went wrong. Please try again.' };
}

// --------------------------------------------------------------------------
// Sign in
// --------------------------------------------------------------------------

export async function signIn(email: string, password: string): Promise<LoginResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { user: null, error: mapSupabaseError(error.message) };
    if (!data.user) {
      return { user: null, error: { code: 'unknown', message: 'No user returned.' } };
    }

    // Pull first name from the profiles row so we can cache it for the
    // Face ID welcome banner.
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', data.user.id)
      .maybeSingle();

    const firstName = extractFirstName(profile?.display_name ?? null, email);

    return {
      user: { id: data.user.id, email: data.user.email ?? email, firstName },
      error: null,
    };
  } catch (e) {
    console.error('[auth-api.signIn]', e);
    return { user: null, error: mapSupabaseError(asMessage(e)) };
  }
}

// --------------------------------------------------------------------------
// Email availability check
// --------------------------------------------------------------------------

/** Used during registration step 1. Treats "no row" as available. */
export async function checkEmailAvailable(email: string): Promise<{
  available: boolean;
  error: AuthError | null;
}> {
  try {
    // The cleanest check is via auth.users, but RLS blocks that. We rely on
    // the `profiles` mirror table (every signed-up user has a row).
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      return { available: true, error: null }; // fail-open — sign-up will reject anyway
    }
    return { available: !data, error: null };
  } catch (e) {
    console.error('[auth-api.checkEmail]', e);
    return { available: true, error: null };
  }
}

// --------------------------------------------------------------------------
// Register
// --------------------------------------------------------------------------

export async function register(input: RegistrationPayload): Promise<LoginResult> {
  try {
    const email = input.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          first_name: input.firstName.trim(),
          display_name: input.firstName.trim(),
        },
      },
    });
    if (error) return { user: null, error: mapSupabaseError(error.message) };
    if (!data.user) {
      return { user: null, error: { code: 'unknown', message: 'No user returned.' } };
    }

    // Best-effort profile write. If RLS rejects (e.g. profiles.id is keyed
    // off auth.uid and the session isn't immediately attached), the row
    // will be created via the existing trigger anyway. NOTE: confirm a
    // trigger exists on auth.users → profiles in Supabase. If not, the user
    // can't write here because RLS blocks pre-confirmation inserts.
    try {
      await supabase
        .from('profiles')
        .upsert(
          {
            id: data.user.id,
            email,
            display_name: input.firstName.trim(),
            ...buildProfileColumns(input.profile),
          },
          { onConflict: 'id' },
        );
    } catch (e) {
      console.error('[auth-api.register.profileUpsert]', e);
    }

    // Best-effort goal write — Goal Planner reads from `goals` table.
    if (input.profile?.goal) {
      try {
        await supabase.from('goals').upsert(
          {
            user_id: data.user.id,
            goal: capitalize(input.profile.goal),
          },
          { onConflict: 'user_id' },
        );
      } catch (e) {
        console.error('[auth-api.register.goalUpsert]', e);
      }
    }

    return {
      user: { id: data.user.id, email, firstName: input.firstName.trim() },
      error: null,
    };
  } catch (e) {
    console.error('[auth-api.register]', e);
    return { user: null, error: mapSupabaseError(asMessage(e)) };
  }
}

// --------------------------------------------------------------------------
// Sign out
// --------------------------------------------------------------------------

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error('[auth-api.signOut]', e);
  }
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function buildProfileColumns(p: RegistrationPayload['profile']) {
  if (!p) return {};
  return {
    sex: p.sex ?? null,
    date_of_birth: p.dateOfBirth ?? null,
    units: p.units ?? null,
    height_inches: p.heightInches ?? null,
    height_cm: p.heightCm ?? null,
    weight_lb: p.weightLb ?? null,
    weight_kg: p.weightKg ?? null,
    activity_level: p.activityLevel ?? null,
    target_weight_lb: p.targetWeightLb ?? null,
    target_weight_kg: p.targetWeightKg ?? null,
  };
}

function extractFirstName(displayName: string | null, email: string): string | null {
  if (displayName) {
    const first = displayName.trim().split(/\s+/)[0];
    if (first) return first;
  }
  if (email) return email.split('@')[0];
  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function asMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
