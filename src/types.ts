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

export interface CheckIn {
  id: number;
  user_id: string;
  challenge_id: number;
  level: string;
  created_at: string;
}

export interface ChallengeComment {
  id: number;        // Matches your data: "id": 1
  challenge_id: number;  // Matches your data: "challenge_id": 14  
  user_id: string;
  text: string | null;
  proof_url: string | null;
  visibility: 'public' | 'coach';
  parent_id: string | null;  // Added from your data
  created_at: string;
  updated_at: string;
  // Array of users from Supabase join - matches your query structure
  users: User[];
}

// Convenience type for challenges with joined data
export interface ChallengeWithData extends Challenge {
  checkins: CheckIn[];
  my_comments: ChallengeComment[];
}
