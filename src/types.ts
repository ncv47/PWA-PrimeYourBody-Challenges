
export interface UserProfile {
  id: string; // UUID
  display_name: string | null;
  admin: boolean;
  avatar_url?: string;
}

export interface Challenge {
  id: number; // int8
  week: number;
  title: string;
  description: string;
  levels: string[];
  video_url: string | null;
  active: boolean;
  start_date: string;
  created_at: string;
  deadline?: string;
  deadline_date?: string;
}

export interface CheckIn {
  id: number; // int8
  user_id: string; // UUID
  challenge_id: number; // int8
  level: string;
  created_at: string;
}

export interface Post {
  id: number; // int8
  user_id: string; // UUID
  challenge_id?: number; // int8
  text: string;
  image_url: string | null;
  created_at: string;
  is_admin_post?: boolean;
}

export interface Badge {
  id: number; // int8
  user_id: string; // UUID
  badge_name: string;
  points: number;
  earned_at: string;
}
