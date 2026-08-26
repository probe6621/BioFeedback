import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type TensionCardProps = {
  tension: number;
  stability: number;
  dateLabel: string;
};

export function TensionCard({ tension, stability, dateLabel }: TensionCardProps) {
  const vectorAngle = (stability - 50) * 1.8;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>Daily telemetry</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>

      <Text style={styles.title}>Bio-Charge Tension</Text>
      <Text style={styles.value}>{tension}</Text>

      <View style={styles.vectorBox}>
        <View
          style={[
            styles.centerDot,
            { transform: [{ rotate: `${vectorAngle}deg` }, { translateY: -10 }] },
          ]}
        />
        <View style={[styles.vectorPath, { transform: [{ rotate: `${vectorAngle}deg` }] }]} />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.statLabel}>Vector Stability</Text>
        <Text style={styles.statValue}>{stability}</Text>
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
  vectorBox: {
    height: 120,
    borderRadius: 20,
    backgroundColor: '#0b1322',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7af7d1',
    position: 'absolute',
  },
  vectorPath: {
    width: 140,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#8cd8ff',
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -70,
    marginTop: -2,
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
