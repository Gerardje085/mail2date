import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
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
    title: 'Top 10 Date-Ideeën',
    description: 'Breid je dagelijkse suggesties uit van Top 3 naar Top 10 geselecteerde date-ideeën.',
  },
  {
    icon: Crown,
    title: 'Direct Match Resetten',
    description: 'Reset je "Match van de Dag" timer wanneer je wilt — zonder wachttijd.',
  },
  {
    icon: Filter,
    title: 'Geavanceerde AI Filters',
    description: 'Diepere interesse-matching en exacte zoekstraal-filters op de Ontdekken pagina.',
  },
  {
    icon: Ticket,
    title: 'Exclusieve Partner Vouchers',
    description: '2e kaartje gratis bij Pathé, 10% korting bij partner-restaurants en meer lokale deals.',
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', user.id);
    setLoading(false);
    if (error) {
      Alert.alert('Fout', 'Abonnement kon niet worden verwerkt. Probeer het opnieuw.');
      return;
    }
    await refreshProfile();
    Alert.alert('Welkom bij Mail2Date+!', 'Je hebt nu toegang tot alle premium functies!');
    router.back();
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.container}>
      <View style={[styles.header, isTablet && { maxWidth: 680, alignSelf: 'center', width: '100%' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && { maxWidth: 680, alignSelf: 'center', width: '100%' },
        ]}
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
            Premium functies voor een nog betere dating ervaring. Geen pay-to-win — gewoon meer gemak en mogelijkheden.
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
          <Text style={styles.pricingPeriod}>per maand</Text>
          <Text style={styles.pricingNote}>Zonder verplichtingen. Maandelijks opzegbaar.</Text>
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
              <Text style={styles.subscribeBtnText}>Neem Mail2Date+</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.fairPlayBanner}>
          <Check size={16} color={Colors.success} />
          <Text style={styles.fairPlayText}>
            100% Eerlijk. Geen betaalde boosts, geen voordelen bij zichtbaarheid. Iedereen krijgt een gelijke kans op de liefde.
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
