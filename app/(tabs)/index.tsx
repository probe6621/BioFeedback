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

  const vectorAngle = useMemo(() => `${(stability - 50) * 2.1}deg`, [stability]);

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
          <View>
            <Text style={styles.kicker}>{isPro ? 'Pro' : 'Free'}</Text>
            <Text style={styles.title}>Daily Environmental Check-In</Text>
            <Text style={styles.subtitle}>{statusText}</Text>
          </View>
          <Pressable style={styles.statusPill} onPress={() => void handleAutoSyncTrigger()}>
            <Text style={styles.pillText}>{isCalibrating ? 'Calibrating...' : isPro ? 'Live' : 'Locked'}</Text>
          </Pressable>
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.vectorPanel}>
            <View style={styles.vectorGuide}>
              <View
                style={[
                  styles.vectorBeam,
                  { transform: [{ rotate: vectorAngle }] },
                ]}
              />
              <View style={styles.vectorNode} />
            </View>
          </View>

          <View style={styles.metricGrid}>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>Environmental & Internal Pressure</Text>
              <Text style={styles.metricValue}>{tension}</Text>
              <Text style={styles.metricTarget}>Target: Low (20–45)</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>Coherence & Baseline Flow</Text>
              <Text style={styles.metricValue}>{stability}</Text>
              <Text style={styles.metricTarget}>Target: High (75–95)</Text>
            </View>
          </View>

          <View style={[styles.insightBanner, tension > 65 || stability < 65 ? styles.warningBanner : styles.successBanner]}>
            <Text style={styles.statusLabel}>{tension > 65 || stability < 65 ? 'Status: High Environmental Friction' : 'Status: Low-Friction Flow State'}</Text>
            <Text style={styles.insightText}>{tension > 65 || stability < 65 ? 'Why You Care: Your cognitive battery is leaking twice as fast today. Expect heavy brain fog and faster mental fatigue.' : 'Why You Care: Zero atmospheric drag. Your internal circuit is locked in.'}</Text>
            <Text style={styles.insightText}>{tension > 65 || stability < 65 ? 'Action: Do not tackle complex deep work right now. Protect your focus blocks and keep decisions simple.' : 'Action: This is your green light. Lean hard into execution and tackle your hardest tasks now.'}</Text>
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
            <VectorSlider label="Environmental & Internal Pressure" value={tension} onChange={setTension} accent="#7af7d1" />
            <VectorSlider label="Coherence & Baseline Flow" value={stability} onChange={setStability} accent="#8cd8ff" />
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
    marginBottom: 16,
  },
  kicker: {
    color: '#7af7d1',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: '#f2f7ff',
    fontSize: 28,
    fontWeight: '800',
    maxWidth: 220,
  },
  subtitle: {
    color: '#9bb0c8',
    fontSize: 12,
    marginTop: 10,
    maxWidth: 230,
    lineHeight: 18,
  },
  statusPill: {
    backgroundColor: '#101d2d',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#243752',
    marginTop: 12,
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
  vectorPanel: {
    height: 180,
    borderRadius: 22,
    backgroundColor: '#0a1320',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  vectorGuide: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 110,
    borderWidth: 1,
    borderColor: '#20314d',
    position: 'relative',
  },
  vectorBeam: {
    width: 160,
    height: 3,
    backgroundColor: '#8cd8ff',
    borderRadius: 999,
    position: 'absolute',
  },
  vectorNode: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7af7d1',
    position: 'absolute',
    shadowColor: '#7af7d1',
    shadowOpacity: 0.8,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCell: {
    flex: 1,
    backgroundColor: '#101d2d',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e2f49',
  },
  metricLabel: {
    color: '#9bb0c8',
    fontSize: 12,
    marginBottom: 8,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#f4f8ff',
    fontSize: 26,
    fontWeight: '700',
  },
  metricTarget: {
    color: '#aabbd0',
    fontSize: 11,
    marginTop: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
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
