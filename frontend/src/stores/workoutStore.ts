import { create } from 'zustand';
import { api } from '../utils/api';
import { Workout, ExerciseTemplate, DashboardStats, WorkoutExercise, ExerciseSet } from '../types';

interface WorkoutState {
  workouts: Workout[];
  exercises: ExerciseTemplate[];
  bodyParts: string[];
  dashboardStats: DashboardStats | null;
  weeklyConsistency: any[];
  volumeTrend: any[];
  bodyPartDistribution: any[];
  personalRecords: any[];
  loading: boolean;
  error: string | null;

  // Current workout being created
  currentWorkout: {
    workout_type: string;
    exercises: WorkoutExercise[];
    duration?: number;
    notes?: string;
    date?: Date;
  };

  // Actions
  fetchWorkouts: () => Promise<void>;
  fetchExercises: (bodyPart?: string) => Promise<void>;
  fetchBodyParts: () => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  fetchWeeklyConsistency: () => Promise<void>;
  fetchVolumeTrend: (days?: number) => Promise<void>;
  fetchBodyPartDistribution: (days?: number) => Promise<void>;
  fetchPersonalRecords: () => Promise<void>;
  createWorkout: () => Promise<Workout | null>;
  deleteWorkout: (id: string) => Promise<void>;
  
  // Current workout actions
  setWorkoutType: (type: string) => void;
  addExerciseToWorkout: (exercise: WorkoutExercise) => void;
  removeExerciseFromWorkout: (index: number) => void;
  updateExerciseInWorkout: (index: number, exercise: WorkoutExercise) => void;
  setWorkoutNotes: (notes: string) => void;
  setWorkoutDuration: (duration: number) => void;
  setWorkoutDate: (date: Date) => void;
  resetCurrentWorkout: () => void;
  repeatLastWorkout: () => Promise<void>;
}

const initialCurrentWorkout = {
  workout_type: 'strength',
  exercises: [],
  duration: undefined,
  notes: undefined,
  date: undefined,
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],
  exercises: [],
  bodyParts: [],
  dashboardStats: null,
  weeklyConsistency: [],
  volumeTrend: [],
  bodyPartDistribution: [],
  personalRecords: [],
  loading: false,
  error: null,
  currentWorkout: { ...initialCurrentWorkout },

  fetchWorkouts: async () => {
    set({ loading: true, error: null });
    try {
      const workouts = await api.getWorkouts();
      set({ workouts, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchExercises: async (bodyPart?: string) => {
    set({ loading: true, error: null });
    try {
      const exercises = await api.getExercises(bodyPart);
      set({ exercises, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchBodyParts: async () => {
    try {
      const bodyParts = await api.getBodyParts();
      set({ bodyParts });
    } catch (error: any) {
      console.error('Error fetching body parts:', error);
    }
  },

  fetchDashboardStats: async () => {
    try {
      const dashboardStats = await api.getDashboardStats();
      set({ dashboardStats });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
    }
  },

  fetchWeeklyConsistency: async () => {
    try {
      const weeklyConsistency = await api.getWeeklyConsistency();
      set({ weeklyConsistency });
    } catch (error: any) {
      console.error('Error fetching weekly consistency:', error);
    }
  },

  fetchVolumeTrend: async (days = 30) => {
    try {
      const volumeTrend = await api.getVolumeTrend(days);
      set({ volumeTrend });
    } catch (error: any) {
      console.error('Error fetching volume trend:', error);
    }
  },

  fetchBodyPartDistribution: async (days = 30) => {
    try {
      const bodyPartDistribution = await api.getBodyPartDistribution(days);
      set({ bodyPartDistribution });
    } catch (error: any) {
      console.error('Error fetching body part distribution:', error);
    }
  },

  fetchPersonalRecords: async () => {
    try {
      const personalRecords = await api.getPersonalRecords();
      set({ personalRecords });
    } catch (error: any) {
      console.error('Error fetching personal records:', error);
    }
  },

  createWorkout: async () => {
    const { currentWorkout } = get();
    if (currentWorkout.exercises.length === 0) {
      set({ error: 'Please add at least one exercise' });
      return null;
    }

    set({ loading: true, error: null });
    try {
      const workout = await api.createWorkout(currentWorkout);
      set((state) => ({
        workouts: [workout, ...state.workouts],
        currentWorkout: { ...initialCurrentWorkout },
        loading: false,
      }));
      return workout;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  deleteWorkout: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.deleteWorkout(id);
      set((state) => ({
        workouts: state.workouts.filter((w) => w.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  setWorkoutType: (type: string) => {
    set((state) => ({
      currentWorkout: { ...state.currentWorkout, workout_type: type },
    }));
  },

  addExerciseToWorkout: (exercise: WorkoutExercise) => {
    set((state) => ({
      currentWorkout: {
        ...state.currentWorkout,
        exercises: [...state.currentWorkout.exercises, exercise],
      },
    }));
  },

  removeExerciseFromWorkout: (index: number) => {
    set((state) => ({
      currentWorkout: {
        ...state.currentWorkout,
        exercises: state.currentWorkout.exercises.filter((_, i) => i !== index),
      },
    }));
  },

  updateExerciseInWorkout: (index: number, exercise: WorkoutExercise) => {
    set((state) => ({
      currentWorkout: {
        ...state.currentWorkout,
        exercises: state.currentWorkout.exercises.map((e, i) =>
          i === index ? exercise : e
        ),
      },
    }));
  },

  setWorkoutNotes: (notes: string) => {
    set((state) => ({
      currentWorkout: { ...state.currentWorkout, notes },
    }));
  },

  setWorkoutDuration: (duration: number) => {
    set((state) => ({
      currentWorkout: { ...state.currentWorkout, duration },
    }));
  },

  setWorkoutDate: (date: Date) => {
    set((state) => ({
      currentWorkout: { ...state.currentWorkout, date },
    }));
  },

  resetCurrentWorkout: () => {
    set({ currentWorkout: { ...initialCurrentWorkout } });
  },

  repeatLastWorkout: async () => {
    try {
      const lastWorkout = await api.getLastWorkout();
      if (lastWorkout) {
        set({
          currentWorkout: {
            workout_type: lastWorkout.workout_type,
            exercises: lastWorkout.exercises.map((e: WorkoutExercise) => ({
              ...e,
              sets: e.sets.map((s: ExerciseSet, idx: number) => ({
                ...s,
                set_number: idx + 1,
              })),
            })),
            duration: lastWorkout.duration,
            notes: undefined,
          },
        });
      }
    } catch (error: any) {
      console.error('Error repeating last workout:', error);
    }
  },
}));
