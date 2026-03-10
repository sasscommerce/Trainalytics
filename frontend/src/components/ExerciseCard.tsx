import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutExercise } from '../types';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onEdit?: () => void;
  onRemove?: () => void;
  showActions?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onEdit,
  onRemove,
  showActions = true,
}) => {
  const totalVolume = exercise.sets.reduce(
    (acc, set) => acc + set.weight * set.reps,
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{exercise.exercise_name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{exercise.body_part}</Text>
          </View>
        </View>
        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                <Ionicons name="pencil" size={18} color="#4ECDC4" />
              </TouchableOpacity>
            )}
            {onRemove && (
              <TouchableOpacity onPress={onRemove} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.setsContainer}>
        <View style={styles.setsHeader}>
          <Text style={styles.setHeaderText}>Set</Text>
          <Text style={styles.setHeaderText}>Weight</Text>
          <Text style={styles.setHeaderText}>Reps</Text>
          <Text style={styles.setHeaderText}>RPE</Text>
        </View>
        {exercise.sets.map((set, index) => (
          <View key={index} style={styles.setRow}>
            <Text style={styles.setText}>{set.set_number}</Text>
            <Text style={styles.setText}>{set.weight} kg</Text>
            <Text style={styles.setText}>{set.reps}</Text>
            <Text style={styles.setText}>{set.rpe || '-'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Total Volume</Text>
          <Text style={styles.footerValue}>{totalVolume.toLocaleString()} kg</Text>
        </View>
        {exercise.estimated_1rm && (
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Est. 1RM</Text>
            <Text style={styles.footerValue}>{exercise.estimated_1rm} kg</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#4ECDC420',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  setsContainer: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  setHeaderText: {
    flex: 1,
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    fontWeight: '600',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  setText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  footerItem: {
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 11,
    color: '#888888',
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
});
