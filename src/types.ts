export interface User {
  id: string;
  display_name: string | null;
  admin: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  admin: boolean;
  avatar_url?: string;
}

export interface Challenge {
  id: number;
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

/**
 * Old name kept for compatibility with existing code.
 * Your DB table is now challenge_completions.
 */
export interface CheckIn {
  id: number;
  user_id: string;
  challenge_id: number;
  level: string;
  created_at: string;
  completed_at?: string;
}

/**
 * New explicit type (preferred going forward).
 */
export interface ChallengeCompletion {
  id: number;
  user_id: string;
  challenge_id: number;
  level: string;
  created_at: string;
  completed_at: string;
}

export interface Badge {
  id: number;
  user_id: string;
  badge_key: string; // e.g. monthly_2026_02, lifetime_10
  earned_at: string;
  // keep old column for compatibility if any UI still reads it
  badge_name?: string | null;
}

export interface ChallengeComment {
  id: number;
  challenge_id: number;
  user_id: string;
  text: string | null;
  proof_url: string | null;
  visibility: 'public' | 'coach';
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  users: User[];
}

// Convenience type for challenges with joined data
export interface ChallengeWithData extends Challenge {
  checkins: CheckIn[];
  my_comments: ChallengeComment[];
}
