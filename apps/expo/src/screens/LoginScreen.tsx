import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import type { AuthStackScreenProps } from '../navigation/types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await login(email, password);
    } catch {
      // Error handled by store
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center p-6">
        {/* Logo/Title */}
        <View className="items-center mb-12">
          <Text className="text-primary text-4xl font-bold">Cali Lights</Text>
          <Text className="text-muted mt-2">Capture moments together</Text>
        </View>

        {/* Error Message */}
        {error && (
          <View className="bg-red-500/20 rounded-lg p-3 mb-4">
            <Text className="text-red-400 text-center">{error}</Text>
          </View>
        )}

        {/* Form */}
        <View className="gap-4">
          <Input
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError();
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError();
            }}
            secureTextEntry
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            disabled={!email || !password}
          />
        </View>

        {/* Register Link */}
        <TouchableOpacity
          className="mt-6"
          onPress={() => navigation.navigate('Register')}
        >
          <Text className="text-muted text-center">
            Don't have an account?{' '}
            <Text className="text-primary font-semibold">Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
