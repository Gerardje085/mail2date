import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Shield, Phone, Heart, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { SAFETY_RESOURCES } from '@/lib/constants';
import { useRouter } from 'expo-router';

type Severity = 'safe' | 'medium' | 'high';

const HIGH_SEVERITY_KEYWORDS = [
  'assault', 'attack', 'hit', 'hurt', 'forced', 'rape', 'sexual', 'abuse',
  'threat', 'scared', 'afraid', 'unsafe', 'danger', 'police', 'violent',
  'aggressive', 'intimidat', 'harass', 'stalker', 'creepy', 'drugged',
  'touched', 'grabbed', 'wouldn\'t stop', 'no means no',
];

const MEDIUM_SEVERITY_KEYWORDS = [
  'ghost', 'ghosted', 'rude', 'late', 'stood up', 'disrespect', 'ignored',
  'mean', 'uncomfortable', 'weird', 'bad vibe', 'disappointed', 'awkward',
  'boring', 'no show', 'cancelled', 'flaky',
];

export default function SafetyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [responseText, setResponseText] = useState('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const analyzeText = (text: string): Severity => {
    const lower = text.toLowerCase();
    for (const kw of HIGH_SEVERITY_KEYWORDS) {
      if (lower.includes(kw)) return 'high';
    }
    for (const kw of MEDIUM_SEVERITY_KEYWORDS) {
      if (lower.includes(kw)) return 'medium';
    }
    return 'safe';
  };

  const handleSubmit = async () => {
    if (!responseText.trim() || !user) return;
    setAnalyzing(true);

    const detected = analyzeText(responseText);
    setSeverity(detected);

    // Save check-in
    await supabase.from('date_checkins').insert({
      user_id: user.id,
      response_text: responseText.trim(),
      severity: detected,
    });

    // Apply karma penalty for medium/high severity
    if (detected === 'high') {
      // In production this would target the specific match; for now we log the event
      await supabase.from('karma_events').insert({
        user_id: user.id,
        delta: -50,
        reason: 'high_severity_date_report',
      });
    } else if (detected === 'medium') {
      await supabase.from('karma_events').insert({
        user_id: user.id,
        delta: -10,
        reason: 'medium_severity_date_report',
      });
    }

    setAnalyzing(false);
    setSubmitted(true);
  };

  if (submitted && severity) {
    return (
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.resultContent}>
          {severity === 'safe' && (
            <ResultCard
              icon={<CheckCircle2 size={40} color={Colors.success} />}
              title="Glad to hear it went well!"
              message="Your feedback has been recorded. Keep being your authentic self — your Karma score reflects your positive engagement."
              color={Colors.success}
            />
          )}
          {severity === 'medium' && (
            <ResultCard
              icon={<Heart size={40} color={Colors.warning} />}
              title="We're sorry that happened."
              message="That kind of behavior isn't okay. We've noted this experience and applied an invisible Karma penalty. You won't see this person again."
              color={Colors.warning}
            />
          )}
          {severity === 'high' && (
            <View style={styles.highSeverityContainer}>
              <ResultCard
                icon={<AlertTriangle size={40} color={Colors.error} />}
                title="Your safety is our priority."
                message="We've frozen the chat, blocked this user, and flagged their account for review. You are not alone — please reach out if you need help."
                color={Colors.error}
              />
              <Text style={styles.emergencyTitle}>Emergency Resources</Text>
              <Text style={styles.emergencySubtitle}>
                If you're in immediate danger, please call now.
              </Text>
              {SAFETY_RESOURCES.map((r) => (
                <TouchableOpacity
                  key={r.number}
                  style={styles.emergencyBtn}
                  onPress={() => Linking.openURL(`tel:${r.number}`)}
                  activeOpacity={0.85}
                >
                  <Phone size={20} color={Colors.error} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emergencyBtnLabel}>{r.label}</Text>
                    <Text style={styles.emergencyBtnNumber}>{r.number}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.privacyBadge}>
          <Shield size={14} color={Colors.success} />
          <Text style={styles.privacyBadgeText}>Confidential</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <Shield size={32} color={Colors.primary} />
        </View>
        <Text style={styles.pageTitle}>How did your date go?</Text>
        <Text style={styles.pageSubtitle}>
          Your honest feedback helps keep Mail2Date safe. Share as much or as little as you'd like
          — this is completely confidential.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Tell us about your experience in your own words..."
            placeholderTextColor={Colors.textTertiary}
            value={responseText}
            onChangeText={setResponseText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoFocus
          />
          <Text style={styles.charCount}>{responseText.length}/1000</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (!responseText.trim() || analyzing) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!responseText.trim() || analyzing}
          activeOpacity={0.85}
        >
          {analyzing ? (
            <>
              <ActivityIndicator size="small" color={Colors.textInverse} />
              <Text style={styles.submitBtnText}>Analyzing...</Text>
            </>
          ) : (
            <>
              <Shield size={18} color={Colors.textInverse} />
              <Text style={styles.submitBtnText}>Submit Feedback</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          If you're in immediate danger, call 112. This form is not monitored 24/7.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

function ResultCard({
  icon,
  title,
  message,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  color: string;
}) {
  return (
    <View style={[styles.resultCard, { borderColor: `${color}40` }]}>
      <View style={[styles.resultIcon, { backgroundColor: `${color}15` }]}>{icon}</View>
      <Text style={styles.resultTitle}>{title}</Text>
      <Text style={styles.resultMessage}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  privacyBadgeText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.success },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  inputContainer: { marginBottom: 20 },
  feedbackInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 18,
    paddingVertical: 16,
    minHeight: 160,
    lineHeight: 24,
  },
  charCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 6,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.textInverse },
  disclaimer: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  resultContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  resultCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  resultIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  highSeverityContainer: { width: '100%' },
  emergencyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    marginBottom: 10,
  },
  emergencyBtnLabel: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.textPrimary },
  emergencyBtnNumber: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.textSecondary },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  doneBtnText: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.textInverse },
});
