import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { evaluateAutoSyncAlerts } from '../../src/services/alerts';
import { runAutoSync } from '../../src/services/autoSync';
import { getIsPro, setIsPro } from '../../src/services/subscription';
import { DailyCheckIn, getRecentCheckIns } from '../../utils/storage';

const defaultTension = 72;
const defaultStability = 64;

const normalizeStatusText = (status: string) =>
  status
    .replace('Location permission unavailable — using fallback field calibration', 'Running local ambient baseline (Unlock Live Sync & Alerting for live conditions)')
    .replace('Connection drift detected — fallback field calibration applied', 'Running local ambient baseline (Unlock Live Sync & Alerting for live conditions)')
    .replace('Offline calibration active — using ambient fallback estimate', 'Running local ambient baseline (Unlock Live Sync & Alerting for live conditions)');

export default function IndexScreen() {
  const [tension, setTension] = useState(defaultTension);
  const [stability, setStability] = useState(defaultStability);
  const [history, setHistory] = useState<DailyCheckIn[]>([]);
  const [statusText, setStatusText] = useState('Running local ambient baseline (Unlock Live Sync & Alerting for live conditions)');
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [isPro, setProState] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showScienceModal, setShowScienceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const proState = await getIsPro();
      if (!active) return;
      setProState(proState);

      try {
        const entries = await getRecentCheckIns();
        if (!active) return;

        if (entries.length > 0) {
          const latest = entries[0];
          setTension(latest.tension);
          setStability(latest.stability);
          setStatusText('Using your last local read as a starting point');
        }

        setHistory(entries);
      } catch {
        setHistory([]);
      }

      if (proState) {
        const nextValues = await runAutoSync();
        if (!active) return;

        setTension(nextValues.tension);
        setStability(nextValues.stability);
        setStatusText(normalizeStatusText(nextValues.statusText));
        await evaluateAutoSyncAlerts(nextValues);
      }

      setIsCalibrating(false);
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  const handleAutoSyncTrigger = async () => {
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }

    setIsCalibrating(true);
    const nextValues = await runAutoSync();

    setTension(nextValues.tension);
    setStability(nextValues.stability);
    setStatusText(normalizeStatusText(nextValues.statusText));
    await evaluateAutoSyncAlerts(nextValues);
    setIsCalibrating(false);
  };

  const handleUpgradeToPro = async () => {
    const enabled = await setIsPro(true);
    setProState(enabled);
    setShowUpgradeModal(false);
    await handleAutoSyncTrigger();
  };

  const pressureState = useMemo(() => {
    if (tension >= 70) {
      return { label: 'Heavy drag', style: { backgroundColor: '#2c1723', borderColor: '#ff8a65', color: '#ffd6c8' } };
    }
    if (tension <= 35) {
      return { label: 'Smooth', style: { backgroundColor: '#102b23', borderColor: '#63e6a7', color: '#d8ffe8' } };
    }
    return { label: 'Noticeable', style: { backgroundColor: '#1e2635', borderColor: '#f7b267', color: '#ffe8b7' } };
  }, [tension]);

  const flowState = useMemo(() => {
    if (stability >= 75) {
      return { label: 'Steady', style: { backgroundColor: '#102b23', borderColor: '#63e6a7', color: '#d8ffe8' } };
    }
    if (stability <= 45) {
      return { label: 'Wobbly', style: { backgroundColor: '#2c1723', borderColor: '#ff8a65', color: '#ffd6c8' } };
    }
    return { label: 'Watch', style: { backgroundColor: '#1e2635', borderColor: '#f7b267', color: '#ffe8b7' } };
  }, [stability]);

  const isHeavyDrag = tension >= 70 || stability <= 45;
  const isIdealFlow = tension <= 35 && stability >= 75;
  const combinedScore = Math.max(0, Math.min(100, Math.round(( (100 - tension) * 0.6 ) + (stability * 0.4))));
  const combinedState = useMemo(() => {
    if (combinedScore >= 80) return { label: 'Smooth', color: '#63e6a7', bg: '#102b23' };
    if (combinedScore >= 60) return { label: 'Steady', color: '#8cd8ff', bg: '#12263d' };
    return { label: 'Heavy drag', color: '#ff8a65', bg: '#2c1723' };
  }, [combinedScore]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal visible={showUpgradeModal} transparent animationType="fade" onRequestClose={() => setShowUpgradeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalKicker}>Pro unlock</Text>
            <Text style={styles.modalTitle}>Unlock Live Sync &amp; Alerting</Text>
            <Text style={styles.modalBody}>Let GPS & barometric pressure calibrate your flow automatically for just $2/month.</Text>
            <Pressable style={styles.modalButton} onPress={handleUpgradeToPro}>
              <Text style={styles.modalButtonText}>Upgrade to Pro ($2)</Text>
            </Pressable>
            <Pressable style={styles.modalSecondary} onPress={() => setShowUpgradeModal(false)}>
              <Text style={styles.modalSecondaryText}>Maybe later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showScienceModal} transparent animationType="fade" onRequestClose={() => setShowScienceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalKicker}>The Science</Text>
            <Text style={styles.modalTitle}>Why environmental drag matters</Text>
            <Text style={styles.modalBody}>
              BrainFriction is a practical environmental load model, not a magic trick. It reads how location and
              weather can change the background friction your brain is working against.
            </Text>
            <View style={styles.modalInfoCard}>
              <Text style={styles.modalInfoTitle}>Barometric pressure shifts</Text>
              <Text style={styles.modalInfoBody}>
                Drops in atmospheric pressure often travel with weather fronts and changing air density. That can make
                execution feel slower and heavier.
              </Text>
            </View>
            <View style={styles.modalInfoCard}>
              <Text style={styles.modalInfoTitle}>Biological pressure sensitivity</Text>
              <Text style={styles.modalInfoBody}>
                Pressure, temperature, humidity, and fronts can act like physical drag on fluid-filled biological
                systems. The body notices that shift before you always consciously do.
              </Text>
            </View>
            <View style={styles.modalInfoCard}>
              <Text style={styles.modalInfoTitle}>Telemetry model</Text>
              <Text style={styles.modalInfoBody}>
                Live GPS and weather inputs are blended with a local baseline to estimate when the environment is
                helping or hindering focus windows.
              </Text>
            </View>
            <Pressable style={styles.modalButton} onPress={() => setShowScienceModal(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showHistoryModal} transparent animationType="fade" onRequestClose={() => setShowHistoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalKicker}>Last 7 Days</Text>
            <Text style={styles.modalTitle}>Recent brain reads</Text>
            <Text style={styles.modalBody}>Your latest local reads are stored on-device and rolled into the archive below.</Text>
            <View style={styles.modalList}>
              {history.slice(0, 7).length === 0 ? (
                <Text style={styles.modalBody}>No entries yet.</Text>
              ) : (
                history.slice(0, 7).map((entry) => (
                  <View key={entry.date} style={styles.modalHistoryRow}>
                    <Text style={styles.modalHistoryDate}>{entry.date}</Text>
                    <Text style={styles.modalHistoryValue}>{entry.tension} / {entry.stability}</Text>
                  </View>
                ))
              )}
            </View>
            <Pressable style={styles.modalButton} onPress={() => setShowHistoryModal(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.kicker}>{isPro ? 'Pro' : 'Free'}</Text>
            <Text style={styles.title}>BrainFriction</Text>
            <Text style={styles.subtitle}>{statusText}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.infoButton}
              onPress={() =>
                Alert.alert(
                  'What this means',
                  'Brain = the thinking system.\nMind = the feeling and steadiness underneath it.\n\nBrain Pressure = how heavy your brain feels today.\nBrain Stability = how steady and settled your mind feels.\n\nInputs include GPS location, weather, temperature, humidity, barometric pressure, and weather fronts. Those conditions help estimate environmental drag and focus windows.\n\nHeavy drag = harder to focus, think clearly, or make decisions.\nSmooth flow = easier thinking, clearer focus, calmer energy.',
                )
              }
            >
              <Text style={styles.infoButtonText}>i</Text>
            </Pressable>
            {isPro ? (
              <Pressable style={styles.proBadge} onPress={() => void handleAutoSyncTrigger()}>
                <Text style={styles.proBadgeText}>{isCalibrating ? 'Syncing...' : 'Pro Active'}</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.unlockButton} onPress={() => setShowUpgradeModal(true)}>
                <Text style={styles.unlockButtonText}>Unlock Live Sync &amp; Alerting</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.heroPanel}>

          <View style={[styles.combinedScoreCard, { backgroundColor: combinedState.bg, borderColor: combinedState.color }]}>
            <Text style={styles.combinedLabel}>Combined Brain Score</Text>
            <View style={styles.combinedRow}>
              <Text style={styles.combinedValue}>{combinedScore}</Text>
              <Text style={[styles.combinedState, { color: combinedState.color }]}>{combinedState.label}</Text>
            </View>
          </View>

          <View style={styles.metricGrid}>
            <View style={[styles.metricCell, { borderColor: pressureState.style.borderColor, backgroundColor: pressureState.style.backgroundColor }]}>
              <View style={styles.metricHeaderRow}>
                <View style={styles.metricLabelWrap}>
                  <Text style={styles.metricLabel}>Brain Pressure</Text>
                  <Text style={styles.metricHelper}>How heavy your brain feels</Text>
                </View>
                <Text style={[styles.metricZone, { color: pressureState.style.color }]}>{pressureState.label}</Text>
              </View>
              <Text style={styles.metricValue}>{tension}</Text>
              <View style={styles.meterRow}>
                <Text style={[styles.meterText, { color: pressureState.style.color }]}>Calm</Text>
                <View style={styles.meterTrack}>
                  <View
                    style={[
                      styles.meterFill,
                      {
                        width: `${Math.min(Math.max((tension / 100) * 100, 8), 92)}%`,
                        backgroundColor: tension >= 70 ? '#ff8a65' : tension <= 35 ? '#63e6a7' : '#8cd8ff',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.meterMarker,
                      {
                        left: `${Math.min(Math.max((tension / 100) * 100, 6), 94)}%`,
                        backgroundColor: tension >= 70 ? '#ff8a65' : tension <= 35 ? '#63e6a7' : '#8cd8ff',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.meterText, { color: pressureState.style.color }]}>Heavy</Text>
              </View>
              <Text style={[styles.metricSummary, { color: pressureState.style.color }]}>
                {tension >= 70 ? 'Bad for focus' : tension <= 35 ? 'Good for focus' : 'Okay, but watch it'}
              </Text>
            </View>
            <View style={[styles.metricCell, { borderColor: flowState.style.borderColor, backgroundColor: flowState.style.backgroundColor }]}>
              <View style={styles.metricHeaderRow}>
                <View style={styles.metricLabelWrap}>
                  <Text style={styles.metricLabel}>Brain Stability</Text>
                  <Text style={styles.metricHelper}>How steady your mind feels</Text>
                </View>
                <Text style={[styles.metricZone, { color: flowState.style.color }]}>{flowState.label}</Text>
              </View>
              <Text style={styles.metricValue}>{stability}</Text>
              <View style={styles.meterRow}>
                <Text style={[styles.meterText, { color: flowState.style.color }]}>Unsteady</Text>
                <View style={styles.meterTrack}>
                  <View
                    style={[
                      styles.meterFill,
                      {
                        width: `${Math.min(Math.max((stability / 100) * 100, 8), 92)}%`,
                        backgroundColor: stability >= 75 ? '#63e6a7' : stability <= 45 ? '#ff8a65' : '#8cd8ff',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.meterMarker,
                      {
                        left: `${Math.min(Math.max((stability / 100) * 100, 6), 94)}%`,
                        backgroundColor: stability >= 75 ? '#63e6a7' : stability <= 45 ? '#ff8a65' : '#8cd8ff',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.meterText, { color: flowState.style.color }]}>Steady</Text>
              </View>
              <Text style={[styles.metricSummary, { color: flowState.style.color }]}>
                {stability >= 75 ? 'Good headspace' : stability <= 45 ? 'Harder to settle' : 'Solid but watch'}
              </Text>
            </View>
          </View>

          <View style={[styles.insightBanner, isHeavyDrag ? styles.warningBanner : styles.successBanner]}>
            <Text style={styles.statusLabel}>{isHeavyDrag ? 'Heavy Drag' : isIdealFlow ? 'Smooth Flow' : 'Steady'}</Text>
            <Text style={styles.insightText}>
              {isHeavyDrag
                ? 'This means your brain is dealing with extra pressure. It will usually feel harder to think clearly, focus, or make decisions.'
                : 'This means things feel much lighter and easier. Your brain is likely working with less stress and more clarity.'}
            </Text>
          </View>
        </View>

        <View style={styles.utilityRow}>
          <Pressable style={styles.utilityButton} onPress={() => setShowScienceModal(true)}>
            <Text style={styles.utilityButtonText}>The Science</Text>
          </Pressable>
          <Pressable style={styles.utilityButton} onPress={() => setShowHistoryModal(true)}>
            <Text style={styles.utilityButtonText}>Last 7 Days</Text>
          </Pressable>
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
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 28,
    backgroundColor: '#07111d',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  kicker: {
    color: '#7af7d1',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: '#f2f7ff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: '#9bb0c8',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  unlockButton: {
    backgroundColor: '#7af7d1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
  },
  unlockButtonText: {
    color: '#06121c',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  proBadge: {
    backgroundColor: '#102b23',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#63e6a7',
  },
  proBadgeText: {
    color: '#d8ffe8',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  heroPanel: {
    backgroundColor: '#0d1729',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1c2b42',
    padding: 18,
    marginBottom: 18,
    position: 'relative',
  },
  infoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  infoButtonText: {
    color: '#edf5ff',
    fontSize: 14,
    fontWeight: '700',
  },
  insightBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
  },
  warningBanner: {
    backgroundColor: '#2c1723',
    borderColor: '#ff7f7a',
  },
  successBanner: {
    backgroundColor: '#102b23',
    borderColor: '#63e6a7',
  },
  statusLabel: {
    color: '#f5fbff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  insightText: {
    color: '#dfeaf7',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  combinedScoreCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  combinedLabel: {
    color: '#dfeaf7',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  combinedRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  combinedValue: {
    color: '#f5fbff',
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 42,
  },
  combinedState: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  metricCell: {
    backgroundColor: '#101d2d',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  metricLabelWrap: {
    flex: 1,
  },
  metricLabel: {
    color: '#9bb0c8',
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  metricHelper: {
    color: '#dfeaf7',
    fontSize: 10,
    opacity: 0.8,
    marginTop: 4,
    lineHeight: 14,
  },
  metricZone: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  metricValue: {
    color: '#f4f8ff',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 38,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  meterTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    position: 'relative',
    overflow: 'hidden',
  },
  meterFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  meterMarker: {
    position: 'absolute',
    top: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#07111d',
    transform: [{ translateX: -9 }],
  },
  meterText: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  metricSummary: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '800',
    marginTop: 10,
  },
  sectionLabel: {
    color: '#a7bdd5',
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  historyWidget: {
    backgroundColor: '#0d1729',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1b2d44',
    padding: 18,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#16273d',
  },
  historyDate: {
    color: '#c7d5ea',
  },
  historyValue: {
    color: '#f5fbff',
    fontWeight: '600',
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
    fontSize: 28,
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
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#05151c',
    fontSize: 16,
    fontWeight: '700',
  },
  utilityRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  utilityButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#314c6f',
    backgroundColor: '#101d2d',
    paddingVertical: 14,
    alignItems: 'center',
  },
  utilityButtonText: {
    color: '#edf5ff',
    fontWeight: '700',
  },
  modalInfoCard: {
    backgroundColor: '#101d2d',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e2f49',
    padding: 14,
    marginBottom: 10,
  },
  modalInfoTitle: {
    color: '#f5fbff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInfoBody: {
    color: '#dfeaf7',
    lineHeight: 21,
    fontSize: 13,
  },
  modalList: {
    marginBottom: 12,
  },
  modalHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#16273d',
  },
  modalHistoryDate: {
    color: '#c7d5ea',
  },
  modalHistoryValue: {
    color: '#f5fbff',
    fontWeight: '600',
  },
  modalSecondary: {
    borderWidth: 1,
    borderColor: '#324d6d',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSecondaryText: {
    color: '#dfeaf7',
    fontSize: 15,
    fontWeight: '600',
  },
});

function buildInsightText(tension: number, stability: number) {
  if (tension >= 70 && stability <= 55) {
    return '⚠️ Moderate friction: Environmental load is elevated. Expect a heavier cognitive drag today—pace your execution.';
  }

  if (tension >= 80 || stability <= 45) {
    return '⚠️ High load: your system is running under pressure. Reduce task stacking and protect your focus windows.';
  }

  if (tension <= 45 && stability >= 70) {
    return '✅ Smooth flow: your environment feels low-friction and your baseline is stable. Lean into momentum.';
  }

  return '⚠️ Some drag is present, but not severe. Keep your decisions simple and your pace deliberate.';
}
