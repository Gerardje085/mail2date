import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Heart, Bookmark, X, Clock, MapPin, Crown, Zap } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Match, DateIdea, Profile } from '@/lib/types';
import { AppLogo } from '@/components/AppLogo';
import { generateAIMatchAnalysis, generateAIDateIdeas } from '@/lib/ai';

const PLACEHOLDER_IMAGES = [
  'https://images.pexels.com/photos/3754323/pexels-photo-3754323.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/3754324/pexels-photo-3754324.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/3754325/pexels-photo-3754325.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/3754326/pexels-photo-3754326.jpeg?auto=compress&cs=tinysrgb&w=600',
];

export default function TodayScreen() {
  const { user, profile } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [dateIdeas, setDateIdeas] = useState<DateIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextMatchTime, setNextMatchTime] = useState<string>('');

  const generateMatch = useCallback(async () => {
    if (!user || !profile) return;
    setLoading(true);

    // Check if match already exists for today
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .eq('match_date', new Date().toISOString().split('T')[0])
      .maybeSingle();

    if (existingMatch) {
      // Fetch matched profile
      const { data: matchedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', existingMatch.matched_user_id)
        .maybeSingle();

      setMatch({
        ...existingMatch,
        profile: matchedProfile as Profile,
      } as Match);

      // Fetch date ideas for this match
      const { data: ideas } = await supabase
        .from('date_ideas')
        .select('*')
        .eq('match_id', existingMatch.id);
      setDateIdeas(ideas || []);
    } else {
      // Generate a new AI match - find a random compatible profile
      const { data: candidates } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('is_banned', false)
        .gte('age', profile.match_age_min)
        .lte('age', profile.match_age_max)
        .limit(20);

      if (candidates && candidates.length > 0) {
        // Pick a candidate and analyze compatibility with Gemini AI
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const candidate = candidates[randomIndex] as Profile;

        // Perform Gemini AI compatibility analysis
        const aiAnalysis = await generateAIMatchAnalysis(profile, candidate);

        const { data: newMatch } = await supabase
          .from('matches')
          .insert({
            user_id: user.id,
            matched_user_id: candidate.id,
            match_date: new Date().toISOString().split('T')[0],
            compatibility_score: aiAnalysis.compatibility_score,
          })
          .select()
          .single();

        if (newMatch) {
          setMatch({ ...newMatch, profile: candidate } as Match);

          // Generate Gemini AI date ideas tailored to city & interests
          const aiIdeas = await generateAIDateIdeas(newMatch.id, user.id, profile, candidate);
          const { data: insertedIdeas } = await supabase
            .from('date_ideas')
            .insert(aiIdeas)
            .select();
          setDateIdeas(insertedIdeas || []);
        }
      } else {
        setMatch(null);
      }
    }

    setLoading(false);
    setRefreshing(false);
    updateNextMatchTime();
  }, [user, profile]);

  const updateNextMatchTime = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setNextMatchTime(`${hours}u ${minutes}m`);
  };

  useEffect(() => {
    generateMatch();
    const interval = setInterval(updateNextMatchTime, 60000);
    return () => clearInterval(interval);
  }, [generateMatch]);

  const onRefresh = () => {
    setRefreshing(true);
    generateMatch();
  };

  const handleDateAction = async (ideaId: string, action: 'accepted' | 'saved' | 'passed') => {
    await supabase.from('date_ideas').update({ status: action }).eq('id', ideaId);
    setDateIdeas((prev) =>
      prev.map((d) => (d.id === ideaId ? { ...d, status: action } : d))
    );
  };

  const handleMatchAction = async (action: 'accepted' | 'passed') => {
    if (!match) return;
    await supabase.from('matches').update({ status: action }).eq('id', match.id);
    setMatch({ ...match, status: action });
  };

  if (loading) {
    return (
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Curating your match...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.header}>
          <AppLogo size={36} showText={false} />
          <View style={styles.timerContainer}>
            <Clock size={14} color={Colors.textTertiary} />
            <Text style={styles.timerText}>Next match in {nextMatchTime}</Text>
          </View>
        </View>

        <Text style={styles.pageTitle}>Vandaag</Text>
        <Text style={styles.pageSubtitle}>Your daily curated match</Text>

        {match?.profile ? (
          <MatchCard match={match} onAction={handleMatchAction} />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No match available today</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find a compatible match in your area. Try expanding your age range or
              check back tomorrow!
            </Text>
          </View>
        )}

        <View style={styles.dateIdeasSection}>
          <View style={styles.dateIdeasHeader}>
            <Text style={styles.sectionTitle}>Top 3 Date Ideas</Text>
            <View style={styles.premiumBadge}>
              <Crown size={12} color={Colors.accent} />
              <Text style={styles.premiumBadgeText}>Top 10 with Mail2Date+</Text>
            </View>
          </View>

          {dateIdeas.length > 0 ? (
            dateIdeas.map((idea, idx) => (
              <DateIdeaCard
                key={idea.id}
                idea={idea}
                index={idx}
                onAction={handleDateAction}
                imageUrl={PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length]}
              />
            ))
          ) : (
            <Text style={styles.noIdeasText}>No date ideas generated yet.</Text>
          )}
        </View>

        {profile?.is_premium && (
          <TouchableOpacity style={styles.resetButton} onPress={generateMatch}>
            <Zap size={18} color={Colors.textInverse} />
            <Text style={styles.resetButtonText}>Instant Match Reset</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function MatchCard({
  match,
  onAction,
}: {
  match: Match;
  onAction: (action: 'accepted' | 'passed') => void;
}) {
  const p = match.profile!;
  const sharedInterests = p.interests.slice(0, 4);

  return (
    <View style={styles.matchCard}>
      <LinearGradient
        colors={[Colors.surfaceElevated, Colors.surface]}
        style={styles.matchCardInner}
      >
        <View style={styles.matchPhotoContainer}>
          <Image
            source={{
              uri: p.photo_url ||
                'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&w=600',
            }}
            style={styles.matchPhoto}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.matchPhotoOverlay}
          />
          <View style={styles.matchInfo}>
            <Text style={styles.matchName}>{p.first_name}, {p.age}</Text>
            <View style={styles.matchLocation}>
              <MapPin size={12} color={Colors.textSecondary} />
              <Text style={styles.matchLocationText}>{p.city}</Text>
            </View>
          </View>
          <View style={styles.compatibilityBadge}>
            <Sparkles size={14} color={Colors.textInverse} />
            <Text style={styles.compatibilityText}>{match.compatibility_score}% match</Text>
          </View>
        </View>

        {p.bio ? <Text style={styles.matchBio}>{p.bio}</Text> : null}

        <View style={styles.interestRow}>
          {sharedInterests.map((tag) => (
            <View key={tag} style={styles.interestTag}>
              <Text style={styles.interestTagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {match.status === 'pending' ? (
          <View style={styles.matchActions}>
            <TouchableOpacity
              style={styles.passButton}
              onPress={() => onAction('passed')}
              activeOpacity={0.7}
            >
              <X size={22} color={Colors.textSecondary} />
              <Text style={styles.passButtonText}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => onAction('accepted')}
              activeOpacity={0.7}
            >
              <Heart size={22} color={Colors.textInverse} />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.matchStatusContainer}>
            <Text style={styles.matchStatusText}>
              {match.status === 'accepted' ? 'Match accepted! Check your chats.' : 'Passed — check back tomorrow.'}
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

function DateIdeaCard({
  idea,
  index,
  onAction,
  imageUrl,
}: {
  idea: DateIdea;
  index: number;
  onAction: (id: string, action: 'accepted' | 'saved' | 'passed') => void;
  imageUrl: string;
}) {
  return (
    <View style={styles.dateIdeaCard}>
      <Image source={{ uri: imageUrl }} style={styles.dateIdeaImage} resizeMode="cover" />
      <View style={styles.dateIdeaContent}>
        <View style={styles.dateIdeaHeader}>
          <View style={styles.dateIdeaNumber}>
            <Text style={styles.dateIdeaNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.dateIdeaVenue}>
            <MapPin size={12} color={Colors.textTertiary} />
            <Text style={styles.dateIdeaVenueText}>{idea.venue_name}</Text>
          </View>
        </View>
        <Text style={styles.dateIdeaTitle}>{idea.title}</Text>
        <Text style={styles.dateIdeaDescription}>{idea.description}</Text>

        {idea.status === 'pending' ? (
          <View style={styles.dateIdeaActions}>
            <TouchableOpacity
              style={styles.dateIdeaPassBtn}
              onPress={() => onAction(idea.id, 'passed')}
            >
              <X size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateIdeaSaveBtn}
              onPress={() => onAction(idea.id, 'saved')}
            >
              <Bookmark size={16} color={Colors.textSecondary} />
              <Text style={styles.dateIdeaSaveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateIdeaAcceptBtn}
              onPress={() => onAction(idea.id, 'accepted')}
            >
              <Heart size={16} color={Colors.textInverse} />
              <Text style={styles.dateIdeaAcceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.dateIdeaStatusText}>
            {idea.status === 'accepted' ? 'Accepted!' : idea.status === 'saved' ? 'Saved for later' : 'Passed'}
          </Text>
        )}
      </View>
    </View>
  );
}

function generateDateIdeas(
  matchId: string,
  userId: string,
  sharedInterests: string[],
  candidate: Profile
): Omit<DateIdea, 'id' | 'created_at'>[] {
  const ideas: Omit<DateIdea, 'id' | 'created_at'>[] = [];

  if (sharedInterests.includes('Specialty Coffee') || sharedInterests.includes('Craft Beer')) {
    ideas.push({
      match_id: matchId,
      user_id: userId,
      title: 'Coffee & Conversation',
      description: `Start with a flat white at a specialty coffee bar, then take a walk through the city. Perfect for getting to know each other.`,
      venue_name: 'Scandinavian Embassy',
      venue_type: 'coffee',
      status: 'pending',
    });
  }

  if (sharedInterests.includes('Indie Cinema') || sharedInterests.includes('Live Music')) {
    ideas.push({
      match_id: matchId,
      user_id: userId,
      title: 'Indie Film Night',
      description: `Catch the latest indie release at Pathé City, followed by drinks at a nearby bar to discuss the film.`,
      venue_name: 'Pathé City',
      venue_type: 'cinema',
      status: 'pending',
    });
  }

  if (sharedInterests.includes('Fine Dining') || sharedInterests.includes('Wine Tasting')) {
    ideas.push({
      match_id: matchId,
      user_id: userId,
      title: 'Dinner at De Kas',
      description: `Enjoy a farm-to-table dining experience at Restaurant De Kas, set in a historic greenhouse. A memorable first date.`,
      venue_name: 'Restaurant De Kas',
      venue_type: 'dinner',
      status: 'pending',
    });
  }

  // Fill with defaults if less than 3
  if (ideas.length < 3) {
    ideas.push({
      match_id: matchId,
      user_id: userId,
      title: 'Vondelpark Stroll',
      description: `A relaxed walk through Vondelpark with coffee in hand. Low pressure, great conversation.`,
      venue_name: 'Vondelpark',
      venue_type: 'walk',
      status: 'pending',
    });
  }
  if (ideas.length < 3) {
    ideas.push({
      match_id: matchId,
      user_id: userId,
      title: 'Museum Date',
      description: `Explore the Eye Filmmuseum and take the free ferry across the IJ. Culture and conversation.`,
      venue_name: 'Eye Filmmuseum',
      venue_type: 'museum',
      status: 'pending',
    });
  }

  return ideas.slice(0, 3);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.textSecondary },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.glass,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  timerText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.textTertiary },
  pageTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  matchCard: { marginBottom: 28 },
  matchCardInner: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  matchPhotoContainer: { position: 'relative', height: 320 },
  matchPhoto: { width: '100%', height: '100%' },
  matchPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  matchInfo: { position: 'absolute', bottom: 16, left: 20 },
  matchName: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  matchLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  matchLocationText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.textSecondary },
  compatibilityBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  compatibilityText: { fontFamily: 'Inter-Bold', fontSize: 13, color: Colors.textInverse },
  matchBio: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  interestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  interestTag: {
    backgroundColor: Colors.glass,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  interestTagText: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.textSecondary },
  matchActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  passButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  passButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.textSecondary },
  acceptButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  acceptButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.textInverse },
  matchStatusContainer: { padding: 20 },
  matchStatusText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  dateIdeasSection: { marginTop: 8 },
  dateIdeasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,184,48,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,184,48,0.2)',
  },
  premiumBadgeText: { fontFamily: 'Inter-Medium', fontSize: 11, color: Colors.accent },
  dateIdeaCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 14,
    overflow: 'hidden',
  },
  dateIdeaImage: { width: 100, height: '100%', minHeight: 140 },
  dateIdeaContent: { flex: 1, padding: 16 },
  dateIdeaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateIdeaNumber: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateIdeaNumberText: { fontFamily: 'Inter-Bold', fontSize: 12, color: Colors.textInverse },
  dateIdeaVenue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateIdeaVenueText: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.textTertiary },
  dateIdeaTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dateIdeaDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  dateIdeaActions: { flexDirection: 'row', gap: 8 },
  dateIdeaPassBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateIdeaSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  dateIdeaSaveText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.textSecondary },
  dateIdeaAcceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  dateIdeaAcceptText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.textInverse },
  dateIdeaStatusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.textTertiary,
  },
  noIdeasText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
  },
  resetButtonText: { fontFamily: 'Inter-Bold', fontSize: 15, color: Colors.textInverse },
});
