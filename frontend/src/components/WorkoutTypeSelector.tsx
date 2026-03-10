import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WORKOUT_TYPES = [
  { id: 'strength', label: 'Strength', icon: 'barbell-outline' as const, color: '#FF6B6B' },
  { id: 'cardio', label: 'Cardio', icon: 'heart-outline' as const, color: '#4ECDC4' },
  { id: 'mobility', label: 'Mobility', icon: 'body-outline' as const, color: '#45B7D1' },
  { id: 'sports', label: 'Sports', icon: 'football-outline' as const, color: '#96CEB4' },
  { id: 'custom', label: 'Custom', icon: 'add-circle-outline' as const, color: '#FFEAA7' },
];

interface WorkoutTypeSelectorProps {
  selected: string;
  onSelect: (type: string) => void;
}

export const WorkoutTypeSelector: React.FC<WorkoutTypeSelectorProps> = ({
  selected,
  onSelect,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {WORKOUT_TYPES.map((type) => (
        <TouchableOpacity
          key={type.id}
          style={[
            styles.typeButton,
            selected === type.id && { backgroundColor: type.color + '30', borderColor: type.color },
          ]}
          onPress={() => onSelect(type.id)}
        >
          <Ionicons
            name={type.icon}
            size={24}
            color={selected === type.id ? type.color : '#888888'}
          />
          <Text
            style={[
              styles.typeLabel,
              selected === type.id && { color: type.color },
            ]}
          >
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  typeButton: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 90,
  },
  typeLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
});
