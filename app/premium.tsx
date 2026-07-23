import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Crown, Check, Zap, Filter, Ticket } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

const PREMIUM_FEATURES = [
  {
    icon: Zap,
    title: 'Top 10 Date Ideas',
    description: 'Expand your daily suggestions from Top 3 to Top 10 curated date ideas.',
  },
  {
    icon: Crown,
    title: 'Instant Match Reset',
    description: 'Reset your "Match of the Day" timer on demand — no waiting required.',
  },
  {
    icon: Filter,
    title: 'Advanced AI Filters',
    description: 'Deep interest matching and exact travel radius filters on Discover.',
  },
  {
    icon: Ticket,
    title: 'Exclusive B2B Vouchers',
    description: '2-for-1 Pathé tickets, 10% off partner restaurants, and more local deals.',
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    // In production, this would integrate with RevenueCat for mobile subscriptions
    // For now, we'll just update the profile
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', user.id);
    setLoading(false);
    if (error) {
      Alert.alert('Error', 'Could not process subscription. Please try again.');
      return;
    }
    await refreshProfile();
    Alert.alert('Welcome to Mail2Date+', 'You now have access to all premium features!');
    router.back();
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['rgba(255,184,48,0.15)', 'rgba(255,184,48,0.05)']}
            style={styles.crownCircle}
          >
            <Crown size={36} color={Colors.accent} />
          </LinearGradient>
          <Text style={styles.title}>Mail2Date+</Text>
          <Text style={styles.subtitle}>
            Premium features for a better dating experience. No pay-to-win — just more
            convenience and access.
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {PREMIUM_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <View key={feature.title} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Icon size={20} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.pricingCard}>
          <Text style={styles.pricingAmount}>€9.99</Text>
          <Text style={styles.pricingPeriod}>per month</Text>
          <Text style={styles.pricingNote}>Cancel anytime. No hidden fees.</Text>
        </View>

        <TouchableOpacity
          style={styles.subscribeBtn}
          onPress={handleSubscribe}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <>
              <Crown size={20} color={Colors.textInverse} />
              <Text style={styles.subscribeBtnText}>Subscribe to Mail2Date+</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.fairPlayBanner}>
          <Check size={16} color={Colors.success} />
          <Text style={styles.fairPlayText}>
            100% Fair Play. No Date Boosts, no Spotlight, no paid visibility. Everyone gets an
            equal chance at love.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  heroSection: { alignItems: 'center', marginBottom: 36, paddingTop: 12 },
  crownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,184,48,0.2)',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: Colors.accent,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  featuresContainer: { gap: 12, marginBottom: 32 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,184,48,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  pricingCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 20,
  },
  pricingAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  pricingPeriod: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  pricingNote: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textTertiary,
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 24,
  },
  subscribeBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    color: Colors.textInverse,
  },
  fairPlayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  fairPlayText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
