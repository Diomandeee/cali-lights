import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <View className="w-full">
        {label && (
          <Text className="text-white text-sm font-medium mb-2">{label}</Text>
        )}
        <TextInput
          ref={ref}
          className={`bg-surface text-white px-4 py-3 rounded-lg border ${
            error ? 'border-red-500' : 'border-transparent'
          } ${className}`}
          placeholderTextColor="#6B7280"
          {...props}
        />
        {error && (
          <Text className="text-red-500 text-sm mt-1">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
