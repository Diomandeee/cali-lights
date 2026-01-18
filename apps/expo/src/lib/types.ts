// Core Types - Mirrored from Web App

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface Chain {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  member_count: number;
}

export interface ChainMember {
  id: string;
  chain_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export type MissionState = 'LOBBY' | 'CAPTURE' | 'FUSING' | 'RECAP' | 'ARCHIVED';

export interface Mission {
  id: string;
  chain_id: string;
  prompt: string;
  state: MissionState;
  started_at?: string;
  ends_at?: string;
  created_at: string;
}

export interface Entry {
  id: string;
  mission_id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  caption?: string;
  metadata?: EntryMetadata;
  created_at: string;
}

export interface EntryMetadata {
  dominant_hue?: number;
  palette?: string[];
  tags?: string[];
  scenes?: string[];
  motion_score?: number;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface Chapter {
  id: string;
  mission_id: string;
  video_url?: string;
  thumbnail_url?: string;
  palette: string[];
  entry_count: number;
  created_at: string;
}

export interface Invite {
  id: string;
  chain_id: string;
  token: string;
  created_by: string;
  expires_at: string;
  max_uses?: number;
  uses: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Gallery Filter Types
export interface GalleryFilters {
  hue?: number;
  hueTolerance?: number;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
}
