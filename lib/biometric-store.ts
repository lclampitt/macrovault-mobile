// Credential storage that pairs expo-secure-store (iOS Keychain) with
// expo-local-authentication for the biometric prompt.
//
// Public surface:
//   • saveCredentials({ email, password })  — call after the user opts in
//   • loadCredentials()                     — triggers Face ID, returns { email, password } | null
//   • clearCredentials()                    — sign-out / disable
//   • cacheFirstName(name) / readFirstName()
//   • setFaceIdEnabled(true|false) / isFaceIdEnabled()
//   • isBiometricAvailable() / getBiometricType()
//
// Anything sensitive (the actual password) sits behind biometric ACL in the
// Keychain. Public preferences (first name, "did the user opt in?") live in
// AsyncStorage — cheap to read, not a privacy concern.

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEY_EMAIL = 'macrovault.auth.email';
const KEY_PASSWORD = 'macrovault.auth.password';
const KEY_FIRST_NAME = 'macrovault.auth.firstName';
const KEY_FACEID_ENABLED = 'macrovault.auth.faceIdEnabled';
const KEY_FACEID_DECLINED_AT = 'macrovault.auth.faceIdDeclinedAt';

// expo-secure-store options — these are the closest analog to the iOS-native
// kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly + biometryCurrentSet from
// the spec. The password row gets BIOMETRIC_CURRENT_SET; the email gets a
// looser ACL so we can read it without prompting for the welcome banner.
const PASSWORD_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  requireAuthentication: true,
  authenticationPrompt: 'Sign in to MacroVault',
};

const EMAIL_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
};

// --------------------------------------------------------------------------
// Biometric capability
// --------------------------------------------------------------------------

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'none';

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

export async function getBiometricType(): Promise<BiometricType> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'iris';
    return 'none';
  } catch {
    return 'none';
  }
}

/** Optional explicit prompt — `loadCredentials` already triggers Keychain
 *  biometry, so most callers don't need this. Useful when we want to do a
 *  dry-run during "Enable Face ID" before we have anything to store. */
export async function promptBiometric(reason = 'Sign in to MacroVault'): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use password',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

// --------------------------------------------------------------------------
// Credential storage
// --------------------------------------------------------------------------

export async function saveCredentials(email: string, password: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(KEY_EMAIL, email, EMAIL_OPTS);
    await SecureStore.setItemAsync(KEY_PASSWORD, password, PASSWORD_OPTS);
    await setFaceIdEnabled(true);
    return true;
  } catch (e) {
    console.error('[biometric-store.save]', e);
    return false;
  }
}

export async function loadCredentials(): Promise<{ email: string; password: string } | null> {
  try {
    // Read email first (no biometric needed) to pre-populate the form even if
    // the biometric prompt fails. Then read the password (biometric-guarded).
    const email = await SecureStore.getItemAsync(KEY_EMAIL, EMAIL_OPTS);
    if (!email) return null;
    const password = await SecureStore.getItemAsync(KEY_PASSWORD, PASSWORD_OPTS);
    if (!password) return null;
    return { email, password };
  } catch (e) {
    // User cancelled biometric, or biometric failed. Don't log noisily.
    return null;
  }
}

/** Returns the stored email only (no biometric prompt). Useful for showing
 *  a "Welcome back, …" banner without unlocking credentials. */
export async function peekStoredEmail(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY_EMAIL, EMAIL_OPTS);
  } catch {
    return null;
  }
}

export async function hasStoredCredentials(): Promise<boolean> {
  return (await peekStoredEmail()) != null;
}

export async function clearCredentials(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(KEY_EMAIL, EMAIL_OPTS),
      SecureStore.deleteItemAsync(KEY_PASSWORD, PASSWORD_OPTS),
      AsyncStorage.removeItem(KEY_FIRST_NAME),
      AsyncStorage.removeItem(KEY_FACEID_ENABLED),
    ]);
  } catch (e) {
    console.error('[biometric-store.clear]', e);
  }
}

// --------------------------------------------------------------------------
// Public preferences (no biometric guard needed)
// --------------------------------------------------------------------------

export async function cacheFirstName(name: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_FIRST_NAME, name);
  } catch (e) {
    console.error('[biometric-store.cacheName]', e);
  }
}

export async function readFirstName(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY_FIRST_NAME);
  } catch {
    return null;
  }
}

export async function setFaceIdEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_FACEID_ENABLED, enabled ? '1' : '0');
  } catch (e) {
    console.error('[biometric-store.setEnabled]', e);
  }
}

export async function isFaceIdEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY_FACEID_ENABLED)) === '1';
  } catch {
    return false;
  }
}

export async function recordFaceIdDecline(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_FACEID_DECLINED_AT, new Date().toISOString());
  } catch {
    /* noop */
  }
}

export async function lastFaceIdDeclineAt(): Promise<Date | null> {
  try {
    const v = await AsyncStorage.getItem(KEY_FACEID_DECLINED_AT);
    return v ? new Date(v) : null;
  } catch {
    return null;
  }
}
