import { View, Image, StyleSheet, Text } from 'react-native';
import { Colors } from '@/lib/colors';

export type LogoVariant = 'default' | 'darkText' | 'lightText' | 'iconOnly' | 'transparent';

interface AppLogoProps {
  size?: number;
  showText?: boolean;
  variant?: LogoVariant;
}

export function AppLogo({ size = 48, showText = true, variant = 'default' }: AppLogoProps) {
  const isIconOnly = variant === 'iconOnly' || !showText;

  if (isIconOnly) {
    return (
      <View style={[styles.container, variant === 'transparent' && styles.transparentContainer]}>
        <Image
          source={require('@/assets/images/mail2dateai.png')}
          style={{ width: size, height: size, borderRadius: size * 0.24 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (variant === 'darkText') {
    return (
      <View style={[styles.container, styles.horizontalRow]}>
        <Image
          source={require('@/assets/images/mail2dateai.png')}
          style={{ width: size, height: size, borderRadius: size * 0.24 }}
          resizeMode="contain"
        />
        <View style={styles.textWrap}>
          <Text style={[styles.brandText, { fontSize: size * 0.5, color: '#111827' }]}>
            Mail<Text style={{ color: Colors.primary }}>2</Text>Date
          </Text>
        </View>
      </View>
    );
  }

  if (variant === 'lightText') {
    return (
      <View style={[styles.container, styles.horizontalRow]}>
        <Image
          source={require('@/assets/images/mail2dateai.png')}
          style={{ width: size, height: size, borderRadius: size * 0.24 }}
          resizeMode="contain"
        />
        <View style={styles.textWrap}>
          <Text style={[styles.brandText, { fontSize: size * 0.5, color: '#FFFFFF' }]}>
            Mail<Text style={{ color: Colors.primary }}>2</Text>Date
          </Text>
        </View>
      </View>
    );
  }

  if (variant === 'transparent') {
    return (
      <View style={[styles.container, styles.horizontalRow]}>
        <Image
          source={require('@/assets/images/mail2datetb.png')}
          style={{ width: size * 3.2, height: size * 0.9 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Default variant
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/mail2datetb.png')}
        style={{ width: size * 3.2, height: size * 0.9 }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  transparentContainer: {
    backgroundColor: 'transparent',
  },
  horizontalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textWrap: {
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
  },
});
