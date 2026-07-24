import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, MapPin, User, Calendar, Heart, ArrowRight, Sparkles } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { INTEREST_TAGS } from '@/lib/constants';
import { AppLogo } from '@/components/AppLogo';
import { enhanceBioWithAI } from '@/lib/ai';
import { AgeRangeSlider } from '@/components/AgeRangeSlider';

const STEPS = ['name', 'age', 'prefs', 'location', 'interests', 'bio'] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('name');
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(35);
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [aiBios, setAiBios] = useState<{ title: string; bio: string }[]>([]);
  const [generatingAiBio, setGeneratingAiBio] = useState(false);
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
      setError('Vul AUB je voornaam in.');
      return false;
    }
    if (step === 'age') {
      const a = parseInt(age, 10);
      if (!a || a < 18 || a > 99) {
        setError('Je moet 18 jaar of ouder zijn om de app te gebruiken.');
        return false;
      }
    }
    if (step === 'location' && (!city.trim() || !postalCode.trim())) {
      setError('Vul AUB je stad en postcode in.');
      return false;
    }
    if (step === 'interests' && selectedInterests.length < 3) {
      setError('Kies ten minste 3 interesses.');
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

  const handleGenerateAiBio = async () => {
    setGeneratingAiBio(true);
    const results = await enhanceBioWithAI(bio, selectedInterests);
    setAiBios(results);
    setGeneratingAiBio(false);
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
      bio: bio.trim(),
      onboarding_complete: true,
    });
    setSaving(false);
    if (upsertError) {
      if (
        upsertError.message.includes('foreign key constraint') ||
        upsertError.message.includes('profiles_id_fkey')
      ) {
        await supabase.auth.signOut();
        Alert.alert(
          'Sessie Verlopen',
          'Je account-gegevens konden niet opgeslagen worden. Meld je AUB opnieuw aan met je e-mailadres.',
          [{ text: 'OK', onPress: () => router.replace('/auth/landing') }]
        );
        return;
      }
      setError(upsertError.message);
      return;
    }
    await refreshProfile();
  };

  return (
    <LinearGradient
      colors={[Colors.background, Colors.surface]}
      style={styles.container}
    >
      <View style={[styles.header, isTablet && styles.tabletHeader]}>
        <AppLogo size={36} showText={false} />
        <View style={styles.progressContainer}>
          {STEPS.map((s, idx) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                idx <= stepIndex ? styles.progressDotActive : {},
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && { maxWidth: 640, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {step === 'name' && (
          <StepContainer
            icon={<User size={28} color={Colors.primary} />}
            title="Hoe mogen we je noemen?"
            subtitle="Alleen je voornaam. We vragen nooit om je achternaam — jouw privacy staat voorop."
          >
            <TextInput
              style={styles.textInput}
              placeholder="Voornaam"
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
            title="Hoe oud ben je?"
            subtitle="Je leeftijd helpt ons om de beste matches in jouw gewenste categorie te vinden."
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
            title="Naar welke leeftijd zoek je?"
            subtitle="Pas de interactieve leeftijds-range slider aan naar jouw persoonlijke voorkeur."
          >
            <View style={styles.sliderCard}>
              <AgeRangeSlider
                min={18}
                max={99}
                valueMin={ageMin}
                valueMax={ageMax}
                onChange={(newMin, newMax) => {
                  setAgeMin(newMin);
                  setAgeMax(newMax);
                }}
              />
            </View>
          </StepContainer>
        )}

        {step === 'location' && (
          <StepContainer
            icon={<MapPin size={28} color={Colors.primary} />}
            title="Waar woon je?"
            subtitle="Dit gebruiken we voor lokale matchmaking. Je exacte adres wordt nooit gedeeld."
          >
            <TextInput
              style={styles.textInput}
              placeholder="Stad (bijv. Amsterdam)"
              placeholderTextColor={Colors.textTertiary}
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
            />
            <View style={{ height: 12 }} />
            <TextInput
              style={styles.textInput}
              placeholder="Postcode (bijv. 1011 AB)"
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
            title="Wat zijn jouw interesses?"
            subtitle="Kies er ten minste 3. Hiermee genereert onze AI jouw perfecte matches en date-ideeën."
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

        {step === 'bio' && (
          <StepContainer
            icon={<Sparkles size={28} color={Colors.primary} />}
            title="Schrijf je bio"
            subtitle="Vertel wat leuks over jezelf, of laat Gemini AI een pakkende bio voor je schrijven!"
          >
            <TextInput
              style={[styles.textInput, { height: 110, textAlignVertical: 'top' }]}
              placeholder="Schrijf hier je bio..."
              placeholderTextColor={Colors.textTertiary}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.aiBioBtn}
              onPress={handleGenerateAiBio}
              disabled={generatingAiBio}
            >
              {generatingAiBio ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Sparkles size={16} color={Colors.primary} />
                  <Text style={styles.aiBioBtnText}>
                    ✨ Herschrijf / Genereer met AI
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {aiBios.length > 0 && (
              <View style={{ marginTop: 16, gap: 10 }}>
                <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.textSecondary }}>
                  Kies een AI optie:
                </Text>
                {aiBios.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.aiCard}
                    onPress={() => setBio(item.bio)}
                  >
                    <Text style={styles.aiCardTitle}>
                      {item.title}
                    </Text>
                    <Text style={styles.aiCardText}>
                      {item.bio}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </StepContainer>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <View style={[styles.footer, isTablet && { maxWidth: 640, alignSelf: 'center', width: '100%' }]}>
        {stepIndex > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={back}>
            <Text style={styles.backButtonText}>Terug</Text>
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
                {stepIndex === STEPS.length - 1 ? 'Afronden' : 'Volgende'}
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
  tabletHeader: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
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
  sliderCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
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
  aiBioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  aiBioBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.primary },
  aiCard: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 14,
    padding: 12,
  },
  aiCardTitle: { fontFamily: 'Inter-Bold', fontSize: 12, color: Colors.primary, marginBottom: 4 },
  aiCardText: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.textPrimary },
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
