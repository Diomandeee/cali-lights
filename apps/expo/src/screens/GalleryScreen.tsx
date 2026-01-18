import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryClient';
import type { GalleryStackScreenProps } from '../navigation/types';
import type { Entry } from '../lib/types';
import { Loading } from '../components/Loading';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 16) / 3;

type ViewMode = 'grid' | 'chapters' | 'map' | 'calendar';

export function GalleryScreen({ navigation }: GalleryStackScreenProps<'Gallery'>) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.gallery(),
    queryFn: () => api.getGallery(),
  });

  const renderItem = ({ item }: { item: Entry }) => (
    <TouchableOpacity
      className="p-0.5"
      onPress={() => navigation.navigate('MediaDetail', { entryId: item.id })}
    >
      <Image
        source={{ uri: item.thumbnail_url || item.media_url }}
        className="rounded"
        style={{ width: ITEM_SIZE - 4, height: ITEM_SIZE - 4 }}
      />
    </TouchableOpacity>
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View className="flex-1 bg-background">
      {/* View Mode Tabs */}
      <View className="flex-row px-4 py-2 border-b border-surface">
        {(['grid', 'chapters', 'map', 'calendar'] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            className={`flex-1 py-2 items-center ${viewMode === mode ? 'border-b-2 border-primary' : ''}`}
            onPress={() => setViewMode(mode)}
          >
            <Text className={viewMode === mode ? 'text-primary font-semibold' : 'text-muted'}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {viewMode === 'grid' ? (
        <FlatList
          data={data?.items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={{ padding: 4 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">
            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view coming soon
          </Text>
        </View>
      )}
    </View>
  );
}
