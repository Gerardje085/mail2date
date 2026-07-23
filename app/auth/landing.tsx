import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ArrowRight, Shield, Heart, Sparkles } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import { AppLogo } from '@/components/AppLogo';

export default function LandingScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleEmailSubmit = async () => {
    setError(null);
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const { error: supaError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: 'myapp://auth/callback' },
    });
    setLoading(false);
    if (supaError) {
      setError(supaError.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.background, Colors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sentContainer}>
          <View style={styles.sentIconCircle}>
            <Mail size={40} color={Colors.primary} />
          </View>
          <Text style={styles.sentTitle}>Check your inbox</Text>
          <Text style={styles.sentSubtitle}>
            We sent a secure sign-in link to{'\n'}
            <Text style={styles.sentEmail}>{email}</Text>
          </Text>
          <Text style={styles.sentHint}>
            Tap the link in the email to continue. No password needed — ever.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setSent(false);
              setEmail('');
            }}
          >
            <Text style={styles.backButtonText}>Use a different email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[Colors.background, Colors.surface]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <View style={styles.logoWrap}>
              <AppLogo size={64} />
            </View>
            <Text style={styles.headline}>Dating that respects you.</Text>
            <Text style={styles.subheadline}>
              No swiping. No games. Just one thoughtful match a day, real date ideas, and a
              community that values kindness.
            </Text>
          </View>

          <View style={styles.featuresRow}>
            <FeatureChip icon={<Shield size={16} color={Colors.primary} />} label="Privacy-first" />
            <FeatureChip icon={<Heart size={16} color={Colors.primary} />} label="Anti-swipe" />
            <FeatureChip icon={<Sparkles size={16} color={Colors.primary} />} label="AI-curated" />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Enter your email to begin</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <Mail size={20} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={handleEmailSubmit}
                />
              </View>
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleEmailSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textInverse} size="small" />
                ) : (
                  <ArrowRight size={22} color={Colors.textInverse} />
                )}
              </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Text style={styles.legalText}>
              By continuing you agree to our Terms & Privacy Policy. We never share your data
              or show your last name.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.featureChip}>
      {icon}
      <Text style={styles.featureChipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  heroSection: { alignItems: 'center', marginBottom: 36 },
  headline: {
    fontFamily: 'Inter-Bold',
    fontSize: 30,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subheadline: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 44,
    flexWrap: 'wrap',
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  featureChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  inputSection: { maxWidth: 440, width: '100%', alignSelf: 'center' },
  inputLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    height: '100%',
  },
  submitBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.error,
    marginTop: 12,
    textAlign: 'center',
  },
  legalText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  sentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  sentIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sentTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  sentSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  sentEmail: { fontFamily: 'Inter-Bold', color: Colors.textPrimary },
  sentHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  backButton: { paddingVertical: 12, paddingHorizontal: 20 },
  backButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.primary,
  },
});
