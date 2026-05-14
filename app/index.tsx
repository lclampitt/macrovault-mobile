import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/Colors';

export default function HomeScreen() {
  const [status, setStatus] = useState('Testing connection...');

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setStatus(`Error: ${error.message}`);
        } else {
          setStatus(`Connected! Session: ${data.session ? 'logged in' : 'no session'}`);
        }
      } catch (e: any) {
        setStatus(`Crash: ${e.message}`);
      }
    }
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MacroVault Mobile</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  status: {
    color: Colors.accentLight,
    fontSize: 14,
    textAlign: 'center',
  },
});
