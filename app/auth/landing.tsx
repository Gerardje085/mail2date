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
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ArrowRight, Shield, Heart, Sparkles, LogIn, UserPlus } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { Colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import { AppLogo } from '@/components/AppLogo';

export default function LandingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const [otpToken, setOtpToken] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleEmailSubmit = async () => {
    setError(null);
    if (!email.trim() || !email.includes('@')) {
      setError('Vul AUB een geldig e-mailadres in.');
      return;
    }
    setLoading(true);
    const redirectUrl = Linking.createURL('auth/callback');
    const { error: supaError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectUrl },
    });
    setLoading(false);
    if (supaError) {
      setError(supaError.message);
      return;
    }
    setSent(true);
  };

  const handleVerifyOtp = async () => {
    if (!otpToken.trim()) {
      setError('Vul AUB de 6-cijferige code uit de e-mail in.');
      return;
    }
    setError(null);
    setVerifying(true);
    const { error: supaError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otpToken.trim(),
      type: 'email',
    });
    setVerifying(false);
    if (supaError) {
      setError('Ongeldige of verlopen code. Probeer het opnieuw.');
      return;
    }
    router.replace('/');
  };

  if (sent) {
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
            contentContainerStyle={[
              styles.scrollContent,
              isTablet && styles.tabletScrollContent,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.sentContainer, isTablet && { maxWidth: 520, alignSelf: 'center' }]}>
              <View style={styles.sentIconCircle}>
                <Mail size={40} color={Colors.primary} />
              </View>
              <Text style={styles.sentTitle}>Check je inbox</Text>
              <Text style={styles.sentSubtitle}>
                We hebben een e-mail gestuurd naar{'\n'}
                <Text style={styles.sentEmail}>{email}</Text>
              </Text>
              <Text style={styles.sentHint}>
                Vul hieronder de 6-cijferige code uit de e-mail in om in te loggen:
              </Text>

              <View style={[styles.inputSection, { marginTop: 16 }]}>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={[
                      styles.input,
                      { textAlign: 'center', letterSpacing: 8, fontSize: 24, fontFamily: 'Inter-Bold' },
                    ]}
                    placeholder="123456"
                    placeholderTextColor={Colors.textTertiary}
                    value={otpToken}
                    onChangeText={setOtpToken}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus={true}
                    onSubmitEditing={handleVerifyOtp}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.submitBtnFull, verifying && styles.submitBtnDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={verifying}
                  activeOpacity={0.85}
                >
                  {verifying ? (
                    <ActivityIndicator color={Colors.textInverse} size="small" />
                  ) : (
                    <Text style={styles.submitBtnFullText}>Verifieer & Inloggen</Text>
                  )}
                </TouchableOpacity>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.backButton, { marginTop: 16 }]}
                onPress={() => {
                  setSent(false);
                  setEmail('');
                  setOtpToken('');
                  setError(null);
                }}
              >
                <Text style={styles.backButtonText}>Ander e-mailadres gebruiken</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
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
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.mainCard, isTablet && { maxWidth: 580, alignSelf: 'center', width: '100%' }]}>
            <View style={styles.logoWrap}>
              <AppLogo size={64} variant="default" />
            </View>

            {/* Auth Mode Toggle Tabs */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleTab, authMode === 'login' && styles.toggleTabActive]}
                onPress={() => {
                  setAuthMode('login');
                  setError(null);
                }}
                activeOpacity={0.8}
              >
                <LogIn size={16} color={authMode === 'login' ? Colors.textInverse : Colors.textSecondary} />
                <Text style={[styles.toggleTabText, authMode === 'login' && styles.toggleTabTextActive]}>
                  Inloggen
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleTab, authMode === 'register' && styles.toggleTabActive]}
                onPress={() => {
                  setAuthMode('register');
                  setError(null);
                }}
                activeOpacity={0.8}
              >
                <UserPlus size={16} color={authMode === 'register' ? Colors.textInverse : Colors.textSecondary} />
                <Text style={[styles.toggleTabText, authMode === 'register' && styles.toggleTabTextActive]}>
                  Nieuw Account
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
              <Text style={styles.headline}>
                {authMode === 'login' ? 'Welkom terug bij Mail2Date' : 'Dating die jou respecteert.'}
              </Text>
              <Text style={styles.subheadline}>
                {authMode === 'login'
                  ? 'Vul je e-mailadres in om in te loggen op je account en je matches te bekijken.'
                  : 'Geen swipen. Geen spelletjes. Slechts één doordachte match per dag, echte date-ideeën en privacy voorop.'}
              </Text>
            </View>

            <View style={styles.featuresRow}>
              <FeatureChip icon={<Shield size={16} color={Colors.primary} />} label="Privacy-first" />
              <FeatureChip icon={<Heart size={16} color={Colors.primary} />} label="Anti-swipe" />
              <FeatureChip icon={<Sparkles size={16} color={Colors.primary} />} label="AI-curated" />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {authMode === 'login'
                  ? 'Vul je e-mailadres in om in te loggen'
                  : 'Vul je e-mailadres in om te beginnen'}
              </Text>
              <View style={styles.inputRow}>
                <View style={styles.inputWrap}>
                  <Mail size={20} color={Colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="jouw@email.nl"
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
                Door door te gaan ga je akkoord met onze Algemene Voorwaarden & Privacybeleid. We delen jouw gegevens nooit en tonen geen achternamen.
              </Text>
            </View>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  tabletScrollContent: {
    paddingHorizontal: 48,
    paddingTop: 80,
  },
  mainCard: {
    width: '100%',
  },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 24,
    maxWidth: 360,
    alignSelf: 'center',
    width: '100%',
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  toggleTabActive: {
    backgroundColor: Colors.primary,
  },
  toggleTabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  toggleTabTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.textInverse,
  },
  heroSection: { alignItems: 'center', marginBottom: 28 },
  headline: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subheadline: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 36,
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
  submitBtnFull: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitBtnFullText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textInverse,
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
    paddingHorizontal: 20,
  },
  sentIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    marginBottom: 24,
  },
  backButton: { paddingVertical: 12, paddingHorizontal: 20 },
  backButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.primary,
  },
});
