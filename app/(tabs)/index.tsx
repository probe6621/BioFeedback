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
import { TensionCard } from '../../components/TensionCard';
import { VectorSlider } from '../../components/VectorSlider';
import { runAutoSync } from '../../src/services/autoSync';
import { getIsPro, setIsPro } from '../../src/services/subscription';
import { DailyCheckIn, getRecentCheckIns, saveDailyCheckIn } from '../../utils/storage';

const defaultTension = 72;
const defaultStability = 64;

export default function IndexScreen() {
  const [tension, setTension] = useState(defaultTension);
  const [stability, setStability] = useState(defaultStability);
  const [history, setHistory] = useState<DailyCheckIn[]>([]);
  const [showCard, setShowCard] = useState(false);
  const [statusText, setStatusText] = useState('Running local ambient baseline (Tap to sync GPS)');
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [isPro, setProState] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
          setStatusText('Using your last local check-in as a starting point');
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
        setStatusText(
          nextValues.statusText
            .replace('Location permission unavailable — using fallback field calibration', 'Running local ambient baseline (Tap to sync GPS)')
            .replace('Connection drift detected — fallback field calibration applied', 'Running local ambient baseline (Tap to sync GPS)')
            .replace('Offline calibration active — using ambient fallback estimate', 'Running local ambient baseline (Tap to sync GPS)'),
        );
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
    setStatusText(
      nextValues.statusText
        .replace('Location permission unavailable — using fallback field calibration', 'Running local ambient baseline (Tap to sync GPS)')
        .replace('Connection drift detected — fallback field calibration applied', 'Running local ambient baseline (Tap to sync GPS)')
        .replace('Offline calibration active — using ambient fallback estimate', 'Running local ambient baseline (Tap to sync GPS)'),
    );
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
      return { label: 'Heavy', style: { backgroundColor: '#2c1723', borderColor: '#ff8a65', color: '#ffd6c8' } };
    }
    if (tension <= 35) {
      return { label: 'Ideal', style: { backgroundColor: '#102b23', borderColor: '#63e6a7', color: '#d8ffe8' } };
    }
    return { label: 'Watch', style: { backgroundColor: '#1e2635', borderColor: '#f7b267', color: '#ffe8b7' } };
  }, [tension]);

  const flowState = useMemo(() => {
    if (stability >= 75) {
      return { label: 'Ideal', style: { backgroundColor: '#102b23', borderColor: '#63e6a7', color: '#d8ffe8' } };
    }
    if (stability <= 45) {
      return { label: 'Heavy', style: { backgroundColor: '#2c1723', borderColor: '#ff8a65', color: '#ffd6c8' } };
    }
    return { label: 'Watch', style: { backgroundColor: '#1e2635', borderColor: '#f7b267', color: '#ffe8b7' } };
  }, [stability]);

  const isHeavyDrag = tension >= 70 || stability <= 45;
  const isIdealFlow = tension <= 35 && stability >= 75;

  const saveLog = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const nextHistory = await saveDailyCheckIn({ date: today, tension, stability });
    setHistory(nextHistory);
    setShowCard(true);
    Alert.alert('Daily vector logged', 'Your telemetry has been stored locally for the week.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal visible={showUpgradeModal} transparent animationType="fade" onRequestClose={() => setShowUpgradeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalKicker}>Pro unlock</Text>
            <Text style={styles.modalTitle}>Unlock Real-Time Environmental Auto-Sync</Text>
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

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.kicker}>{isPro ? 'Pro' : 'Free'}</Text>
            <Text style={styles.title}>Flow check-in</Text>
            <Text style={styles.subtitle}>{statusText}</Text>
          </View>
          <Pressable style={styles.statusPill} onPress={() => void handleAutoSyncTrigger()}>
            <Text style={styles.pillText}>{isCalibrating ? 'Calibrating...' : isPro ? 'Live' : 'Locked'}</Text>
          </Pressable>
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.metricGrid}>
            <View style={[styles.metricCell, { borderColor: pressureState.style.borderColor, backgroundColor: pressureState.style.backgroundColor }]}>
              <View style={styles.metricHeaderRow}>
                <Text style={styles.metricLabel}>Pressure</Text>
                <Text style={[styles.metricZone, { color: pressureState.style.color }]}>{pressureState.label}</Text>
              </View>
              <Text style={styles.metricValue}>{tension}</Text>
              <View style={styles.meterRow}>
                <Text style={[styles.meterText, { color: pressureState.style.color }]}>Low</Text>
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
                <Text style={[styles.meterText, { color: pressureState.style.color }]}>High</Text>
              </View>
              <Text style={[styles.metricSummary, { color: pressureState.style.color }]}>
                {tension >= 70 ? 'Too high' : tension <= 35 ? 'Good' : 'Watch'}
              </Text>
            </View>
            <View style={[styles.metricCell, { borderColor: flowState.style.borderColor, backgroundColor: flowState.style.backgroundColor }]}>
              <View style={styles.metricHeaderRow}>
                <Text style={styles.metricLabel}>Stability</Text>
                <Text style={[styles.metricZone, { color: flowState.style.color }]}>{flowState.label}</Text>
              </View>
              <Text style={styles.metricValue}>{stability}</Text>
              <View style={styles.meterRow}>
                <Text style={[styles.meterText, { color: flowState.style.color }]}>Low</Text>
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
                <Text style={[styles.meterText, { color: flowState.style.color }]}>High</Text>
              </View>
              <Text style={[styles.metricSummary, { color: flowState.style.color }]}>
                {stability >= 75 ? 'Good' : stability <= 45 ? 'Too low' : 'Watch'}
              </Text>
            </View>
          </View>

          <View style={[styles.insightBanner, isHeavyDrag ? styles.warningBanner : styles.successBanner]}>
            <Text style={styles.statusLabel}>{isHeavyDrag ? 'High Friction / Heavy Drag' : isIdealFlow ? 'Low Friction / Ideal Flow' : 'Balanced / Steady Load'}</Text>
            <Text style={styles.insightText}>
              {isHeavyDrag
                ? 'Your environment is pushing against focus. Keep the work lighter and delay high-complexity choices.'
                : 'The signal is clear. This is a good window to move decisively and keep momentum high.'}
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Pressable style={styles.primaryButton} onPress={saveLog}>
            <Text style={styles.primaryButtonText}>Log Daily Check-In</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => setShowCard(true)}>
            <Text style={styles.secondaryButtonText}>Generate Tension Card</Text>
          </Pressable>

          <View style={styles.sliderBlock}>
            <Text style={styles.sliderTitle}>Adjust your read</Text>
            <VectorSlider
              label="Pressure"
              value={tension}
              onChange={setTension}
              accent={tension >= 70 ? '#ff8a65' : tension <= 35 ? '#63e6a7' : '#8cd8ff'}
            />
            <VectorSlider
              label="Stability"
              value={stability}
              onChange={setStability}
              accent={stability >= 75 ? '#63e6a7' : stability <= 45 ? '#ff8a65' : '#8cd8ff'}
            />
          </View>
        </View>

        {showCard ? (
          <View style={styles.shareSection}>
            <Text style={styles.sectionLabel}>Share preview</Text>
            <TensionCard
              tension={tension}
              stability={stability}
              dateLabel={new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            />
          </View>
        ) : null}

        <View style={styles.historyWidget}>
          <Text style={styles.sectionLabel}>Last 7-day drift</Text>
          {history.slice(0, 4).map((entry) => (
            <View key={entry.date} style={styles.historyRow}>
              <Text style={styles.historyDate}>{entry.date}</Text>
              <Text style={styles.historyValue}>{entry.tension} / {entry.stability}</Text>
            </View>
          ))}
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
  statusPill: {
    backgroundColor: '#101d2d',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#243752',
    marginTop: 8,
  },
  pillText: {
    color: '#dfeaf7',
    fontWeight: '600',
  },
  heroPanel: {
    backgroundColor: '#0d1729',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1c2b42',
    padding: 18,
    marginBottom: 18,
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
    alignItems: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    color: '#9bb0c8',
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
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
  formCard: {
    backgroundColor: '#0d1729',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1b2d44',
    padding: 18,
    marginBottom: 18,
  },
  sliderBlock: {
    marginTop: 18,
  },
  sliderTitle: {
    color: '#dfeaf7',
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  primaryButton: {
    borderRadius: 16,
    backgroundColor: '#7af7d1',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#06121c',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#314c6f',
    backgroundColor: '#101d2d',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#edf5ff',
    fontSize: 15,
    fontWeight: '600',
  },
  shareSection: {
    marginBottom: 18,
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
