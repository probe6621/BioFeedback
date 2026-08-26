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
import { DailyCheckIn, getRecentCheckIns, saveDailyCheckIn } from '../../utils/storage';

const defaultTension = 72;
const defaultStability = 64;

export default function IndexScreen() {
  const [tension, setTension] = useState(defaultTension);
  const [stability, setStability] = useState(defaultStability);
  const [history, setHistory] = useState<DailyCheckIn[]>([]);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    getRecentCheckIns().then(setHistory);
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
            <Text style={styles.kicker}>Phase 1</Text>
            <Text style={styles.title}>Daily Vector Check-In</Text>
          </View>
          <Pressable style={styles.pill} onPress={() => setShowCard((value) => !value)}>
            <Text style={styles.pillText}>{showCard ? 'Hide card' : 'Card'}</Text>
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
              <Text style={styles.metricLabel}>Current Tension</Text>
              <Text style={styles.metricValue}>{tension}</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>Vector Stability</Text>
              <Text style={styles.metricValue}>{stability}</Text>
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <VectorSlider label="Bio-Charge Tension" value={tension} onChange={setTension} accent="#7af7d1" />
          <VectorSlider label="Vector Stability" value={stability} onChange={setStability} accent="#8cd8ff" />

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
    alignItems: 'center',
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
  },
  pill: {
    backgroundColor: '#101d2d',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#243752',
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
