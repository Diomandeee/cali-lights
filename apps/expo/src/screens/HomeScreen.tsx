import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryClient';
import type { HomeStackScreenProps } from '../navigation/types';
import { Loading } from '../components/Loading';

export function HomeScreen({ navigation }: HomeStackScreenProps<'Home'>) {
  const { data: chains, isLoading, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.chains,
    queryFn: () => api.getChains(),
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#8B5CF6" />
      }
    >
      <View className="p-4">
        <Text className="text-white text-2xl font-bold mb-6">Your Chains</Text>

        {chains?.length === 0 ? (
          <View className="bg-surface rounded-xl p-6 items-center">
            <Text className="text-muted text-center mb-4">
              You're not part of any chains yet.
            </Text>
            <TouchableOpacity className="bg-primary px-6 py-3 rounded-lg">
              <Text className="text-white font-semibold">Join a Chain</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-4">
            {chains?.map((chain) => (
              <TouchableOpacity
                key={chain.id}
                className="bg-surface rounded-xl p-4"
                onPress={() => navigation.navigate('ChainDetail', { chainId: chain.id })}
              >
                <Text className="text-white text-lg font-semibold">{chain.name}</Text>
                {chain.description && (
                  <Text className="text-muted mt-1">{chain.description}</Text>
                )}
                <Text className="text-muted text-sm mt-2">
                  {chain.member_count} member{chain.member_count !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
