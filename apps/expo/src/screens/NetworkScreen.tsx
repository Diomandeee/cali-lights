import React from 'react';
import { View, Text } from 'react-native';

export function NetworkScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-white text-xl font-bold mb-2">Network</Text>
      <Text className="text-muted text-center px-8">
        Explore the connections between chains based on visual similarity.
      </Text>
      <View className="mt-8 w-64 h-64 rounded-full border border-primary/30 items-center justify-center">
        <View className="w-32 h-32 rounded-full border border-primary/50 items-center justify-center">
          <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center">
            <Text className="text-primary text-xs">You</Text>
          </View>
        </View>
      </View>
      <Text className="text-muted text-sm mt-8">
        Network visualization coming soon
      </Text>
    </View>
  );
}
