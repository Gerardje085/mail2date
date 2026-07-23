export interface Profile {
  id: string;
  first_name: string;
  age: number;
  city: string;
  postal_code: string;
  bio: string;
  photo_url: string;
  interests: string[];
  karma_score: number;
  is_premium: boolean;
  is_banned: boolean;
  match_age_min: number;
  match_age_max: number;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user_id: string;
  matched_user_id: string;
  match_date: string;
  compatibility_score: number;
  status: 'pending' | 'accepted' | 'passed';
  created_at: string;
  profile?: Profile;
}

export interface DateIdea {
  id: string;
  match_id: string;
  user_id: string;
  title: string;
  description: string;
  venue_name: string;
  venue_type: string;
  status: 'pending' | 'accepted' | 'saved' | 'passed';
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  photo_access_user1: boolean;
  photo_access_user2: boolean;
  last_message_at: string;
  created_at: string;
  other_profile?: Profile;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface DatePost {
  id: string;
  user_id: string;
  content: string;
  interest_tags: string[];
  date_type: string;
  location: string;
  created_at: string;
  profile?: Profile;
}

export interface DateCheckin {
  id: string;
  user_id: string;
  match_id: string | null;
  response_text: string;
  severity: 'safe' | 'medium' | 'high';
  created_at: string;
}
