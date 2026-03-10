const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = `${API_URL}/api`;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string, age?: number, weight?: number, fitness_goals?: string) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, age, weight, fitness_goals }),
    });
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async updateProfile(data: { name?: string; age?: number; weight?: number; height?: number; fitness_goals?: string }) {
    return this.request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Motivation
  async getMotivationQuote() {
    return this.request<{ quote: string; author: string }>('/motivation/quote');
  }

  // Exercises
  async getExercises(bodyPart?: string, workoutType?: string, search?: string) {
    let endpoint = '/exercises';
    const params = new URLSearchParams();
    if (bodyPart) params.append('body_part', bodyPart);
    if (workoutType) params.append('workout_type', workoutType);
    if (search) params.append('search', search);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.request<any[]>(endpoint);
  }

  async createExercise(exercise: any) {
    return this.request<any>('/exercises', {
      method: 'POST',
      body: JSON.stringify(exercise),
    });
  }

  async getBodyParts() {
    return this.request<string[]>('/body-parts');
  }

  // Workouts
  async getWorkouts(limit = 50, skip = 0) {
    return this.request<any[]>(`/workouts?limit=${limit}&skip=${skip}`);
  }

  async getWorkout(id: string) {
    return this.request<any>(`/workouts/${id}`);
  }

  async createWorkout(workout: any) {
    return this.request<any>('/workouts', {
      method: 'POST',
      body: JSON.stringify(workout),
    });
  }

  async deleteWorkout(id: string) {
    return this.request<any>(`/workouts/${id}`, {
      method: 'DELETE',
    });
  }

  async getRecentExercises() {
    return this.request<any[]>('/workouts/recent/exercises');
  }

  async getLastWorkout() {
    return this.request<any>('/workouts/last/repeat');
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  async getWeeklyConsistency() {
    return this.request<any[]>('/dashboard/weekly-consistency');
  }

  async getVolumeTrend(days = 30) {
    return this.request<any[]>(`/dashboard/volume-trend?days=${days}`);
  }

  async getBodyPartDistribution(days = 30) {
    return this.request<any[]>(`/dashboard/body-part-distribution?days=${days}`);
  }

  // Personal Records
  async getPersonalRecords(exerciseName?: string) {
    let endpoint = '/personal-records';
    if (exerciseName) endpoint += `?exercise_name=${encodeURIComponent(exerciseName)}`;
    return this.request<any[]>(endpoint);
  }

  // Progress
  async getExerciseProgress(exerciseName: string, days = 90) {
    return this.request<any[]>(`/progress/exercise/${encodeURIComponent(exerciseName)}?days=${days}`);
  }

  async getProgressSummary(days = 30) {
    return this.request<any>(`/progress/summary?days=${days}`);
  }

  // Export
  async exportCSV(days = 30) {
    return this.request<any>(`/export/csv?days=${days}`);
  }

  // Import
  async importCSV(csvData: string) {
    return this.request<{
      success: boolean;
      workouts_created: number;
      workouts_merged: number;
      exercises_imported: number;
      errors: string[];
    }>('/import/csv', {
      method: 'POST',
      body: JSON.stringify({ csv_data: csvData }),
    });
  }

  // Strength Progression
  async getStrengthProgression(days = 90) {
    return this.request<{
      exercise_name: string;
      current_max: number;
      previous_max: number;
      improvement: number;
      improvement_percent: number;
      total_volume_trend: string;
      last_workout_date: string | null;
    }[]>(`/strength-progression?days=${days}`);
  }

  // Heart Rate Zones
  async getHeartRateZones() {
    return this.request<{
      max_heart_rate: number;
      zone1_recovery: { name: string; min: number; max: number; description: string };
      zone2_fat_burn: { name: string; min: number; max: number; description: string };
      zone3_aerobic: { name: string; min: number; max: number; description: string };
      zone4_anaerobic: { name: string; min: number; max: number; description: string };
      zone5_max: { name: string; min: number; max: number; description: string };
    }>('/heart-rate-zones');
  }

  // Weight History
  async getWeightHistory(days = 90) {
    return this.request<{
      id: string;
      weight: number;
      date: string;
      notes: string | null;
    }[]>(`/weight-history?days=${days}`);
  }

  async addWeightEntry(weight: number, date?: string, notes?: string) {
    return this.request<any>('/weight-history', {
      method: 'POST',
      body: JSON.stringify({ weight, date, notes }),
    });
  }

  async deleteWeightEntry(id: string) {
    return this.request<any>(`/weight-history/${id}`, {
      method: 'DELETE',
    });
  }

  // Personalized Motivation
  async getPersonalizedMotivation() {
    return this.request<{
      quote: { quote: string; author: string };
      personalized_messages: string[];
    }>('/motivation/personalized');
  }
}

export const api = new ApiClient();
