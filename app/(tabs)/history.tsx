import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DailyCheckIn, getRecentCheckIns } from '../../utils/storage';

export default function HistoryScreen() {
  const [history, setHistory] = useState<DailyCheckIn[]>([]);

  useEffect(() => {
    getRecentCheckIns().then(setHistory);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>BrainFriction History</Text>
        <Text style={styles.subtitle}>7-day rolling archive for your free tier.</Text>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No entries yet. Run Auto-Sync once to populate the archive.</Text>
          </View>
        ) : (
          history.map((entry) => (
            <View key={entry.date} style={styles.card}>
              <Text style={styles.date}>{entry.date}</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Brain Pressure</Text>
                <Text style={styles.metricValue}>{entry.tension}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Brain Stability</Text>
                <Text style={styles.metricValue}>{entry.stability}</Text>
              </View>
            </View>
          ))
        )}
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
    marginBottom: 6,
  },
  subtitle: {
    color: '#9bb0c8',
    fontSize: 15,
    marginBottom: 20,
  },
  emptyState: {
    backgroundColor: '#0d1729',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1c2b42',
  },
  emptyText: {
    color: '#dfeaf7',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#0d1729',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1c2b42',
  },
  date: {
    color: '#7af7d1',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    color: '#9bb0c8',
  },
  metricValue: {
    color: '#f5fbff',
    fontWeight: '600',
  },
});
