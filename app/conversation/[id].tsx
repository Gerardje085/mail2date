import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Send, Lock, Unlock, Sparkles, Shield, Phone, Heart } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Message, Profile, Conversation } from '@/lib/types';
import { SAMPLE_ICEBREAKERS, SAFETY_RESOURCES } from '@/lib/constants';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

export default function ConversationScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoGranted, setPhotoGranted] = useState(false);
  const [otherGranted, setOtherGranted] = useState(false);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadData = useCallback(async () => {
    if (!user || !conversationId) return;
    setLoading(true);

    const { data: convo } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (convo) {
      setConversation(convo as Conversation);
      const otherId = convo.user1_id === user.id ? convo.user2_id : convo.user1_id;
      const isUser1 = convo.user1_id === user.id;

      setPhotoGranted(isUser1 ? convo.photo_access_user1 : convo.photo_access_user2);
      setOtherGranted(isUser1 ? convo.photo_access_user2 : convo.photo_access_user1);

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherId)
        .maybeSingle();
      setOtherProfile(prof as Profile);

      // Generate icebreakers based on shared interests
      if (prof && user) {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        const shared = (myProfile as Profile)?.interests?.filter((i) =>
          (prof as Profile).interests.includes(i)
        ) || [];
        const interest = shared[0] || (prof as Profile).interests[0] || 'coffee';
        const generated = SAMPLE_ICEBREAKERS.map((t) => t.replace('{interest}', interest.toLowerCase()));
        setIcebreakers(generated);
      }
    }

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages((msgs as Message[]) || []);
    setLoading(false);
  }, [user, conversationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !conversationId) return;
    setSending(true);
    const content = input.trim();
    setInput('');

    const { data } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      })
      .select()
      .single();

    if (data) {
      setMessages((prev) => [...prev, data as Message]);
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    setSending(false);
  };

  const togglePhotoAccess = async () => {
    if (!user || !conversation) return;
    const isUser1 = conversation.user1_id === user.id;
    const newValue = !photoGranted;

    const updateField = isUser1
      ? { photo_access_user1: newValue }
      : { photo_access_user2: newValue };

    const { error } = await supabase
      .from('conversations')
      .update(updateField)
      .eq('id', conversation.id);

    if (!error) setPhotoGranted(newValue);
  };

  const useIcebreaker = (text: string) => {
    setInput(text);
    setShowIcebreakers(false);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            {photoGranted && otherGranted && otherProfile?.photo_url ? (
              <Image source={{ uri: otherProfile.photo_url }} style={styles.headerAvatarImage} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Lock size={14} color={Colors.textTertiary} />
              </View>
            )}
          </View>
          <View>
            <Text style={styles.headerName}>
              {otherProfile?.first_name || 'Unknown'}, {otherProfile?.age}
            </Text>
            <Text style={styles.headerStatus}>
              {photoGranted && otherGranted ? 'Photos unlocked' : 'Photos locked'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.safetyBtn} onPress={() => router.push('/safety')}>
          <Shield size={18} color={Colors.success} />
        </TouchableOpacity>
      </View>

      {/* Photo permission banner */}
      <PhotoPermissionBanner
        photoGranted={photoGranted}
        otherGranted={otherGranted}
        onToggle={togglePhotoAccess}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyMessagesText}>Say hello to start the conversation</Text>
            </View>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === user?.id}
              />
            ))
          )}
        </ScrollView>

        {/* Icebreaker section */}
        {showIcebreakers && (
          <View style={styles.icebreakerContainer}>
            <Text style={styles.icebreakerTitle}>AI Icebreakers</Text>
            <Text style={styles.icebreakerSubtitle}>
              Based on your shared interests
            </Text>
            {icebreakers.map((ib, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.icebreakerItem}
                onPress={() => useIcebreaker(ib)}
              >
                <Sparkles size={14} color={Colors.primary} />
                <Text style={styles.icebreakerItemText}>{ib}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.icebreakerBtn}
            onPress={() => setShowIcebreakers(!showIcebreakers)}
          >
            <Sparkles size={20} color={showIcebreakers ? Colors.primary : Colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textTertiary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.textInverse} />
            ) : (
              <Send size={18} color={Colors.textInverse} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function PhotoPermissionBanner({
  photoGranted,
  otherGranted,
  onToggle,
}: {
  photoGranted: boolean;
  otherGranted: boolean;
  onToggle: () => void;
}) {
  const bothGranted = photoGranted && otherGranted;
  return (
    <View style={[styles.photoBanner, bothGranted ? styles.photoBannerGranted : {}]}>
      <View style={styles.photoBannerLeft}>
        {bothGranted ? (
          <Unlock size={18} color={Colors.success} />
        ) : (
          <Lock size={18} color={Colors.warning} />
        )}
        <View>
          <Text style={styles.photoBannerTitle}>
            {bothGranted
              ? 'Photos unlocked'
              : photoGranted
              ? "Waiting for their permission"
              : 'Photos are private by default'}
          </Text>
          <Text style={styles.photoBannerSubtitle}>
            {bothGranted
              ? 'You can both see each other\'s photos now.'
              : photoGranted
              ? 'You\'ve granted access. They haven\'t yet.'
              : 'Both must grant access before photos are shared.'}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.photoToggleBtn,
          photoGranted ? styles.photoToggleBtnActive : {},
        ]}
        onPress={onToggle}
        activeOpacity={0.85}
      >
        <Text style={styles.photoToggleText}>
          {photoGranted ? 'Revoke' : 'Grant Access'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <View style={[styles.messageBubble, isOwn ? styles.messageOwn : styles.messageOther]}>
      <Text style={[styles.messageText, isOwn ? styles.messageOwnText : styles.messageOtherText]}>
        {message.content}
      </Text>
      <Text style={[styles.messageTime, isOwn ? styles.messageOwnTime : styles.messageOtherTime]}>
        {formatTime(message.created_at)}
      </Text>
    </View>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  headerAvatarImage: { width: '100%', height: '100%' },
  headerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.textPrimary },
  headerStatus: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.textTertiary },
  safetyBtn: { padding: 8 },
  photoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  photoBannerGranted: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  photoBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  photoBannerTitle: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textPrimary },
  photoBannerSubtitle: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.textSecondary },
  photoToggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  photoToggleBtnActive: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  photoToggleText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.textInverse },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyMessages: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyMessagesText: { fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.textTertiary },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 8,
  },
  messageOwn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceElevated,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageOwnText: { fontFamily: 'Inter-Regular', color: Colors.textInverse },
  messageOtherText: { fontFamily: 'Inter-Regular', color: Colors.textPrimary },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    marginTop: 4,
  },
  messageOwnTime: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  messageOtherTime: { color: Colors.textTertiary },
  icebreakerContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  icebreakerTitle: { fontFamily: 'Inter-Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 2 },
  icebreakerSubtitle: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.textTertiary, marginBottom: 12 },
  icebreakerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  icebreakerItemText: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.textSecondary },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 40,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  icebreakerBtn: { padding: 10 },
  inputWrap: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 80,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
