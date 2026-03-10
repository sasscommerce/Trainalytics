import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BarChart } from 'react-native-gifted-charts';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { StatCard } from '../../src/components/StatCard';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/utils/api';

interface StrengthProgressionData {
  exercise_name: string;
  current_max: number;
  previous_max: number;
  improvement: number;
  improvement_percent: number;
  total_volume_trend: string;
  last_workout_date: string | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const {
    dashboardStats,
    weeklyConsistency,
    fetchDashboardStats,
    fetchWeeklyConsistency,
    fetchVolumeTrend,
    repeatLastWorkout,
    workouts,
    fetchWorkouts,
  } = useWorkoutStore();

  const [refreshing, setRefreshing] = useState(false);
  const [quote, setQuote] = useState<{ quote: string; author: string } | null>(null);
  const [personalizedMessages, setPersonalizedMessages] = useState<string[]>([]);
  const [strengthProgression, setStrengthProgression] = useState<StrengthProgressionData[]>([]);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchDashboardStats(),
      fetchWeeklyConsistency(),
      fetchVolumeTrend(7),
      fetchWorkouts(),
    ]);
    // Load motivation quote and personalized messages
    try {
      if (isAuthenticated) {
        const motivation = await api.getPersonalizedMotivation();
        setQuote(motivation.quote);
        setPersonalizedMessages(motivation.personalized_messages);
      } else {
        const motivationQuote = await api.getMotivationQuote();
        setQuote(motivationQuote);
      }
    } catch (e) {
      console.log('Error loading motivation:', e);
      // Fallback to simple quote
      try {
        const motivationQuote = await api.getMotivationQuote();
        setQuote(motivationQuote);
      } catch (e2) {
        console.log('Error loading fallback quote:', e2);
      }
    }
    
    // Load strength progression
    try {
      const progression = await api.getStrengthProgression(90);
      setStrengthProgression(progression);
    } catch (e) {
      console.log('Error loading strength progression:', e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRepeatWorkout = async () => {
    await repeatLastWorkout();
    router.push('/(tabs)/log');
  };

  const barData = weeklyConsistency.map((day) => ({
    value: day.count,
    label: day.day,
    frontColor: day.is_today ? '#4ECDC4' : '#666666',
    topLabelComponent: () => (
      <Text style={{ color: '#fff', fontSize: 10 }}>
        {day.count > 0 ? day.count : ''}
      </Text>
    ),
  }));

  const todayWorkout = workouts.find((w) => {
    const workoutDate = new Date(w.date).toDateString();
    const today = new Date().toDateString();
    return workoutDate === today;
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {greeting()}{isAuthenticated && user ? `, ${user.name.split(' ')[0]}` : ''}!
            </Text>
            <Text style={styles.title}>Trainlytics</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="checkmark-done-circle" size={24} color="#4ECDC4" />
            <Text style={styles.streakText}>
              {dashboardStats?.current_streak || 0}
            </Text>
          </View>
        </View>

        {/* Motivation Quote */}
        {quote && (
          <View style={styles.quoteCard}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#4ECDC4" />
            <View style={styles.quoteContent}>
              <Text style={styles.quoteText}>"{quote.quote}"</Text>
              <Text style={styles.quoteAuthor}>— {quote.author}</Text>
            </View>
          </View>
        )}

        {/* Personalized Messages */}
        {personalizedMessages.length > 0 && (
          <View style={styles.personalizedSection}>
            {personalizedMessages.map((message, index) => (
              <View key={index} style={styles.personalizedMessage}>
                <Ionicons name="star" size={14} color="#FFEAA7" />
                <Text style={styles.personalizedMessageText}>{message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Strength Progression */}
        {strengthProgression.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strength Progress</Text>
            <View style={styles.strengthProgressCard}>
              {strengthProgression.slice(0, 4).map((lift, index) => (
                <View key={index} style={styles.strengthItem}>
                  <View style={styles.strengthHeader}>
                    <Text style={styles.strengthLiftName}>{lift.exercise_name}</Text>
                    <View style={[
                      styles.trendBadge,
                      lift.total_volume_trend === 'increasing' && styles.trendIncreasing,
                      lift.total_volume_trend === 'decreasing' && styles.trendDecreasing,
                    ]}>
                      <Ionicons 
                        name={lift.total_volume_trend === 'increasing' ? 'trending-up' : lift.total_volume_trend === 'decreasing' ? 'trending-down' : 'remove'}
                        size={12}
                        color={lift.total_volume_trend === 'increasing' ? '#4ECDC4' : lift.total_volume_trend === 'decreasing' ? '#FF6B6B' : '#888888'}
                      />
                    </View>
                  </View>
                  <View style={styles.strengthStats}>
                    <Text style={styles.strengthMax}>{lift.current_max} kg</Text>
                    {lift.improvement !== 0 && (
                      <Text style={[
                        styles.strengthImprovement,
                        lift.improvement > 0 ? styles.improvementPositive : styles.improvementNegative
                      ]}>
                        {lift.improvement > 0 ? '+' : ''}{lift.improvement}kg ({lift.improvement > 0 ? '+' : ''}{lift.improvement_percent}%)
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/(tabs)/log')}
          >
            <Ionicons name="add-circle" size={24} color="#4ECDC4" />
            <Text style={styles.quickActionText}>New Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleRepeatWorkout}
          >
            <Ionicons name="repeat" size={24} color="#45B7D1" />
            <Text style={styles.quickActionText}>Repeat Last</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          {todayWorkout ? (
            <View style={styles.todaySummaryCard}>
              <View style={styles.todaySummaryHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
                <Text style={styles.todaySummaryTitle}>Workout Complete!</Text>
              </View>
              <Text style={styles.todaySummarySubtext}>
                {todayWorkout.exercises.length} exercise(s) •{' '}
                {todayWorkout.total_volume.toLocaleString()} kg total volume
              </Text>
            </View>
          ) : (
            <View style={styles.todaySummaryCard}>
              <View style={styles.todaySummaryHeader}>
                <Ionicons name="barbell-outline" size={24} color="#888888" />
                <Text style={styles.todaySummaryTitle}>No workout yet</Text>
              </View>
              <Text style={styles.todaySummarySubtext}>
                Tap the + button to start logging
              </Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="calendar"
              label="Workouts"
              value={dashboardStats?.total_workouts_this_month || 0}
              color="#4ECDC4"
            />
            <StatCard
              icon="barbell"
              label="Volume"
              value={`${((dashboardStats?.total_volume_this_month || 0) / 1000).toFixed(1)}k`}
              subtext="kg"
              color="#FF6B6B"
            />
          </View>
          <View style={[styles.statsGrid, { marginTop: 12 }]}>
            <StatCard
              icon="speedometer"
              label="Avg RPE"
              value={dashboardStats?.avg_intensity?.toFixed(1) || '0'}
              color="#45B7D1"
            />
            <StatCard
              icon="time"
              label="Time"
              value={`${dashboardStats?.total_time_spent || 0}`}
              subtext="min"
              color="#96CEB4"
            />
          </View>
        </View>

        {/* Weekly Consistency Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Consistency</Text>
          <View style={styles.chartContainer}>
            {barData.length > 0 ? (
              <BarChart
                data={barData}
                barWidth={32}
                spacing={16}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: '#888888' }}
                xAxisLabelTextStyle={{ color: '#888888', fontSize: 11 }}
                noOfSections={4}
                maxValue={Math.max(...barData.map((d) => d.value), 3)}
                isAnimated
                barBorderRadius={6}
              />
            ) : (
              <Text style={styles.emptyText}>No data yet</Text>
            )}
          </View>
        </View>

        {/* Streak Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streak Info</Text>
          <View style={styles.streakInfo}>
            <View style={styles.streakItem}>
              <Ionicons name="checkmark-done-circle" size={32} color="#4ECDC4" />
              <View style={styles.streakItemText}>
                <Text style={styles.streakValue}>
                  {dashboardStats?.current_streak || 0} days
                </Text>
                <Text style={styles.streakLabel}>Current Streak</Text>
              </View>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Ionicons name="trophy" size={32} color="#FFEAA7" />
              <View style={styles.streakItemText}>
                <Text style={styles.streakValue}>
                  {dashboardStats?.longest_streak || 0} days
                </Text>
                <Text style={styles.streakLabel}>Longest Streak</Text>
              </View>
            </View>
          </View>
        </View>

        {/* User Goals (if authenticated) */}
        {isAuthenticated && user?.fitness_goals && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            <View style={styles.goalsCard}>
              <Ionicons name="trophy-outline" size={24} color="#FFEAA7" />
              <Text style={styles.goalsText}>{user.fitness_goals}</Text>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#888888',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  streakText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quoteCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  quoteAuthor: {
    fontSize: 12,
    color: '#888888',
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  chartContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
  },
  todaySummaryCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
  },
  todaySummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  todaySummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  todaySummarySubtext: {
    fontSize: 14,
    color: '#888888',
    marginLeft: 34,
  },
  streakInfo: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
  },
  streakItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakItemText: {
    flex: 1,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 12,
    color: '#888888',
  },
  streakDivider: {
    width: 1,
    backgroundColor: '#333333',
    marginHorizontal: 16,
  },
  goalsCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalsText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  personalizedSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  personalizedMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFEAA7',
  },
  personalizedMessageText: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  strengthProgressCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  strengthItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: 12,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  strengthLiftName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trendBadge: {
    backgroundColor: '#333333',
    borderRadius: 12,
    padding: 4,
    paddingHorizontal: 8,
  },
  trendIncreasing: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
  },
  trendDecreasing: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  strengthStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  strengthMax: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  strengthImprovement: {
    fontSize: 12,
    fontWeight: '500',
  },
  improvementPositive: {
    color: '#4ECDC4',
  },
  improvementNegative: {
    color: '#FF6B6B',
  },
});
