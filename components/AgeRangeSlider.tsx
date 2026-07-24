import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '@/lib/colors';

interface AgeRangeSliderProps {
  min?: number;
  max?: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
}

export function AgeRangeSlider({
  min = 18,
  max = 99,
  valueMin,
  valueMax,
  onChange,
}: AgeRangeSliderProps) {
  const [sliderWidth, setSliderWidth] = useState<number>(0);
  const sliderWidthRef = useRef<number>(0);

  const range = max - min;

  const getAgeFromPosition = (posX: number): number => {
    if (sliderWidthRef.current <= 0) return min;
    const ratio = Math.max(0, Math.min(1, posX / sliderWidthRef.current));
    const calculated = Math.round(min + ratio * range);
    return calculated;
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setSliderWidth(width);
    sliderWidthRef.current = width;
  };

  const panResponderMin = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (sliderWidthRef.current <= 0) return;
        const currentMinRatio = (valueMin - min) / range;
        const currentX = currentMinRatio * sliderWidthRef.current;
        const newX = currentX + gestureState.dx;
        const newAge = getAgeFromPosition(newX);
        const clampedMin = Math.min(Math.max(min, newAge), valueMax - 1);
        if (clampedMin !== valueMin) {
          onChange(clampedMin, valueMax);
        }
      },
    })
  ).current;

  const panResponderMax = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (sliderWidthRef.current <= 0) return;
        const currentMaxRatio = (valueMax - min) / range;
        const currentX = currentMaxRatio * sliderWidthRef.current;
        const newX = currentX + gestureState.dx;
        const newAge = getAgeFromPosition(newX);
        const clampedMax = Math.max(valueMin + 1, Math.min(max, newAge));
        if (clampedMax !== valueMax) {
          onChange(valueMin, clampedMax);
        }
      },
    })
  ).current;

  const leftPercent = ((valueMin - min) / range) * 100;
  const rightPercent = 100 - ((valueMax - min) / range) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.valBadge}>
          <Text style={styles.valBadgeLabel}>Van</Text>
          <Text style={styles.valBadgeValue}>{valueMin} jaar</Text>
        </View>
        <Text style={styles.rangeDivider}>tot</Text>
        <View style={styles.valBadge}>
          <Text style={styles.valBadgeLabel}>Tot</Text>
          <Text style={styles.valBadgeValue}>{valueMax} jaar</Text>
        </View>
      </View>

      <View style={styles.trackContainer} onLayout={handleLayout}>
        <View style={styles.trackBackground} />
        <View
          style={[
            styles.trackActive,
            { left: `${leftPercent}%`, right: `${rightPercent}%` },
          ]}
        />

        {/* Min Thumb */}
        <View
          style={[styles.thumb, { left: `${leftPercent}%` }]}
          {...panResponderMin.panHandlers}
        >
          <View style={styles.thumbInner} />
        </View>

        {/* Max Thumb */}
        <View
          style={[styles.thumb, { left: `${100 - rightPercent}%` }]}
          {...panResponderMax.panHandlers}
        >
          <View style={styles.thumbInner} />
        </View>
      </View>

      <View style={styles.stepperRow}>
        <View style={styles.stepperGroup}>
          <Text style={styles.stepperLabel}>Min: </Text>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => onChange(Math.max(min, valueMin - 1), valueMax)}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepValText}>{valueMin}</Text>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => onChange(Math.min(valueMax - 1, valueMin + 1), valueMax)}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stepperGroup}>
          <Text style={styles.stepperLabel}>Max: </Text>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => onChange(valueMin, Math.max(valueMin + 1, valueMax - 1))}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepValText}>{valueMax}</Text>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => onChange(valueMin, Math.min(max, valueMax + 1))}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  valBadge: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    minWidth: 110,
  },
  valBadgeLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
  },
  valBadgeValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: Colors.primary,
    marginTop: 2,
  },
  rangeDivider: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textTertiary,
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 14,
    marginBottom: 16,
  },
  trackBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceBorder,
    width: '100%',
    position: 'absolute',
  },
  trackActive: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    position: 'absolute',
  },
  thumb: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  thumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 12,
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  stepValText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
});
