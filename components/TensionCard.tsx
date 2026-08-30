import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type TensionCardProps = {
  tension: number;
  stability: number;
  dateLabel: string;
};

export function TensionCard({ tension, stability, dateLabel }: TensionCardProps) {
  const pressureColor = tension >= 70 ? '#ff8a65' : tension <= 35 ? '#63e6a7' : '#8cd8ff';
  const stabilityColor = stability >= 75 ? '#63e6a7' : stability <= 45 ? '#ff8a65' : '#8cd8ff';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>BrainFriction</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>

      <Text style={styles.title}>Combined Brain Score</Text>
      <Text style={[styles.value, { color: pressureColor }]}>{tension}</Text>

      <View style={styles.footerRow}>
        <Text style={styles.statLabel}>Stability</Text>
        <Text style={[styles.statValue, { color: stabilityColor }]}>{stability}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#22314d',
    shadowColor: '#0b1020',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kicker: {
    fontSize: 11,
    color: '#7af7d1',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  date: {
    color: '#a9bbcf',
    fontSize: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#edf5ff',
  },
  value: {
    fontSize: 46,
    fontWeight: '800',
    color: '#7af7d1',
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1f2c40',
  },
  statLabel: {
    color: '#9bb0c8',
    fontSize: 12,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#fefefe',
    fontWeight: '700',
    fontSize: 18,
  },
});
