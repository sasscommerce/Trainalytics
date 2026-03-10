import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { WorkoutTypeSelector } from '../../src/components/WorkoutTypeSelector';
import { ExerciseCard } from '../../src/components/ExerciseCard';
import { ExerciseSet, WorkoutExercise, ExerciseTemplate } from '../../src/types';
import { api } from '../../src/utils/api';

const BODY_PARTS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'];
const WORKOUT_TYPES = ['strength', 'cardio', 'mobility', 'sports', 'custom'];

export default function LogScreen() {
  const router = useRouter();
  const {
    currentWorkout,
    setWorkoutType,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    updateExerciseInWorkout,
    setWorkoutNotes,
    setWorkoutDuration,
    createWorkout,
    resetCurrentWorkout,
    exercises,
    bodyParts,
    fetchExercises,
    fetchBodyParts,
    loading,
    setWorkoutDate,
  } = useWorkoutStore();

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showSetModal, setShowSetModal] = useState(false);
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseTemplate | null>(null);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  
  // Date state
  const [workoutDate, setLocalWorkoutDate] = useState(new Date());
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExercises, setFilteredExercises] = useState<ExerciseTemplate[]>([]);

  // Custom exercise form state
  const [customExercise, setCustomExercise] = useState({
    name: '',
    body_part: 'Chest',
    muscle_group: '',
    workout_type: 'strength',
  });
  const [creatingExercise, setCreatingExercise] = useState(false);

  // Set form states
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [currentSet, setCurrentSet] = useState<ExerciseSet>({
    set_number: 1,
    reps: 10,
    weight: 0,
    rpe: undefined,
  });
  const [exerciseNotes, setExerciseNotes] = useState('');

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      // Only allow past dates (up to today)
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate <= today) {
        setLocalWorkoutDate(selectedDate);
        setWorkoutDate(selectedDate);
      } else {
        Alert.alert('Invalid Date', 'You can only log workouts for past dates');
      }
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  useEffect(() => {
    fetchBodyParts();
    fetchExercises();
  }, []);

  // Filter exercises based on search and body part
  useEffect(() => {
    let result = exercises;
    
    if (selectedBodyPart) {
      result = result.filter((e) => e.body_part === selectedBodyPart);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((e) => 
        e.name.toLowerCase().includes(query) ||
        e.muscle_group.toLowerCase().includes(query)
      );
    }
    
    setFilteredExercises(result);
  }, [exercises, selectedBodyPart, searchQuery]);

  // Search exercises from API with debounce
  useEffect(() => {
    const searchFromApi = async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const results = await api.getExercises(
            selectedBodyPart || undefined,
            undefined,
            searchQuery
          );
          setFilteredExercises(results);
        } catch (e) {
          console.log('Search error:', e);
        }
      }
    };

    const timeoutId = setTimeout(searchFromApi, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedBodyPart]);

  const handleSelectExercise = (exercise: ExerciseTemplate) => {
    setSelectedExercise(exercise);
    setSets([]);
    setCurrentSet({
      set_number: 1,
      reps: 10,
      weight: 0,
      rpe: undefined,
    });
    setExerciseNotes('');
    setShowExerciseModal(false);
    setShowSetModal(true);
    setSearchQuery('');
  };

  const handleAddSet = () => {
    setSets([...sets, { ...currentSet, set_number: sets.length + 1 }]);
    setCurrentSet({
      set_number: sets.length + 2,
      reps: currentSet.reps,
      weight: currentSet.weight,
      rpe: undefined,
    });
  };

  const handleRemoveSet = (index: number) => {
    const newSets = sets.filter((_, i) => i !== index).map((s, i) => ({
      ...s,
      set_number: i + 1,
    }));
    setSets(newSets);
    setCurrentSet({ ...currentSet, set_number: newSets.length + 1 });
  };

  const handleSaveExercise = () => {
    if (!selectedExercise || sets.length === 0) {
      Alert.alert('Error', 'Please add at least one set');
      return;
    }

    const exercise: WorkoutExercise = {
      exercise_name: selectedExercise.name,
      body_part: selectedExercise.body_part,
      workout_type: selectedExercise.workout_type,
      sets: sets,
      notes: exerciseNotes || undefined,
    };

    if (editingExerciseIndex !== null) {
      updateExerciseInWorkout(editingExerciseIndex, exercise);
      setEditingExerciseIndex(null);
    } else {
      addExerciseToWorkout(exercise);
    }

    setShowSetModal(false);
    setSelectedExercise(null);
    setSets([]);
  };

  const handleEditExercise = (index: number) => {
    const exercise = currentWorkout.exercises[index];
    // Find matching exercise template
    const template = exercises.find((e) => e.name === exercise.exercise_name);
    if (template) {
      setSelectedExercise(template);
      setSets(exercise.sets);
      setExerciseNotes(exercise.notes || '');
      setEditingExerciseIndex(index);
      setShowSetModal(true);
    }
  };

  const handleSaveWorkout = async () => {
    if (currentWorkout.exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    const result = await createWorkout();
    if (result) {
      Alert.alert('Success', 'Workout saved successfully!', [
        {
          text: 'OK',
          onPress: () => router.push('/(tabs)'),
        },
      ]);
    }
  };

  const handleCreateCustomExercise = async () => {
    if (!customExercise.name.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }
    if (!customExercise.muscle_group.trim()) {
      Alert.alert('Error', 'Please enter a muscle group');
      return;
    }

    setCreatingExercise(true);
    try {
      const newExercise = await api.createExercise(customExercise);
      
      // Refresh exercises list
      await fetchExercises();
      
      // Close create modal and select the new exercise
      setShowCreateExerciseModal(false);
      setCustomExercise({
        name: '',
        body_part: 'Chest',
        muscle_group: '',
        workout_type: 'strength',
      });
      
      // Auto-select the newly created exercise
      handleSelectExercise(newExercise);
      
      Alert.alert('Success', `"${newExercise.name}" has been added to your exercises!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create exercise');
    } finally {
      setCreatingExercise(false);
    }
  };

  const openCreateExerciseModal = () => {
    setShowExerciseModal(false);
    setShowCreateExerciseModal(true);
  };

  const totalVolume = currentWorkout.exercises.reduce((acc, ex) => {
    return acc + ex.sets.reduce((setAcc, set) => setAcc + set.weight * set.reps, 0);
  }, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => resetCurrentWorkout()}>
            <Ionicons name="close" size={24} color="#888888" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Workout</Text>
          <TouchableOpacity
            onPress={handleSaveWorkout}
            disabled={loading || currentWorkout.exercises.length === 0}
          >
            <Text
              style={[
                styles.saveButton,
                (loading || currentWorkout.exercises.length === 0) && styles.saveButtonDisabled,
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Date Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Date</Text>
            <TouchableOpacity 
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#4ECDC4" />
              <Text style={styles.dateSelectorText}>
                {isToday(workoutDate) ? 'Today' : format(workoutDate, 'EEEE, MMM d, yyyy')}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#888888" />
            </TouchableOpacity>
            {!isToday(workoutDate) && (
              <TouchableOpacity 
                style={styles.resetDateButton}
                onPress={() => {
                  setLocalWorkoutDate(new Date());
                  setWorkoutDate(new Date());
                }}
              >
                <Ionicons name="refresh" size={14} color="#888888" />
                <Text style={styles.resetDateText}>Reset to today</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Date Picker Modal */}
          {showDatePicker && (
            <Modal
              transparent={true}
              animationType="fade"
              visible={showDatePicker}
              onRequestClose={() => setShowDatePicker(false)}
            >
              <TouchableOpacity 
                style={styles.datePickerOverlay}
                activeOpacity={1}
                onPress={() => setShowDatePicker(false)}
              >
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>Select Date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.datePickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={workoutDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    themeVariant="dark"
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {/* Workout Type Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Type</Text>
            <WorkoutTypeSelector
              selected={currentWorkout.workout_type}
              onSelect={setWorkoutType}
            />
          </View>

          {/* Exercises */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Exercises</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setSelectedBodyPart(null);
                  setSearchQuery('');
                  setShowExerciseModal(true);
                }}
              >
                <Ionicons name="add" size={20} color="#4ECDC4" />
                <Text style={styles.addButtonText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>

            {currentWorkout.exercises.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="barbell-outline" size={48} color="#333333" />
                <Text style={styles.emptyStateText}>No exercises added yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap "Add Exercise" to start
                </Text>
              </View>
            ) : (
              currentWorkout.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={index}
                  exercise={exercise}
                  onEdit={() => handleEditExercise(index)}
                  onRemove={() => removeExerciseFromWorkout(index)}
                />
              ))
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="How did you feel? Any injuries?"
              placeholderTextColor="#666666"
              multiline
              value={currentWorkout.notes || ''}
              onChangeText={setWorkoutNotes}
            />
          </View>

          {/* Duration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration (minutes)</Text>
            <TextInput
              style={styles.durationInput}
              placeholder="60"
              placeholderTextColor="#666666"
              keyboardType="numeric"
              value={currentWorkout.duration?.toString() || ''}
              onChangeText={(text) => setWorkoutDuration(parseInt(text) || 0)}
            />
          </View>

          {/* Summary */}
          {currentWorkout.exercises.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {currentWorkout.exercises.length}
                  </Text>
                  <Text style={styles.summaryLabel}>Exercises</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {currentWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Sets</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {totalVolume.toLocaleString()}
                  </Text>
                  <Text style={styles.summaryLabel}>Volume (kg)</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Exercise Selection Modal */}
        <Modal
          visible={showExerciseModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowExerciseModal(false);
                setSearchQuery('');
              }}>
                <Ionicons name="close" size={24} color="#888888" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Exercise</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Create Custom Exercise Button */}
            <TouchableOpacity 
              style={styles.createCustomButton}
              onPress={openCreateExerciseModal}
            >
              <View style={styles.createCustomIcon}>
                <Ionicons name="add-circle" size={24} color="#4ECDC4" />
              </View>
              <View style={styles.createCustomContent}>
                <Text style={styles.createCustomTitle}>Create Custom Exercise</Text>
                <Text style={styles.createCustomSubtitle}>Add your own exercise to the list</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search exercises..."
                placeholderTextColor="#666666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#666666" />
                </TouchableOpacity>
              )}
            </View>

            {/* Body Part Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.bodyPartFilter}
              contentContainerStyle={styles.bodyPartFilterContent}
            >
              <TouchableOpacity
                style={[
                  styles.bodyPartChip,
                  !selectedBodyPart && styles.bodyPartChipSelected,
                ]}
                onPress={() => setSelectedBodyPart(null)}
              >
                <Text
                  style={[
                    styles.bodyPartChipText,
                    !selectedBodyPart && styles.bodyPartChipTextSelected,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {bodyParts.map((part) => (
                <TouchableOpacity
                  key={part}
                  style={[
                    styles.bodyPartChip,
                    selectedBodyPart === part && styles.bodyPartChipSelected,
                  ]}
                  onPress={() => setSelectedBodyPart(part)}
                >
                  <Text
                    style={[
                      styles.bodyPartChipText,
                      selectedBodyPart === part && styles.bodyPartChipTextSelected,
                    ]}
                  >
                    {part}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Results Count */}
            <View style={styles.resultsCount}>
              <Text style={styles.resultsCountText}>
                {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
              </Text>
            </View>

            {/* Exercise List */}
            <ScrollView style={styles.exerciseList}>
              {filteredExercises.length === 0 ? (
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={48} color="#333333" />
                  <Text style={styles.noResultsText}>No exercises found</Text>
                  <Text style={styles.noResultsSubtext}>Try creating a custom exercise</Text>
                </View>
              ) : (
                filteredExercises.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={styles.exerciseItem}
                    onPress={() => handleSelectExercise(exercise)}
                  >
                    <View style={styles.exerciseItemContent}>
                      <View style={styles.exerciseItemHeader}>
                        <Text style={styles.exerciseItemName}>{exercise.name}</Text>
                        {exercise.is_custom && (
                          <View style={styles.customBadge}>
                            <Text style={styles.customBadgeText}>Custom</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.exerciseItemMuscle}>
                        {exercise.muscle_group} • {exercise.body_part}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666666" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Create Custom Exercise Modal */}
        <Modal
          visible={showCreateExerciseModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowCreateExerciseModal(false);
                setShowExerciseModal(true);
              }}>
                <Ionicons name="arrow-back" size={24} color="#888888" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Exercise</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.createExerciseForm}>
              {/* Exercise Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Exercise Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Cable Lateral Raise"
                  placeholderTextColor="#666666"
                  value={customExercise.name}
                  onChangeText={(text) => setCustomExercise({ ...customExercise, name: text })}
                />
              </View>

              {/* Body Part */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Body Part *</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.formChipsContainer}
                >
                  {BODY_PARTS.map((part) => (
                    <TouchableOpacity
                      key={part}
                      style={[
                        styles.formChip,
                        customExercise.body_part === part && styles.formChipSelected,
                      ]}
                      onPress={() => setCustomExercise({ ...customExercise, body_part: part })}
                    >
                      <Text
                        style={[
                          styles.formChipText,
                          customExercise.body_part === part && styles.formChipTextSelected,
                        ]}
                      >
                        {part}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Muscle Group */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Muscle Group *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Lateral Deltoid"
                  placeholderTextColor="#666666"
                  value={customExercise.muscle_group}
                  onChangeText={(text) => setCustomExercise({ ...customExercise, muscle_group: text })}
                />
              </View>

              {/* Workout Type */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Workout Type *</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.formChipsContainer}
                >
                  {WORKOUT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.formChip,
                        customExercise.workout_type === type && styles.formChipSelected,
                      ]}
                      onPress={() => setCustomExercise({ ...customExercise, workout_type: type })}
                    >
                      <Text
                        style={[
                          styles.formChipText,
                          customExercise.workout_type === type && styles.formChipTextSelected,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Create Button */}
              <TouchableOpacity 
                style={[
                  styles.createButton,
                  creatingExercise && styles.createButtonDisabled
                ]}
                onPress={handleCreateCustomExercise}
                disabled={creatingExercise}
              >
                <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                <Text style={styles.createButtonText}>
                  {creatingExercise ? 'Creating...' : 'Create Exercise'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.formHint}>
                Your custom exercise will be saved and available in future workouts.
              </Text>
            </ScrollView>
          </View>
        </Modal>

        {/* Set Input Modal */}
        <Modal
          visible={showSetModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowSetModal(false);
                  setSelectedExercise(null);
                  setEditingExerciseIndex(null);
                }}
              >
                <Ionicons name="close" size={24} color="#888888" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedExercise?.name || 'Add Sets'}
              </Text>
              <TouchableOpacity onPress={handleSaveExercise}>
                <Text style={styles.doneButton}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.setModalContent}>
              {/* Current Sets */}
              {sets.length > 0 && (
                <View style={styles.setsListContainer}>
                  <Text style={styles.setsListTitle}>Sets Added</Text>
                  {sets.map((set, index) => (
                    <View key={index} style={styles.setListItem}>
                      <Text style={styles.setListText}>
                        Set {set.set_number}: {set.weight}kg × {set.reps} reps
                        {set.rpe ? ` @ RPE ${set.rpe}` : ''}
                      </Text>
                      <TouchableOpacity onPress={() => handleRemoveSet(index)}>
                        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Add Set Form */}
              <View style={styles.addSetForm}>
                <Text style={styles.addSetTitle}>Add Set {sets.length + 1}</Text>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Weight (kg)</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="numeric"
                      value={currentSet.weight.toString()}
                      onChangeText={(text) =>
                        setCurrentSet({ ...currentSet, weight: parseFloat(text) || 0 })
                      }
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="numeric"
                      value={currentSet.reps.toString()}
                      onChangeText={(text) =>
                        setCurrentSet({ ...currentSet, reps: parseInt(text) || 0 })
                      }
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>RPE (1-10)</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="numeric"
                      placeholder="-"
                      placeholderTextColor="#666666"
                      value={currentSet.rpe?.toString() || ''}
                      onChangeText={(text) =>
                        setCurrentSet({
                          ...currentSet,
                          rpe: text ? Math.min(10, Math.max(1, parseInt(text))) : undefined,
                        })
                      }
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.addSetButton} onPress={handleAddSet}>
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                  <Text style={styles.addSetButtonText}>Add Set</Text>
                </TouchableOpacity>
              </View>

              {/* Notes */}
              <View style={styles.exerciseNotesContainer}>
                <Text style={styles.inputLabel}>Notes (optional)</Text>
                <TextInput
                  style={styles.exerciseNotesInput}
                  placeholder="Any notes for this exercise..."
                  placeholderTextColor="#666666"
                  multiline
                  value={exerciseNotes}
                  onChangeText={setExerciseNotes}
                />
              </View>
            </ScrollView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  saveButtonDisabled: {
    color: '#444444',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  resetDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginHorizontal: 20,
    gap: 4,
  },
  resetDateText: {
    fontSize: 12,
    color: '#888888',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#444444',
    marginTop: 4,
  },
  notesInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  durationInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    color: '#FFFFFF',
    fontSize: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 40,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#333333',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  createCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4ECDC430',
    borderStyle: 'dashed',
  },
  createCustomIcon: {
    marginRight: 12,
  },
  createCustomContent: {
    flex: 1,
  },
  createCustomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  createCustomSubtitle: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  bodyPartFilter: {
    maxHeight: 56,
  },
  bodyPartFilterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  bodyPartChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    marginRight: 8,
  },
  bodyPartChipSelected: {
    backgroundColor: '#4ECDC4',
  },
  bodyPartChipText: {
    fontSize: 14,
    color: '#888888',
  },
  bodyPartChipTextSelected: {
    color: '#0D0D0D',
    fontWeight: '600',
  },
  resultsCount: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resultsCountText: {
    fontSize: 12,
    color: '#666666',
  },
  exerciseList: {
    flex: 1,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#444444',
    marginTop: 4,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  exerciseItemContent: {
    flex: 1,
  },
  exerciseItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseItemName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  customBadge: {
    backgroundColor: '#4ECDC420',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customBadgeText: {
    fontSize: 10,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  exerciseItemMuscle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  // Create Exercise Form Styles
  createExerciseForm: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  formInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  formChipsContainer: {
    gap: 8,
  },
  formChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginRight: 8,
  },
  formChipSelected: {
    backgroundColor: '#4ECDC4',
  },
  formChipText: {
    fontSize: 14,
    color: '#888888',
  },
  formChipTextSelected: {
    color: '#0D0D0D',
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  formHint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
  },
  // Set Modal Styles
  setModalContent: {
    flex: 1,
    padding: 20,
  },
  setsListContainer: {
    marginBottom: 24,
  },
  setsListTitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 12,
  },
  setListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  setListText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  addSetForm: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  addSetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
  },
  numberInput: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  addSetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exerciseNotesContainer: {
    marginBottom: 40,
  },
  exerciseNotesInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
