// Core types for Cali Lights

export type Mode = "solo" | "party";

export type SessionState =
  | "lobby"
  | "round"
  | "unlock"
  | "recap"
  | "ended";

export type RoundType =
  | "tap-beat"
  | "salt-lime-sip"
  | "palette-pick"
  | "memory-fragments";

export interface User {
  id: string;
  nickname: string;
  instagram?: string;
  created_at: Date;
}

export interface Session {
  id: string;
  mode: Mode;
  state: SessionState;
  current_round?: number;
  host_id?: string;
  score: number;
  created_at: Date;
  ended_at?: Date;
}

export interface Participant {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: Date;
  is_host: boolean;
}

export interface Round {
  id: string;
  session_id: string;
  round_number: number;
  round_type: RoundType;
  duration: number;
  threshold?: number;
  started_at: Date;
  ended_at?: Date;
  score?: number;
}

export interface Action {
  id: string;
  round_id: string;
  user_id: string;
  action_type: string;
  data: any;
  timestamp: Date;
}

export interface Recap {
  id: string;
  session_id: string;
  palette?: string;
  toast?: string;
  playlist_url?: string;
  final_score: number;
  completion_time: number;
  created_at: Date;
}

// Solo Mode Types
export interface SoloLevel {
  id: number;
  slug: string;
  steps: SoloStep[];
  song?: string;
  mini_game?: string;
}

export interface SoloStep {
  text: string;
  duration?: number;
  animation?: string;
}

export interface SoloConfig {
  active_level: number;
  levels: SoloLevel[];
  birthday_unlock: {
    gate: string;
    message: string;
    cta?: {
      label: string;
      href: string;
    };
  };
}

// Party Mode Types
export interface PartyRound {
  type: RoundType;
  duration: number;
  threshold?: number;
}

export interface PartyConfig {
  rounds: PartyRound[];
  unlock: {
    condition: string;
    message: string;
    cta?: {
      label: string;
      href: string;
    };
  };
}

// Realtime Events
export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface LobbyState {
  participants: Array<{
    id: string;
    nickname: string;
    instagram?: string;
    is_host: boolean;
  }>;
  count: number;
}

export interface RoundState {
  round_number: number;
  round_type: RoundType;
  duration: number;
  time_remaining: number;
  score: number;
  threshold?: number;
}
