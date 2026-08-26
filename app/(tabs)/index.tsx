import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { DailyCheckIn, getRecentCheckIns, saveDailyCheckIn } from '../../utils/storage';

const defaultTension = 72;
const defaultStability = 64;

export default function IndexScreen() {
  const [tension, setTension] = useState(defaultTension);
  const [stability, setStability] = useState(defaultStability);
  const [history, setHistory] = useState<DailyCheckIn[]>([]);
  const [showCard, setShowCard] = useState(false);
  const [statusText, setStatusText] = useState('Atmospheric pressure stable — low friction flow');
  const [isCalibrating, setIsCalibrating] = useState(true);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        const entries = await getRecentCheckIns();
        if (!active) return;

        if (entries.length > 0) {
          const latest = entries[0];
          setTension(latest.tension);
          setStability(latest.stability);
          setStatusText('Restored recent calibration from local cache');
        }

        setHistory(entries);
      } catch {
        setHistory([]);
      }

      const nextValues = await runAutoSync();
      if (!active) return;

      setTension(nextValues.tension);
      setStability(nextValues.stability);
      setStatusText(nextValues.statusText);
      setIsCalibrating(false);
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

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
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>Auto-sync</Text>
            <Text style={styles.title}>Daily Environmental Check-In</Text>
            <Text style={styles.subtitle}>{statusText}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.pillText}>{isCalibrating ? 'Calibrating...' : 'Live'}</Text>
          </View>
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
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>Coherence & Baseline Flow</Text>
              <Text style={styles.metricValue}>{stability}</Text>
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <VectorSlider label="Environmental & Internal Pressure" value={tension} onChange={setTension} accent="#7af7d1" />
          <VectorSlider label="Coherence & Baseline Flow" value={stability} onChange={setStability} accent="#8cd8ff" />

          <Pressable style={styles.primaryButton} onPress={saveLog}>
            <Text style={styles.primaryButtonText}>Log Daily Check-In</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => setShowCard(true)}>
            <Text style={styles.secondaryButtonText}>Generate Tension Card</Text>
          </Pressable>
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
  formCard: {
    backgroundColor: '#0d1729',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1b2d44',
    padding: 18,
    marginBottom: 18,
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
});
