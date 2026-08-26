import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

type VectorSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  accent: string;
  style?: ViewStyle;
};

export function VectorSlider({ label, value, onChange, accent, style }: VectorSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  const fillWidth = useMemo(() => {
    if (!trackWidth) return 0;
    return (value / 100) * trackWidth;
  }, [trackWidth, value]);

  const handleLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>

      <View style={styles.track} onLayout={handleLayout}>
        <View style={[styles.fill, { width: fillWidth, backgroundColor: accent }]} />
        <View
          pointerEvents="none"
          style={[styles.thumb, { left: Math.min(Math.max((value / 100) * trackWidth - 12, 0), Math.max(trackWidth - 24, 0)), backgroundColor: accent }]}
        />
      </View>

      <View style={styles.scaleRow}>
        {[0, 25, 50, 75, 100].map((step) => (
          <Text key={step} style={styles.tick}>{step}</Text>
        ))}
      </View>

      <View style={styles.touchZone}>
        {[0, 25, 50, 75, 100].map((step) => (
          <Text
            key={`tap-${step}`}
            onPress={() => onChange(step)}
            style={[styles.tapValue, { color: step === value ? '#ffffff' : '#7a8da8' }]}
          >
            {step}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: '#dfe8f3',
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  value: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  track: {
    position: 'relative',
    height: 16,
    borderRadius: 999,
    backgroundColor: '#172234',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2b3d57',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    opacity: 0.9,
  },
  thumb: {
    position: 'absolute',
    top: -4,
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#09111c',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  tick: {
    color: '#7588a4',
    fontSize: 11,
  },
  touchZone: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  tapValue: {
    fontSize: 12,
    opacity: 0.8,
  },
});
