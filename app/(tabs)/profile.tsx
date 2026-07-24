import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  useWindowDimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Settings,
  Trash2,
  LogOut,
  Sparkles,
  Shield,
  Heart,
  MapPin,
  Check,
  Crown,
  Bell,
  Lock,
  Edit3,
} from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { AppLogo } from '@/components/AppLogo';
import { AgeRangeSlider } from '@/components/AgeRangeSlider';
import { INTEREST_TAGS } from '@/lib/constants';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { user, profile, signOut, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(35);

  // Settings toggles
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [autoLockPhotos, setAutoLockPhotos] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setCity(profile.city || '');
      setPostalCode(profile.postal_code || '');
      setBio(profile.bio || '');
      setSelectedInterests(profile.interests || []);
      setAgeMin(profile.match_age_min || 18);
      setAgeMax(profile.match_age_max || 35);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setSaveMessage(null);

    const { error } = await supabase.from('profiles').update({
      first_name: firstName.trim(),
      city: city.trim(),
      postal_code: postalCode.trim(),
      bio: bio.trim(),
      interests: selectedInterests,
      match_age_min: ageMin,
      match_age_max: ageMax,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    setSaving(false);
    if (error) {
      Alert.alert('Fout bij opslaan', error.message);
    } else {
      await refreshProfile();
      setSaveMessage('Profiel & instellingen succesvol bijgewerkt!');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      'Profiel Definitief Verwijderen',
      'Weet je zeker dat je je profiel en al je gegevens definitief wilt verwijderen? Dit kan niet ongedaan worden gemaakt.',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Ja, Verwijder Definitief',
          style: 'destructive',
          onPress: confirmDeleteProfile,
        },
      ]
    );
  };

  const confirmDeleteProfile = async () => {
    if (!user) return;
    setDeleting(true);

    try {
      // Clean up user data from tables
      await supabase.from('date_checkins').delete().eq('user_id', user.id);
      await supabase.from('karma_events').delete().eq('user_id', user.id);
      await supabase.from('messages').delete().eq('sender_id', user.id);
      await supabase.from('conversations').delete().or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      await supabase.from('date_posts').delete().eq('user_id', user.id);
      await supabase.from('date_ideas').delete().eq('user_id', user.id);
      await supabase.from('matches').delete().or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`);
      await supabase.from('profiles').delete().eq('id', user.id);

      setDeleting(false);
      await signOut();
      router.replace('/auth/landing');
    } catch (e) {
      setDeleting(false);
      Alert.alert('Fout', 'Er is een fout opgetreden bij het verwijderen van je profiel.');
    }
  };

  if (!profile) {
    return (
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && { maxWidth: 680, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppLogo size={36} showText={false} />
          <View style={styles.badgeRow}>
            {profile.is_premium && (
              <View style={styles.premiumTag}>
                <Crown size={12} color={Colors.accent} />
                <Text style={styles.premiumTagText}>Plus Member</Text>
              </View>
            )}
            <View style={styles.karmaBadge}>
              <Sparkles size={12} color={Colors.primary} />
              <Text style={styles.karmaBadgeText}>{profile.karma_score || 100} Karma</Text>
            </View>
          </View>
        </View>

        {/* Profile User Summary Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              {profile.photo_url ? (
                <Image source={{ uri: profile.photo_url }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{profile.first_name?.[0]?.toUpperCase() || 'U'}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile.first_name}, {profile.age}</Text>
              <View style={styles.userLocation}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.userLocationText}>{profile.city || 'Nederland'}</Text>
              </View>
            </View>
          </View>

          {/* Sub Navigation Tabs */}
          <View style={styles.subTabRow}>
            <TouchableOpacity
              style={[styles.subTab, activeTab === 'profile' && styles.subTabActive]}
              onPress={() => setActiveTab('profile')}
            >
              <Edit3 size={16} color={activeTab === 'profile' ? Colors.textInverse : Colors.textSecondary} />
              <Text style={[styles.subTabText, activeTab === 'profile' && styles.subTabTextActive]}>
                Profiel Bewerken
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subTab, activeTab === 'settings' && styles.subTabActive]}
              onPress={() => setActiveTab('settings')}
            >
              <Settings size={16} color={activeTab === 'settings' ? Colors.textInverse : Colors.textSecondary} />
              <Text style={[styles.subTabText, activeTab === 'settings' && styles.subTabTextActive]}>
                Instellingen
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {saveMessage && (
          <View style={styles.saveMessageBanner}>
            <Check size={16} color={Colors.success} />
            <Text style={styles.saveMessageText}>{saveMessage}</Text>
          </View>
        )}

        {/* TAB 1: PROFIELE EDITING */}
        {activeTab === 'profile' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Persoonlijke Gegevens</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Voornaam</Text>
              <TextInput
                style={styles.textInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Voornaam"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.inputRowGroup}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Stad</Text>
                <TextInput
                  style={styles.textInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Stad"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Postcode</Text>
                <TextInput
                  style={styles.textInput}
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="Postcode"
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mijn Bio</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 100, textAlignVertical: 'top' }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Vertel wat leuks over jezelf..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={4}
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Mijn Interesses (Minimaal 3)</Text>
            <View style={styles.interestGrid}>
              {INTEREST_TAGS.map((tag) => {
                const selected = selectedInterests.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.interestPill, selected ? styles.interestPillActive : {}]}
                    onPress={() => toggleInterest(tag)}
                    activeOpacity={0.7}
                  >
                    {selected && <Check size={14} color={Colors.textInverse} />}
                    <Text style={[styles.interestPillText, selected ? styles.interestPillTextActive : {}]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={Colors.textInverse} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Profiel Wijzigingen Opslaan</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 2: INSTELLINGEN BEHEREN */}
        {activeTab === 'settings' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Match Voorkeuren</Text>

            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Gewenste Leeftijdsrange</Text>
              <Text style={styles.cardBoxSubtitle}>
                Verschuif de dubbele slider om de minimale en maximale leeftijd van je matches in te stellen.
              </Text>
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

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Meldingen & Privacy</Text>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingRowTitle}>Dagelijkse Match Meldingen</Text>
                <Text style={styles.settingRowSub}>Ontvang een melding zodra jouw dagelijkse match klaar staat</Text>
              </View>
              <Switch
                value={notifyMatches}
                onValueChange={setNotifyMatches}
                trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingRowTitle}>Chat Bericht Meldingen</Text>
                <Text style={styles.settingRowSub}>Ontvang een pushnotificatie bij nieuwe chatberichten</Text>
              </View>
              <Switch
                value={notifyMessages}
                onValueChange={setNotifyMessages}
                trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingRowTitle}>Foto-Toegang Standaard Privé</Text>
                <Text style={styles.settingRowSub}>Foto's blijven afgeschermd totdat beide personen toestemming geven</Text>
              </View>
              <Switch
                value={autoLockPhotos}
                onValueChange={setAutoLockPhotos}
                trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: 20 }, saving && styles.btnDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={Colors.textInverse} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Instellingen Opslaan</Text>
              )}
            </TouchableOpacity>

            {/* Account Actions & Danger Zone */}
            <Text style={[styles.sectionTitle, { marginTop: 36 }]}>Account & Beveiliging</Text>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={signOut}
              activeOpacity={0.85}
            >
              <LogOut size={18} color={Colors.textPrimary} />
              <Text style={styles.logoutBtnText}>Uitloggen uit Mail2Date</Text>
            </TouchableOpacity>

            <View style={styles.dangerZone}>
              <Text style={styles.dangerZoneTitle}>Gevarenzone</Text>
              <Text style={styles.dangerZoneText}>
                Wanneer je je profiel definitief verwijdert, worden al je berichten, matches en voorkeuren direct uit onze database gewist.
              </Text>
              <TouchableOpacity
                style={[styles.deleteBtn, deleting && styles.btnDisabled]}
                onPress={handleDeleteProfile}
                disabled={deleting}
                activeOpacity={0.85}
              >
                {deleting ? (
                  <ActivityIndicator color={Colors.textInverse} size="small" />
                ) : (
                  <>
                    <Trash2 size={18} color={Colors.textInverse} />
                    <Text style={styles.deleteBtnText}>Profiel Definitief Verwijderen</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
  },
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,184,48,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,184,48,0.3)',
  },
  premiumTagText: { fontFamily: 'Inter-Medium', fontSize: 11, color: Colors.accent },
  karmaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.glass,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  karmaBadgeText: { fontFamily: 'Inter-Medium', fontSize: 11, color: Colors.primary },
  userCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 20,
    marginBottom: 20,
  },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: { fontFamily: 'Inter-Bold', fontSize: 24, color: Colors.textInverse },
  userInfo: { flex: 1 },
  userName: { fontFamily: 'Inter-Bold', fontSize: 22, color: Colors.textPrimary, marginBottom: 4 },
  userLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userLocationText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.textSecondary },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  subTabActive: { backgroundColor: Colors.primary },
  subTabText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.textSecondary },
  subTabTextActive: { fontFamily: 'Inter-SemiBold', color: Colors.textInverse },
  saveMessageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    marginBottom: 20,
  },
  saveMessageText: { fontFamily: 'Inter-Medium', fontSize: 14, color: Colors.success },
  sectionContainer: { marginTop: 4 },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  inputGroup: { marginBottom: 14 },
  inputRowGroup: { flexDirection: 'row', gap: 12 },
  inputLabel: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  textInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  interestPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  interestPillText: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.textSecondary },
  interestPillTextActive: { color: Colors.textInverse, fontWeight: '600' },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.textInverse },
  btnDisabled: { opacity: 0.6 },
  cardBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 18,
    marginBottom: 16,
  },
  cardBoxTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 4 },
  cardBoxSubtitle: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.textSecondary, marginBottom: 14 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    gap: 12,
  },
  settingRowTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.textPrimary },
  settingRowSub: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingVertical: 16,
    marginBottom: 24,
  },
  logoutBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.textPrimary },
  dangerZone: {
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    padding: 20,
  },
  dangerZoneTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.error, marginBottom: 6 },
  dangerZoneText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.error,
    borderRadius: 14,
    paddingVertical: 14,
  },
  deleteBtnText: { fontFamily: 'Inter-Bold', fontSize: 15, color: Colors.textInverse },
});
