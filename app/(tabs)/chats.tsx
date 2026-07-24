import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, Lock, Shield } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Conversation, Message, Profile } from '@/lib/types';
import { AppLogo } from '@/components/AppLogo';
import { useRouter } from 'expo-router';

export default function ChatsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: convos } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (convos) {
      const convosWithProfiles = await Promise.all(
        convos.map(async (c) => {
          const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherId)
            .maybeSingle();

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...c,
            other_profile: prof as Profile,
            last_message: lastMsg as Message | undefined,
          };
        })
      );
      setConversations(convosWithProfiles);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.container}>
      <View style={[styles.header, isTablet && { maxWidth: 680, alignSelf: 'center', width: '100%' }]}>
        <AppLogo size={36} showText={false} />
        <View style={styles.privacyBadge}>
          <Shield size={14} color={Colors.success} />
          <Text style={styles.privacyBadgeText}>Privé</Text>
        </View>
      </View>

      <View style={[isTablet && { maxWidth: 680, alignSelf: 'center', width: '100%' }]}>
        <Text style={styles.pageTitle}>Chats</Text>
        <Text style={styles.pageSubtitle}>Jouw beveiligde gesprekken</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : conversations.length > 0 ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && { maxWidth: 680, alignSelf: 'center', width: '100%' },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {conversations.map((c) => (
            <ChatListItem
              key={c.id}
              conversation={c}
              currentUserId={user!.id}
              onPress={() =>
                router.push({
                  pathname: '/conversation/[id]',
                  params: { id: c.id },
                })
              }
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <MessageCircle size={32} color={Colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>Nog geen chats</Text>
          <Text style={styles.emptySubtitle}>
            Accepteer een match of reageer op iemand op Ontdekken om te beginnen met chatten.
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

function ChatListItem({
  conversation,
  currentUserId,
  onPress,
}: {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
}) {
  const p = conversation.other_profile;
  const lastMsg = conversation.last_message;
  const photoGranted =
    conversation.user1_id === currentUserId
      ? conversation.photo_access_user1
      : conversation.photo_access_user2;

  return (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        {photoGranted && p?.photo_url ? (
          <Image source={{ uri: p.photo_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Lock size={16} color={Colors.textTertiary} />
            <Text style={styles.avatarText}>{p?.first_name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeaderRow}>
          <Text style={styles.chatName}>{p?.first_name || 'Onbekend'}, {p?.age}</Text>
          <Text style={styles.chatTime}>
            {lastMsg ? formatTime(lastMsg.created_at) : ''}
          </Text>
        </View>
        <Text style={styles.chatPreview} numberOfLines={1}>
          {lastMsg?.content || 'Zeg hallo om het gesprek te starten'}
        </Text>
      </View>
      {lastMsg && !lastMsg.is_read && lastMsg.sender_id !== currentUserId && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'zojuist';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}u`;
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
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
  pageTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  avatarText: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.textSecondary },
  chatInfo: { flex: 1 },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.textPrimary },
  chatTime: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.textTertiary },
  chatPreview: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.textSecondary },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontFamily: 'Inter-Bold', fontSize: 20, color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
