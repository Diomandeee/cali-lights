import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useAuthStore } from '../store/authStore';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View className="flex-1 bg-background p-4">
      {/* Profile Header */}
      <View className="items-center py-8">
        {user?.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            className="w-24 h-24 rounded-full"
          />
        ) : (
          <View className="w-24 h-24 rounded-full bg-primary items-center justify-center">
            <Text className="text-white text-3xl font-bold">
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <Text className="text-white text-xl font-bold mt-4">
          {user?.username || 'Unknown'}
        </Text>
        <Text className="text-muted">{user?.email || ''}</Text>
      </View>

      {/* Menu Items */}
      <View className="bg-surface rounded-xl overflow-hidden">
        <TouchableOpacity className="flex-row items-center p-4 border-b border-background">
          <Text className="text-white flex-1">Edit Profile</Text>
          <Text className="text-muted">›</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center p-4 border-b border-background">
          <Text className="text-white flex-1">Notifications</Text>
          <Text className="text-muted">›</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center p-4 border-b border-background">
          <Text className="text-white flex-1">Privacy</Text>
          <Text className="text-muted">›</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center p-4">
          <Text className="text-white flex-1">About</Text>
          <Text className="text-muted">›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        className="bg-red-500/20 rounded-xl p-4 mt-6"
        onPress={handleLogout}
      >
        <Text className="text-red-500 text-center font-semibold">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
