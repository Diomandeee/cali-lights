import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import type { AuthStackScreenProps } from '../navigation/types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function RegisterScreen({ navigation }: AuthStackScreenProps<'Register'>) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !password || !username) return;
    if (password !== confirmPassword) {
      // Handle password mismatch
      return;
    }
    try {
      await register(email, password, username);
    } catch {
      // Error handled by store
    }
  };

  const isValid = email && username && password && password === confirmPassword;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center p-6">
        {/* Title */}
        <View className="items-center mb-12">
          <Text className="text-white text-2xl font-bold">Create Account</Text>
          <Text className="text-muted mt-2">Join Cali Lights</Text>
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
            placeholder="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              clearError();
            }}
            autoCapitalize="none"
          />

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

          <Input
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {password && confirmPassword && password !== confirmPassword && (
            <Text className="text-red-400 text-sm">Passwords don't match</Text>
          )}

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            disabled={!isValid}
          />
        </View>

        {/* Login Link */}
        <TouchableOpacity
          className="mt-6"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-muted text-center">
            Already have an account?{' '}
            <Text className="text-primary font-semibold">Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
