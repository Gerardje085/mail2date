import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Heart } from 'lucide-react-native';
import { Colors } from '@/lib/colors';

interface AppLogoProps {
  size?: number;
  showText?: boolean;
}

export function AppLogo({ size = 48, showText = true }: AppLogoProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.logoCircle, { width: size, height: size, borderRadius: size / 3.5 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Mail size={size * 0.32} color={Colors.textInverse} strokeWidth={2.5} />
        <View style={[styles.heartBadge, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14 }]}>
          <Heart size={size * 0.16} color={Colors.primary} fill={Colors.primary} strokeWidth={0} />
        </View>
      </LinearGradient>
      {showText && (
        <View style={[styles.textRow, { marginTop: size * 0.25 }]}>
          <Text style={[styles.text, { fontSize: size * 0.38, color: Colors.textPrimary }]}>
            Mail2
          </Text>
          <Text style={[styles.text, { fontSize: size * 0.38, color: Colors.primary }]}>
            Date
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heartBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
  },
});
