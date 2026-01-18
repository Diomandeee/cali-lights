import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function Loading({ message, fullScreen = true }: LoadingProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
        {message && (
          <Text className="text-muted mt-4">{message}</Text>
        )}
      </View>
    );
  }

  return (
    <View className="items-center justify-center p-4">
      <ActivityIndicator size="small" color="#8B5CF6" />
      {message && (
        <Text className="text-muted mt-2 text-sm">{message}</Text>
      )}
    </View>
  );
}
