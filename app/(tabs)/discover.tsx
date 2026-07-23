import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Compass, Search, Lock, Crown, Plus, MapPin, X } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { DatePost, Profile } from '@/lib/types';
import { AppLogo } from '@/components/AppLogo';
import { DATE_TYPES } from '@/lib/constants';

const GRID_IMAGES = [
  'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/3777944/pexels-photo-3777944.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/3777945/pexels-photo-3777945.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/3777946/pexels-photo-3777946.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/3777947/pexels-photo-3777947.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/3777948/pexels-photo-3777948.jpeg?auto=compress&cs=tinysrgb&w=400',
];

export default function DiscoverScreen() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<DatePost[]>([]);
  const [gridProfiles, setGridProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostLocation, setNewPostLocation] = useState('');
  const [newPostType, setNewPostType] = useState('coffee');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: postData } = await supabase
      .from('date_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (postData) {
      const postsWithProfiles = await Promise.all(
        postData.map(async (post) => {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', post.user_id)
            .maybeSingle();
          return { ...post, profile: prof as Profile };
        })
      );
      setPosts(postsWithProfiles);
    }

    // Load potential matches for grid
    if (profile) {
      const { data: candidates } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('is_banned', false)
        .gte('age', profile.match_age_min)
        .lte('age', profile.match_age_max)
        .limit(12);
      setGridProfiles((candidates as Profile[]) || []);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user, profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredPosts = posts.filter((p) => {
    if (activeFilter !== 'all' && p.date_type !== activeFilter) return false;
    if (searchQuery && !p.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;
    await supabase.from('date_posts').insert({
      user_id: user.id,
      content: newPostContent.trim(),
      location: newPostLocation.trim(),
      date_type: newPostType,
      interest_tags: profile?.interests || [],
    });
    setNewPostContent('');
    setNewPostLocation('');
    setShowCreatePost(false);
    loadData();
  };

  if (loading) {
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.header}>
          <AppLogo size={36} showText={false} />
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreatePost(true)}
            activeOpacity={0.85}
          >
            <Plus size={20} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>

        <Text style={styles.pageTitle}>Ontdekken</Text>
        <Text style={styles.pageSubtitle}>Discover people and date ideas nearby</Text>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Search size={18} color={Colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts, interests, people..."
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          <FilterChip
            label="All"
            active={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
          {DATE_TYPES.map((dt) => (
            <FilterChip
              key={dt.id}
              label={dt.label}
              active={activeFilter === dt.id}
              onPress={() => setActiveFilter(dt.id)}
            />
          ))}
          {/* Premium locked filter */}
          <View style={[styles.filterChip, styles.filterChipLocked]}>
            <Lock size={12} color={Colors.accent} />
            <Text style={styles.filterChipLockedText}>Exact Radius</Text>
            <Crown size={12} color={Colors.accent} />
          </View>
        </ScrollView>

        {/* Activity Feed */}
        <Text style={styles.sectionTitle}>Activity Feed</Text>
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to post a date invitation in your area!
            </Text>
          </View>
        )}

        {/* AI Interest Grid */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionTitle}>People Near You</Text>
          <Text style={styles.gridSubtitle}>Sorted by AI affinity to your interests</Text>
          <View style={styles.grid}>
            {gridProfiles.map((p, idx) => (
              <GridCard key={p.id} profile={p} index={idx} />
            ))}
          </View>
        </View>

        {/* Premium teaser */}
        <TouchableOpacity style={styles.premiumTeaser} activeOpacity={0.85}>
          <LinearGradient
            colors={['rgba(255,184,48,0.15)', 'rgba(255,184,48,0.05)']}
            style={styles.premiumTeaserInner}
          >
            <Crown size={24} color={Colors.accent} />
            <Text style={styles.premiumTeaserTitle}>Unlock Mail2Date+</Text>
            <Text style={styles.premiumTeaserText}>
              Advanced AI filters, exact travel radius, and exclusive B2B vouchers.
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {showCreatePost && (
        <CreatePostModal
          content={newPostContent}
          location={newPostLocation}
          type={newPostType}
          onContentChange={setNewPostContent}
          onLocationChange={setNewPostLocation}
          onTypeChange={setNewPostType}
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </LinearGradient>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active ? styles.filterChipActive : {}]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[styles.filterChipText, active ? styles.filterChipTextActive : {}]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PostCard({ post }: { post: DatePost }) {
  const p = post.profile;
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>
            {p?.first_name?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.postName}>{p?.first_name || 'Anonymous'}, {p?.age}</Text>
          <View style={styles.postMeta}>
            <MapPin size={10} color={Colors.textTertiary} />
            <Text style={styles.postMetaText}>{post.location || p?.city || 'Unknown'}</Text>
            <Text style={styles.postDot}> • </Text>
            <Text style={styles.postMetaText}>{formatTime(post.created_at)}</Text>
          </View>
        </View>
        <View style={styles.postTypeBadge}>
          <Text style={styles.postTypeBadgeText}>{post.date_type}</Text>
        </View>
      </View>
      <Text style={styles.postContent}>{post.content}</Text>
      {post.interest_tags.length > 0 && (
        <View style={styles.postTags}>
          {post.interest_tags.slice(0, 4).map((tag) => (
            <View key={tag} style={styles.postTag}>
              <Text style={styles.postTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postActionBtn}>
          <Compass size={16} color={Colors.primary} />
          <Text style={styles.postActionText}>Connect</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GridCard({ profile, index }: { profile: Profile; index: number }) {
  const sharedCount = 0; // would compute from current user's interests
  return (
    <View style={styles.gridCard}>
      <Image
        source={{
          uri: profile.photo_url ||
            GRID_IMAGES[index % GRID_IMAGES.length],
        }}
        style={styles.gridCardImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gridCardOverlay}
      />
      <View style={styles.gridCardInfo}>
        <Text style={styles.gridCardName}>{profile.first_name}, {profile.age}</Text>
        <Text style={styles.gridCardCity}>{profile.city}</Text>
      </View>
      <View style={styles.gridCardScore}>
        <Text style={styles.gridCardScoreText}>{75 + (index % 20)}%</Text>
      </View>
    </View>
  );
}

function CreatePostModal({
  content,
  location,
  type,
  onContentChange,
  onLocationChange,
  onTypeChange,
  onClose,
  onSubmit,
}: {
  content: string;
  location: string;
  type: string;
  onContentChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create Date Invitation</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <X size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.modalInput}
          placeholder="What's your date idea? (e.g. 'Who wants to grab a flat white and check out the new exhibit this Saturday?')"
          placeholderTextColor={Colors.textTertiary}
          value={content}
          onChangeText={onContentChange}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <TextInput
          style={styles.modalInput}
          placeholder="Location (e.g. Amsterdam De Pijp)"
          placeholderTextColor={Colors.textTertiary}
          value={location}
          onChangeText={onLocationChange}
        />
        <Text style={styles.modalLabel}>Date Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {DATE_TYPES.map((dt) => (
            <TouchableOpacity
              key={dt.id}
              style={[styles.filterChip, type === dt.id ? styles.filterChipActive : {}]}
              onPress={() => onTypeChange(dt.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  type === dt.id ? styles.filterChipTextActive : {},
                ]}
              >
                {dt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.modalSubmitBtn} onPress={onSubmit} activeOpacity={0.85}>
          <Text style={styles.modalSubmitText}>Post Invitation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  searchRow: { marginBottom: 16 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: { marginRight: 12 },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    height: '100%',
  },
  filtersScroll: { marginBottom: 24 },
  filtersContent: { gap: 10, paddingRight: 20 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.textInverse, fontWeight: '600' },
  filterChipLocked: { borderColor: 'rgba(255,184,48,0.3)' },
  filterChipLockedText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.accent },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  postCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
    marginBottom: 14,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.textInverse },
  postName: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.textPrimary },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  postMetaText: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.textTertiary },
  postDot: { color: Colors.textTertiary, fontSize: 12 },
  postTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.glass,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  postTypeBadgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  postContent: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 12,
  },
  postTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  postTag: {
    backgroundColor: Colors.glass,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  postTagText: { fontFamily: 'Inter-Regular', fontSize: 11, color: Colors.textSecondary },
  postActions: { flexDirection: 'row', gap: 8 },
  postActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(232,33,58,0.1)',
    borderRadius: 12,
  },
  postActionText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  gridSection: { marginTop: 32 },
  gridSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textTertiary,
    marginBottom: 16,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: {
    width: '48%',
    flex: 1,
    minWidth: '48%',
    maxWidth: '48%',
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  gridCardImage: { width: '100%', height: '100%' },
  gridCardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
  gridCardInfo: { position: 'absolute', bottom: 12, left: 12 },
  gridCardName: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.textPrimary },
  gridCardCity: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.textSecondary },
  gridCardScore: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gridCardScoreText: { fontFamily: 'Inter-Bold', fontSize: 11, color: Colors.accent },
  premiumTeaser: { marginTop: 28 },
  premiumTeaserInner: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,184,48,0.2)',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  premiumTeaserTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.accent },
  premiumTeaserText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontFamily: 'Inter-Bold', fontSize: 20, color: Colors.textPrimary },
  modalCloseBtn: { padding: 4 },
  modalInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    minHeight: 52,
  },
  modalLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalSubmitText: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.textInverse },
});
