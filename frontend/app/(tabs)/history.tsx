import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { Workout } from '../../src/types';
import { api } from '../../src/utils/api';

export default function HistoryScreen() {
  const { workouts, fetchWorkouts, deleteWorkout, loading } = useWorkoutStore();
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkouts();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWorkout(id),
        },
      ]
    );
  };

  const handleExport = async () => {
    try {
      const result = await api.exportCSV(90);
      Alert.alert(
        'Export Ready',
        `Your workout data has been prepared for export.\n\nFilename: ${result.filename}\n\nCSV Format:\nDate, Workout Type, Exercise, Body Part, Sets, Total Volume, Duration, Notes`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setImporting(true);

      // Read the file content
      const response = await fetch(result.assets[0].uri);
      const csvData = await response.text();

      // Call API to import
      const importResult = await api.importCSV(csvData);

      if (importResult.success) {
        let message = `Successfully imported workout data!\n\n`;
        message += `• Workouts created: ${importResult.workouts_created}\n`;
        message += `• Workouts merged: ${importResult.workouts_merged}\n`;
        message += `• Exercises imported: ${importResult.exercises_imported}`;
        
        if (importResult.errors.length > 0) {
          message += `\n\nWarnings:\n${importResult.errors.slice(0, 3).join('\n')}`;
          if (importResult.errors.length > 3) {
            message += `\n...and ${importResult.errors.length - 3} more`;
          }
        }

        Alert.alert('Import Complete', message, [
          {
            text: 'OK',
            onPress: () => fetchWorkouts(),
          },
        ]);
      } else {
        Alert.alert(
          'Import Failed',
          importResult.errors.join('\n') || 'Unknown error occurred'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to import data');
    } finally {
      setImporting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'strength':
        return '#FF6B6B';
      case 'cardio':
        return '#4ECDC4';
      case 'mobility':
        return '#45B7D1';
      case 'sports':
        return '#96CEB4';
      default:
        return '#FFEAA7';
    }
  };

  const getWorkoutTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'strength':
        return 'barbell-outline';
      case 'cardio':
        return 'heart-outline';
      case 'mobility':
        return 'body-outline';
      case 'sports':
        return 'football-outline';
      default:
        return 'fitness-outline';
    }
  };

  // Group workouts by date
  const groupedWorkouts = workouts.reduce((acc: { [key: string]: Workout[] }, workout) => {
    const dateKey = formatDate(workout.date);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(workout);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.importButton} 
            onPress={handleImport}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator size="small" color="#45B7D1" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#45B7D1" />
                <Text style={styles.importButtonText}>Import</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Ionicons name="download-outline" size={20} color="#4ECDC4" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4ECDC4"
          />
        }
      >
        {Object.keys(groupedWorkouts).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#333333" />
            <Text style={styles.emptyStateTitle}>No workouts yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start logging your workouts to see them here
            </Text>
          </View>
        ) : (
          Object.entries(groupedWorkouts).map(([date, dateWorkouts]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {dateWorkouts.map((workout) => (
                <View key={workout.id} style={styles.workoutCard}>
                  <View style={styles.workoutHeader}>
                    <View
                      style={[
                        styles.workoutTypeIndicator,
                        { backgroundColor: getWorkoutTypeColor(workout.workout_type) },
                      ]}
                    />
                    <View style={styles.workoutInfo}>
                      <View style={styles.workoutTitleRow}>
                        <Ionicons
                          name={getWorkoutTypeIcon(workout.workout_type)}
                          size={18}
                          color={getWorkoutTypeColor(workout.workout_type)}
                        />
                        <Text style={styles.workoutType}>
                          {workout.workout_type.charAt(0).toUpperCase() +
                            workout.workout_type.slice(1)}
                        </Text>
                      </View>
                      <Text style={styles.workoutTime}>
                        {format(parseISO(workout.date), 'h:mm a')}
                        {workout.duration ? ` • ${workout.duration} min` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(workout.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>

                  {/* Exercises */}
                  <View style={styles.exercisesList}>
                    {workout.exercises.map((exercise, index) => (
                      <View key={index} style={styles.exerciseItem}>
                        <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                        <Text style={styles.exerciseDetails}>
                          {exercise.sets.length} sets •{' '}
                          {exercise.sets.reduce((acc, set) => acc + set.weight * set.reps, 0).toLocaleString()}{' '}
                          kg
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Summary */}
                  <View style={styles.workoutSummary}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{workout.exercises.length}</Text>
                      <Text style={styles.summaryLabel}>Exercises</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}
                      </Text>
                      <Text style={styles.summaryLabel}>Sets</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {(workout.total_volume / 1000).toFixed(1)}k
                      </Text>
                      <Text style={styles.summaryLabel}>Volume (kg)</Text>
                    </View>
                  </View>

                  {workout.notes && (
                    <View style={styles.notesContainer}>
                      <Ionicons name="document-text-outline" size={14} color="#666666" />
                      <Text style={styles.notesText}>{workout.notes}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    minWidth: 90,
    justifyContent: 'center',
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#45B7D1',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  workoutCard: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutTypeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  workoutTime: {
    fontSize: 13,
    color: '#888888',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  exercisesList: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  exerciseName: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  exerciseDetails: {
    fontSize: 12,
    color: '#888888',
  },
  workoutSummary: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#333333',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  notesText: {
    fontSize: 13,
    color: '#888888',
    flex: 1,
  },
});
