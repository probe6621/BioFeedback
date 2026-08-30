import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.kicker}>BrainFriction</Text>
        </View>

        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.updated}>Effective August 30, 2026</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What we collect</Text>
          <Text style={styles.body}>
            BrainFriction may use your location and environmental conditions (such as weather, temperature, humidity,
            and barometric pressure) to generate your live brain-state read.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How we use it</Text>
          <Text style={styles.body}>
            We use this data to estimate environmental drag, power live sync, and trigger alerting when you have Pro
            enabled. The app also stores your local history and alert preferences on your device.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What we do not do</Text>
          <Text style={styles.body}>
            We do not sell your personal data. We do not use your data for advertising. We do not use BrainFriction as
            a medical device or clinical system.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Storage and sharing</Text>
          <Text style={styles.body}>
            Your daily reads, Pro state, and alert settings are stored locally on the device. If you choose to share a
            snapshot, that sharing happens only through the tools you select.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <Text style={styles.body}>
            Location permission is used for live environmental sync. Notification permission is used only for alerting
            features you enable.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.body}>
            For questions about privacy or data handling, contact the BrainFriction developer through the repository:
            github.com/probe6621/BioFeedback
          </Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#314c6f',
    backgroundColor: '#101d2d',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#edf5ff',
    fontWeight: '700',
  },
  kicker: {
    color: '#7af7d1',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  title: {
    color: '#f2f7ff',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 4,
  },
  updated: {
    color: '#9bb0c8',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#0d1729',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1c2b42',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#f5fbff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color: '#dfeaf7',
    lineHeight: 22,
  },
});
