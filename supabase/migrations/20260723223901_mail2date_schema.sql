
/*
# Mail2Date Complete Schema

## Overview
Full schema for the Mail2Date privacy-first dating application.

## Tables Created

### profiles
Stores user profile data. Linked 1-to-1 with auth.users.
- id: matches auth.users uuid
- first_name, age, city, postal_code: basic profile fields
- bio: optional short bio
- photo_url: profile photo (hidden by default in chat)
- interests: text array of interest tags
- karma_score: internal score (default 100), never shown to users
- is_premium: boolean for Mail2Date+ subscription
- is_banned: safety flag for offenders
- match_age_min / match_age_max: age preference range
- created_at / updated_at

### matches
Stores daily curated AI matches (one per user per day).
- id, user_id, matched_user_id
- match_date: the date this match was generated
- compatibility_score: 0-100
- status: pending / accepted / passed

### date_ideas
AI-generated date suggestions linked to a match.
- id, match_id, title, description, venue_name, venue_type
- status: saved / accepted / passed

### conversations
Chat threads between two matched users.
- id, user1_id, user2_id
- photo_access_user1 / photo_access_user2: boolean photo permission flags (default false)
- last_message_at, created_at

### messages
Individual chat messages.
- id, conversation_id, sender_id, content, created_at, is_read

### date_posts
Public activity feed posts (Tab 2 Ontdekken).
- id, user_id, content, interest_tags, date_type, location, created_at

### date_checkins
Post-date safety check-in responses.
- id, user_id, match_id, response_text, severity (safe/medium/high), created_at

### karma_events
Log of karma changes (invisible to users).
- id, user_id, delta (positive or negative integer), reason, created_at

## Security
- RLS enabled on all tables
- Authenticated-only access (app has full sign-in flow)
- Users can only read/write their own data
- Conversations: both participants can read
- Messages: both participants in the conversation can read/insert
- Public date_posts: all authenticated users can read
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  age integer NOT NULL DEFAULT 18,
  city text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  photo_url text DEFAULT '',
  interests text[] DEFAULT '{}',
  karma_score integer NOT NULL DEFAULT 100,
  is_premium boolean NOT NULL DEFAULT false,
  is_banned boolean NOT NULL DEFAULT false,
  match_age_min integer NOT NULL DEFAULT 18,
  match_age_max integer NOT NULL DEFAULT 40,
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Allow authenticated users to read other profiles for matching (excluding banned)
DROP POLICY IF EXISTS "read_other_profiles" ON profiles;
CREATE POLICY "read_other_profiles" ON profiles FOR SELECT
  TO authenticated USING (is_banned = false);

-- MATCHES
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_date date NOT NULL DEFAULT CURRENT_DATE,
  compatibility_score integer NOT NULL DEFAULT 75,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'passed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_matches" ON matches;
CREATE POLICY "select_own_matches" ON matches FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

DROP POLICY IF EXISTS "insert_own_matches" ON matches;
CREATE POLICY "insert_own_matches" ON matches FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_matches" ON matches;
CREATE POLICY "update_own_matches" ON matches FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_matches" ON matches;
CREATE POLICY "delete_own_matches" ON matches FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- DATE IDEAS
CREATE TABLE IF NOT EXISTS date_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  venue_name text NOT NULL DEFAULT '',
  venue_type text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'saved', 'passed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE date_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_date_ideas" ON date_ideas;
CREATE POLICY "select_own_date_ideas" ON date_ideas FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_date_ideas" ON date_ideas;
CREATE POLICY "insert_own_date_ideas" ON date_ideas FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_date_ideas" ON date_ideas;
CREATE POLICY "update_own_date_ideas" ON date_ideas FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_date_ideas" ON date_ideas;
CREATE POLICY "delete_own_date_ideas" ON date_ideas FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_access_user1 boolean NOT NULL DEFAULT false,
  photo_access_user2 boolean NOT NULL DEFAULT false,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_conversations" ON conversations;
CREATE POLICY "select_own_conversations" ON conversations FOR SELECT
  TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "insert_own_conversations" ON conversations;
CREATE POLICY "insert_own_conversations" ON conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user1_id);

DROP POLICY IF EXISTS "update_own_conversations" ON conversations;
CREATE POLICY "update_own_conversations" ON conversations FOR UPDATE
  TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "delete_own_conversations" ON conversations;
CREATE POLICY "delete_own_conversations" ON conversations FOR DELETE
  TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "update_own_messages" ON messages;
CREATE POLICY "update_own_messages" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = sender_id);

-- DATE POSTS (public activity feed)
CREATE TABLE IF NOT EXISTS date_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  interest_tags text[] DEFAULT '{}',
  date_type text NOT NULL DEFAULT 'casual',
  location text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE date_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_date_posts" ON date_posts;
CREATE POLICY "select_date_posts" ON date_posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_date_posts" ON date_posts;
CREATE POLICY "insert_own_date_posts" ON date_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_date_posts" ON date_posts;
CREATE POLICY "update_own_date_posts" ON date_posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_date_posts" ON date_posts;
CREATE POLICY "delete_own_date_posts" ON date_posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- DATE CHECK-INS (post-date safety)
CREATE TABLE IF NOT EXISTS date_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  response_text text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'safe' CHECK (severity IN ('safe', 'medium', 'high')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE date_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_checkins" ON date_checkins;
CREATE POLICY "select_own_checkins" ON date_checkins FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_checkins" ON date_checkins;
CREATE POLICY "insert_own_checkins" ON date_checkins FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_checkins" ON date_checkins;
CREATE POLICY "update_own_checkins" ON date_checkins FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_checkins" ON date_checkins;
CREATE POLICY "delete_own_checkins" ON date_checkins FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- KARMA EVENTS
CREATE TABLE IF NOT EXISTS karma_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE karma_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "no_user_select_karma" ON karma_events;
CREATE POLICY "no_user_select_karma" ON karma_events FOR SELECT
  TO authenticated USING (false);

DROP POLICY IF EXISTS "no_user_insert_karma" ON karma_events;
CREATE POLICY "no_user_insert_karma" ON karma_events FOR INSERT
  TO authenticated WITH CHECK (false);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_user_date ON matches(user_id, match_date);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_date_posts_created ON date_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);
