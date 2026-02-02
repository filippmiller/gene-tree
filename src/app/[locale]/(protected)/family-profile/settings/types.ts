export type UserProfile = {
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  maiden_name?: string | null;
  nickname?: string | null;
  gender: string;
  birth_date?: string | null;
  birth_place?: string | null;
  phone?: string | null;
  occupation?: string | null;
  bio?: string | null;
  // Presence settings
  show_online_status?: boolean;
  last_seen_at?: string | null;
};
