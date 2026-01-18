import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { ApiResponse, AuthResponse, User, Chain, Mission, Entry, Chapter, PaginatedResponse, GalleryFilters } from './types';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://cali-lights.vercel.app/api';

const TOKEN_KEY = 'auth_token';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add auth token to requests
    this.client.interceptors.request.use(async (config) => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired - clear and redirect to login
          SecureStore.deleteItemAsync(TOKEN_KEY);
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
    if (data.data?.token) {
      await SecureStore.setItemAsync(TOKEN_KEY, data.data.token);
    }
    return data.data!;
  }

  async register(email: string, password: string, username: string): Promise<AuthResponse> {
    const { data } = await this.client.post<ApiResponse<AuthResponse>>('/auth/register', { email, password, username });
    if (data.data?.token) {
      await SecureStore.setItemAsync(TOKEN_KEY, data.data.token);
    }
    return data.data!;
  }

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }

  async getMe(): Promise<User> {
    const { data } = await this.client.get<ApiResponse<User>>('/auth/me');
    return data.data!;
  }

  // Chains
  async getChains(): Promise<Chain[]> {
    const { data } = await this.client.get<ApiResponse<Chain[]>>('/chain');
    return data.data || [];
  }

  async getChain(id: string): Promise<Chain> {
    const { data } = await this.client.get<ApiResponse<Chain>>(`/chain/${id}`);
    return data.data!;
  }

  async createChain(name: string, description?: string): Promise<Chain> {
    const { data } = await this.client.post<ApiResponse<Chain>>('/chain', { name, description });
    return data.data!;
  }

  async joinChain(token: string): Promise<Chain> {
    const { data } = await this.client.post<ApiResponse<Chain>>('/invite/accept', { token });
    return data.data!;
  }

  // Missions
  async getMissions(chainId: string): Promise<Mission[]> {
    const { data } = await this.client.get<ApiResponse<Mission[]>>(`/mission?chainId=${chainId}`);
    return data.data || [];
  }

  async getActiveMission(chainId: string): Promise<Mission | null> {
    const { data } = await this.client.get<ApiResponse<Mission>>(`/mission/active?chainId=${chainId}`);
    return data.data || null;
  }

  async getMission(id: string): Promise<Mission> {
    const { data } = await this.client.get<ApiResponse<Mission>>(`/mission/${id}`);
    return data.data!;
  }

  // Entries
  async getEntries(missionId: string): Promise<Entry[]> {
    const { data } = await this.client.get<ApiResponse<Entry[]>>(`/entry?missionId=${missionId}`);
    return data.data || [];
  }

  async submitEntry(missionId: string, mediaUrl: string, mediaType: 'image' | 'video', caption?: string): Promise<Entry> {
    const { data } = await this.client.post<ApiResponse<Entry>>('/entry', {
      missionId,
      mediaUrl,
      mediaType,
      caption,
    });
    return data.data!;
  }

  // Chapters
  async getChapters(chainId: string): Promise<Chapter[]> {
    const { data } = await this.client.get<ApiResponse<Chapter[]>>(`/chapter?chainId=${chainId}`);
    return data.data || [];
  }

  async getChapter(id: string): Promise<Chapter> {
    const { data } = await this.client.get<ApiResponse<Chapter>>(`/chapter/${id}`);
    return data.data!;
  }

  // Gallery
  async getGallery(filters?: GalleryFilters): Promise<PaginatedResponse<Entry>> {
    const params = new URLSearchParams();
    if (filters?.hue) params.append('hue', filters.hue.toString());
    if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
    if (filters?.dateFrom) params.append('from', filters.dateFrom);
    if (filters?.dateTo) params.append('to', filters.dateTo);

    const { data } = await this.client.get<ApiResponse<PaginatedResponse<Entry>>>(`/gallery?${params}`);
    return data.data!;
  }

  // Health check
  async health(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  // Get upload signature for Cloudinary
  async getUploadSignature(): Promise<{ signature: string; timestamp: number; cloudName: string; uploadPreset: string }> {
    const { data } = await this.client.get('/cloudinary/signature');
    return data.data!;
  }
}

export const api = new ApiClient();
export default api;
