import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, MapPin, User, Calendar, Heart, ArrowRight } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { INTEREST_TAGS } from '@/lib/constants';
import { AppLogo } from '@/components/AppLogo';
import type { Profile } from '@/lib/types';

const STEPS = ['name', 'age', 'prefs', 'location', 'interests'] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('name');
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(35);
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(step);

  const next = () => {
    setError(null);
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex]);
    } else {
      completeOnboarding();
    }
  };

  const back = () => {
    setError(null);
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  };

  const validate = (): boolean => {
    if (step === 'name' && !firstName.trim()) {
      setError('Please enter your first name.');
      return false;
    }
    if (step === 'age') {
      const a = parseInt(age, 10);
      if (!a || a < 18 || a > 99) {
        setError('You must be 18 or older.');
        return false;
      }
    }
    if (step === 'location' && (!city.trim() || !postalCode.trim())) {
      setError('Please enter your city and postal code.');
      return false;
    }
    if (step === 'interests' && selectedInterests.length < 3) {
      setError('Select at least 3 interests.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validate()) next();
  };

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const completeOnboarding = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: user.id,
      first_name: firstName.trim(),
      age: parseInt(age, 10),
      city: city.trim(),
      postal_code: postalCode.trim(),
      match_age_min: ageMin,
      match_age_max: ageMax,
      interests: selectedInterests,
      onboarding_complete: true,
    });
    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    await refreshProfile();
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient
      colors={[Colors.background, Colors.surface]}
      style={styles.container}
    >
      <View style={styles.header}>
        <AppLogo size={36} showText={false} />
        <View style={styles.progressContainer}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                i <= stepIndex ? styles.progressDotActive : {},
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'name' && (
          <StepContainer
            icon={<User size={28} color={Colors.primary} />}
            title="What should we call you?"
            subtitle="First name only. We never ask for your last name — your privacy comes first."
          >
            <TextInput
              style={styles.textInput}
              placeholder="First name"
              placeholderTextColor={Colors.textTertiary}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
            />
          </StepContainer>
        )}

        {step === 'age' && (
          <StepContainer
            icon={<Calendar size={28} color={Colors.primary} />}
            title="How old are you?"
            subtitle="Your exact age helps us match you with people in your preferred range."
          >
            <TextInput
              style={[styles.textInput, { textAlign: 'center', fontSize: 28 }]}
              placeholder="23"
              placeholderTextColor={Colors.textTertiary}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={2}
              autoFocus
            />
          </StepContainer>
        )}

        {step === 'prefs' && (
          <StepContainer
            icon={<Heart size={28} color={Colors.primary} />}
            title="What age range are you interested in?"
            subtitle="Drag the sliders to set your preferred match range."
          >
            <View style={styles.sliderContainer}>
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderValue}>{ageMin}</Text>
                <Text style={styles.sliderValue}>{ageMax}</Text>
              </View>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>Min: </Text>
                <Stepper
                  value={ageMin}
                  onDecrement={() => setAgeMin((v) => Math.max(18, v - 1))}
                  onIncrement={() => setAgeMin((v) => Math.min(ageMax - 1, v + 1))}
                />
              </View>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>Max: </Text>
                <Stepper
                  value={ageMax}
                  onDecrement={() => setAgeMax((v) => Math.max(ageMin + 1, v - 1))}
                  onIncrement={() => setAgeMax((v) => Math.min(99, v + 1))}
                />
              </View>
            </View>
          </StepContainer>
        )}

        {step === 'location' && (
          <StepContainer
            icon={<MapPin size={28} color={Colors.primary} />}
            title="Where are you based?"
            subtitle="We use this for local matchmaking. We never share your exact address."
          >
            <TextInput
              style={styles.textInput}
              placeholder="City (e.g. Amsterdam)"
              placeholderTextColor={Colors.textTertiary}
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
            />
            <View style={{ height: 12 }} />
            <TextInput
              style={styles.textInput}
              placeholder="Postal code (e.g. 1011 AB)"
              placeholderTextColor={Colors.textTertiary}
              value={postalCode}
              onChangeText={setPostalCode}
              autoCapitalize="characters"
            />
          </StepContainer>
        )}

        {step === 'interests' && (
          <StepContainer
            icon={<Heart size={28} color={Colors.primary} />}
            title="What are you into?"
            subtitle="Pick at least 3. These power your AI matches and date ideas."
          >
            <View style={styles.interestGrid}>
              {INTEREST_TAGS.map((tag) => {
                const selected = selectedInterests.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.interestPill,
                      selected ? styles.interestPillActive : {},
                    ]}
                    onPress={() => toggleInterest(tag)}
                    activeOpacity={0.7}
                  >
                    {selected && <Check size={14} color={Colors.textInverse} />}
                    <Text
                      style={[
                        styles.interestPillText,
                        selected ? styles.interestPillTextActive : {},
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </StepContainer>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        {stepIndex > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={back}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, saving && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={Colors.textInverse} size="small" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {stepIndex === STEPS.length - 1 ? 'Finish' : 'Continue'}
              </Text>
              <ArrowRight size={20} color={Colors.textInverse} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function StepContainer({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepIcon}>{icon}</View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
      <View style={styles.stepBody}>{children}</View>
    </View>
  );
}

function Stepper({
  value,
  onDecrement,
  onIncrement,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepperBtn} onPress={onDecrement}>
        <Text style={styles.stepperBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{value}</Text>
      <TouchableOpacity style={styles.stepperBtn} onPress={onIncrement}>
        <Text style={styles.stepperBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 12,
  },
  progressContainer: { flexDirection: 'row', gap: 6 },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceBorder,
  },
  progressDotActive: { backgroundColor: Colors.primary },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  stepContainer: { paddingTop: 24 },
  stepIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  stepBody: {},
  textInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 17,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  sliderContainer: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 20,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sliderValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: Colors.primary,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  sliderLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: Colors.textPrimary,
  },
  stepperValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  interestPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  interestPillText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  interestPillTextActive: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    gap: 12,
  },
  backButton: { paddingVertical: 16, paddingHorizontal: 20 },
  backButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
  },
  nextButtonDisabled: { opacity: 0.6 },
  nextButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    color: Colors.textInverse,
  },
});
