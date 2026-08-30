import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertConfig,
  getAlertConfig,
  setAlertConfig,
} from '../../src/services/alerts';
import { getIsPro, setIsPro } from '../../src/services/subscription';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function SettingsScreen() {
  const [proEnabled, setProEnabled] = useState(false);
  const [alertConfig, setAlertConfigState] = useState<AlertConfig | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const [isPro, alerts] = await Promise.all([getIsPro(), getAlertConfig()]);
      if (!active) {
        return;
      }

      setProEnabled(isPro);
      setAlertConfigState(alerts);
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  const handleTogglePro = async (nextValue: boolean) => {
    setProEnabled(nextValue);
    await setIsPro(nextValue);
  };

  const updateAlertConfig = async (nextPatch: Partial<AlertConfig>) => {
    if (!alertConfig) {
      return;
    }

    const nextConfig: AlertConfig = {
      ...alertConfig,
      ...nextPatch,
    };

    setAlertConfigState(nextConfig);
    const persisted = await setAlertConfig(nextConfig);
    setAlertConfigState(persisted);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal visible={showUpgradeModal} transparent animationType="fade" onRequestClose={() => setShowUpgradeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalKicker}>Pro unlock</Text>
            <Text style={styles.modalTitle}>Unlock Environmental Alerts &amp; Real-Time Sync</Text>
            <Text style={styles.modalBody}>
              Upgrade to Pro for $2/month to customize Brain Pressure and Brain Stability alert thresholds.
            </Text>
            <Pressable style={styles.modalButton} onPress={() => setShowUpgradeModal(false)}>
              <Text style={styles.modalButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pro upgrade</Text>
          <View style={styles.row}>
            <Text style={styles.rowText}>Premium telemetry vault · $2/mo</Text>
            <Switch value={proEnabled} onValueChange={handleTogglePro} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alerts</Text>
          {!proEnabled ? (
            <>
              <Text style={styles.bodyText}>Custom environmental alerting is a Pro feature.</Text>
              <Pressable style={styles.ctaButton} onPress={() => setShowUpgradeModal(true)}>
                <Text style={styles.ctaButtonText}>Alert settings (Pro)</Text>
              </Pressable>
            </>
          ) : alertConfig ? (
            <>
              <Text style={styles.bodyText}>Tune thresholds and alerts for your daily sync cycle.</Text>

              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>High Pressure Alert</Text>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() =>
                      void updateAlertConfig({
                        highPressureThreshold: clamp(alertConfig.highPressureThreshold - 1, 45, 90),
                      })
                    }
                  >
                    <Text style={styles.stepperText}>-</Text>
                  </Pressable>
                  <Text style={styles.thresholdValue}>{alertConfig.highPressureThreshold}</Text>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() =>
                      void updateAlertConfig({
                        highPressureThreshold: clamp(alertConfig.highPressureThreshold + 1, 45, 90),
                      })
                    }
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>Low Stability Alert</Text>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() =>
                      void updateAlertConfig({
                        lowStabilityThreshold: clamp(alertConfig.lowStabilityThreshold - 1, 20, 65),
                      })
                    }
                  >
                    <Text style={styles.stepperText}>-</Text>
                  </Pressable>
                  <Text style={styles.thresholdValue}>{alertConfig.lowStabilityThreshold}</Text>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() =>
                      void updateAlertConfig({
                        lowStabilityThreshold: clamp(alertConfig.lowStabilityThreshold + 1, 20, 65),
                      })
                    }
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleText}>Morning briefing</Text>
                <Switch
                  value={alertConfig.morningBriefingEnabled}
                  onValueChange={(value) => void updateAlertConfig({ morningBriefingEnabled: value })}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleText}>Heavy drag warning</Text>
                <Switch
                  value={alertConfig.heavyDragWarningEnabled}
                  onValueChange={(value) => void updateAlertConfig({ heavyDragWarningEnabled: value })}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleText}>Flow state ready</Text>
                <Switch
                  value={alertConfig.flowStateReadyEnabled}
                  onValueChange={(value) => void updateAlertConfig({ flowStateReadyEnabled: value })}
                />
              </View>
            </>
          ) : (
            <Text style={styles.bodyText}>Loading alert settings...</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>App info</Text>
          <Text style={styles.bodyText}>
            Tension Check-In is a local-first daily telemetry journal designed to help you track your attention,
            energy, and stability in a compact daily loop.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Disclaimer</Text>
          <Text style={styles.bodyText}>
            This app is a self-tracking tool, not a medical diagnosis or treatment platform. Use it as reflection
            and cadence support, not as a clinical substitute.
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
  ctaButton: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#314c6f',
    alignItems: 'center',
    backgroundColor: '#111f32',
  },
  ctaButtonText: {
    color: '#edf5ff',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  thresholdRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thresholdLabel: {
    color: '#dfeaf7',
    fontSize: 14,
  },
  thresholdValue: {
    color: '#f5fbff',
    width: 30,
    textAlign: 'center',
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#324d6d',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101d2d',
  },
  stepperText: {
    color: '#f5fbff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  toggleRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleText: {
    color: '#dfeaf7',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 10, 18, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0d1729',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#223b5c',
    padding: 22,
  },
  modalKicker: {
    color: '#7af7d1',
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 10,
  },
  modalTitle: {
    color: '#f5fbff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  modalBody: {
    color: '#dfeaf7',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
  },
  modalButton: {
    backgroundColor: '#7af7d1',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#05151c',
    fontSize: 16,
    fontWeight: '700',
  },
});
