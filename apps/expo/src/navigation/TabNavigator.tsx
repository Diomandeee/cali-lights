import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import type { MainTabParamList, HomeStackParamList, GalleryStackParamList } from './types';
import { HomeScreen, GalleryScreen, NetworkScreen, ProfileScreen } from '../screens';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const GalleryStack = createNativeStackNavigator<GalleryStackParamList>();

// Tab Icons (simple text-based for now)
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '⌂',
    Gallery: '▦',
    Network: '◎',
    Profile: '◉',
  };

  return (
    <View className="items-center">
      <Text className={`text-xl ${focused ? 'text-primary' : 'text-muted'}`}>
        {icons[name] || '○'}
      </Text>
    </View>
  );
}

// Home Stack Navigator
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0F0F0F' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home', headerShown: false }}
      />
      {/* Add more screens as they're built */}
    </HomeStack.Navigator>
  );
}

// Gallery Stack Navigator
function GalleryStackNavigator() {
  return (
    <GalleryStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0F0F0F' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <GalleryStack.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{ title: 'Gallery', headerShown: false }}
      />
      {/* Add more screens as they're built */}
    </GalleryStack.Navigator>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F0F0F',
          borderTopColor: '#1A1A1A',
          paddingTop: 8,
          height: 80,
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="GalleryTab"
        component={GalleryStackNavigator}
        options={{
          title: 'Gallery',
          tabBarIcon: ({ focused }) => <TabIcon name="Gallery" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="NetworkTab"
        component={NetworkScreen}
        options={{
          title: 'Network',
          tabBarIcon: ({ focused }) => <TabIcon name="Network" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
