export interface ExerciseSet {
  set_number: number;
  reps: number;
  weight: number;
  rpe?: number;
  rest_time?: number;
}

export interface WorkoutExercise {
  exercise_id?: string;
  exercise_name: string;
  body_part: string;
  workout_type: string;
  sets: ExerciseSet[];
  duration?: number;
  notes?: string;
  total_volume?: number;
  estimated_1rm?: number;
}

export interface Workout {
  id: string;
  date: string;
  workout_type: string;
  exercises: WorkoutExercise[];
  duration?: number;
  notes?: string;
  total_volume: number;
  created_at: string;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  body_part: string;
  muscle_group: string;
  workout_type: string;
  is_custom: boolean;
}

export interface PersonalRecord {
  id: string;
  exercise_name: string;
  record_type: string;
  value: number;
  workout_id: string;
  achieved_at: string;
}

export interface DashboardStats {
  total_workouts_this_month: number;
  total_volume_this_month: number;
  avg_intensity: number;
  total_time_spent: number;
  current_streak: number;
  longest_streak: number;
  workouts_this_week: number;
}

export interface WeeklyConsistency {
  day: string;
  count: number;
  is_today: boolean;
}

export interface VolumeTrend {
  date: string;
  label: string;
  volume: number;
}

export interface BodyPartDistribution {
  label: string;
  value: number;
  color: string;
}
