import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getIsPro, setIsPro } from '../../src/services/subscription';

export default function SettingsScreen() {
  const [proEnabled, setProEnabled] = useState(false);

  useEffect(() => {
    void getIsPro().then(setProEnabled);
  }, []);

  const handleToggle = async (nextValue: boolean) => {
    setProEnabled(nextValue);
    await setIsPro(nextValue);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pro upgrade</Text>
          <View style={styles.row}>
            <Text style={styles.rowText}>Premium telemetry vault · $2/mo</Text>
            <Switch value={proEnabled} onValueChange={handleToggle} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>App info</Text>
          <Text style={styles.bodyText}>Tension Check-In is a local-first daily telemetry journal designed to help you track your attention, energy, and stability in a compact daily loop.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Disclaimer</Text>
          <Text style={styles.bodyText}>This app is a self-tracking tool, not a medical diagnosis or treatment platform. Use it as reflection and cadence support, not as a clinical substitute.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07111d',
  },
  container: {
    padding: 20,
    backgroundColor: '#07111d',
  },
  title: {
    color: '#f2f7ff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#0d1729',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1c2b42',
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#f5fbff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowText: {
    color: '#dfeaf7',
    flex: 1,
    marginRight: 12,
  },
  bodyText: {
    color: '#dfeaf7',
    lineHeight: 22,
  },
});
