import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys for consistency
export const queryKeys = {
  user: ['user'] as const,
  chains: ['chains'] as const,
  chain: (id: string) => ['chain', id] as const,
  missions: (chainId: string) => ['missions', chainId] as const,
  mission: (id: string) => ['mission', id] as const,
  activeMission: (chainId: string) => ['activeMission', chainId] as const,
  entries: (missionId: string) => ['entries', missionId] as const,
  chapters: (chainId: string) => ['chapters', chainId] as const,
  chapter: (id: string) => ['chapter', id] as const,
  gallery: (filters?: Record<string, unknown>) => ['gallery', filters] as const,
};
