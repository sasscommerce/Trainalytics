import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart, BarChart } from 'react-native-gifted-charts';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { api } from '../../src/utils/api';

const { width: screenWidth } = Dimensions.get('window');

export default function ProgressScreen() {
  const {
    volumeTrend,
    bodyPartDistribution,
    personalRecords,
    fetchVolumeTrend,
    fetchBodyPartDistribution,
    fetchPersonalRecords,
  } = useWorkoutStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [progressSummary, setProgressSummary] = useState<any>(null);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchVolumeTrend(selectedPeriod),
      fetchBodyPartDistribution(selectedPeriod),
      fetchPersonalRecords(),
    ]);
    try {
      const summary = await api.getProgressSummary(selectedPeriod);
      setProgressSummary(summary);
    } catch (e) {
      console.error('Error fetching progress summary:', e);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Prepare line chart data
  const lineData = volumeTrend
    .filter((_, i) => i % Math.ceil(volumeTrend.length / 10) === 0 || i === volumeTrend.length - 1)
    .map((item) => ({
      value: item.volume,
      label: item.label,
      dataPointText: item.volume > 0 ? `${(item.volume / 1000).toFixed(1)}k` : '',
    }));

  // Group PRs by exercise
  const prsByExercise = personalRecords.reduce((acc: any, pr: any) => {
    if (!acc[pr.exercise_name]) {
      acc[pr.exercise_name] = [];}
    acc[pr.exercise_name].push(pr);
    return acc;
  }, {});

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'heaviest_lift':
        return 'barbell';
      case 'most_reps':
        return 'repeat';
      case 'highest_volume':
        return 'trending-up';
      default:
        return 'trophy';
    }
  };

  const getRecordLabel = (type: string) => {
    switch (type) {
      case 'heaviest_lift':
        return 'Max Weight';
      case 'most_reps':
        return 'Max Reps';
      case 'highest_volume':
        return 'Max Volume';
      default:
        return type;
    }
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
          <Text style={styles.title}>Progress</Text>
          <View style={styles.periodSelector}>
            {[30, 90, 365].map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.periodButton,
                  selectedPeriod === days && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(days)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === days && styles.periodButtonTextActive,
                  ]}
                >
                  {days === 365 ? '1Y' : `${days}D`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Summary */}
        {progressSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Volume Progress</Text>
            <View style={styles.progressSummaryCard}>
              <View style={styles.progressSummaryItem}>
                <Text style={styles.progressSummaryValue}>
                  {((progressSummary.current_period?.total_volume || 0) / 1000).toFixed(1)}k kg
                </Text>
                <Text style={styles.progressSummaryLabel}>This Period</Text>
              </View>
              <View style={styles.progressSummaryDivider}>
                <View
                  style={[
                    styles.progressChange,
                    progressSummary.volume_change_percent >= 0
                      ? styles.progressChangePositive
                      : styles.progressChangeNegative,
                  ]}
                >
                  <Ionicons
                    name={
                      progressSummary.volume_change_percent >= 0
                        ? 'trending-up'
                        : 'trending-down'
                    }
                    size={16}
                    color={
                      progressSummary.volume_change_percent >= 0 ? '#4ECDC4' : '#FF6B6B'
                    }
                  />
                  <Text
                    style={[
                      styles.progressChangeText,
                      progressSummary.volume_change_percent >= 0
                        ? styles.progressChangeTextPositive
                        : styles.progressChangeTextNegative,
                    ]}
                  >
                    {Math.abs(progressSummary.volume_change_percent).toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={styles.progressSummaryItem}>
                <Text style={styles.progressSummaryValue}>
                  {((progressSummary.previous_period?.total_volume || 0) / 1000).toFixed(1)}k kg
                </Text>
                <Text style={styles.progressSummaryLabel}>Last Period</Text>
              </View>
            </View>
          </View>
        )}

        {/* Volume Trend Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Volume Trend</Text>
          <View style={styles.chartContainer}>
            {lineData.length > 0 && lineData.some((d) => d.value > 0) ? (
              <LineChart
                data={lineData}
                width={screenWidth - 80}
                height={180}
                spacing={40}
                color="#4ECDC4"
                thickness={3}
                startFillColor="rgba(78, 205, 196, 0.3)"
                endFillColor="rgba(78, 205, 196, 0.01)"
                startOpacity={0.9}
                endOpacity={0.1}
                initialSpacing={10}
                noOfSections={4}
                yAxisColor="transparent"
                xAxisColor="transparent"
                yAxisTextStyle={{ color: '#666666', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: '#666666', fontSize: 9 }}
                hideDataPoints={false}
                dataPointsColor="#4ECDC4"
                dataPointsRadius={4}
                curved
                areaChart
              />
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="analytics-outline" size={48} color="#333333" />
                <Text style={styles.emptyChartText}>No data yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Body Part Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Part Distribution</Text>
          <View style={styles.chartContainer}>
            {bodyPartDistribution.length > 0 ? (
              <View style={styles.pieChartWrapper}>
                <PieChart
                  data={bodyPartDistribution.map((item) => ({
                    value: item.value,
                    color: item.color,
                    text: '',
                  }))}
                  radius={80}
                  innerRadius={50}
                  centerLabelComponent={() => (
                    <View style={styles.pieCenter}>
                      <Text style={styles.pieCenterValue}>
                        {bodyPartDistribution.reduce((acc, item) => acc + item.value, 0)}
                      </Text>
                      <Text style={styles.pieCenterLabel}>Total</Text>
                    </View>
                  )}
                />
                <View style={styles.legendContainer}>
                  {bodyPartDistribution.slice(0, 6).map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View
                        style={[styles.legendColor, { backgroundColor: item.color }]}
                      />
                      <Text style={styles.legendText}>{item.label}</Text>
                      <Text style={styles.legendValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="pie-chart-outline" size={48} color="#333333" />
                <Text style={styles.emptyChartText}>No workouts yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Personal Records */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Records</Text>
          {Object.keys(prsByExercise).length > 0 ? (
            Object.entries(prsByExercise).map(([exerciseName, prs]: [string, any]) => (
              <View key={exerciseName} style={styles.prCard}>
                <Text style={styles.prExerciseName}>{exerciseName}</Text>
                <View style={styles.prList}>
                  {prs.map((pr: any, index: number) => (
                    <View key={index} style={styles.prItem}>
                      <View style={styles.prIconContainer}>
                        <Ionicons
                          name={getRecordIcon(pr.record_type) as any}
                          size={16}
                          color="#FFEAA7"
                        />
                      </View>
                      <View style={styles.prInfo}>
                        <Text style={styles.prLabel}>{getRecordLabel(pr.record_type)}</Text>
                        <Text style={styles.prValue}>
                          {pr.value}
                          {pr.record_type === 'heaviest_lift' || pr.record_type === 'highest_volume'
                            ? ' kg'
                            : ''}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyPRs}>
              <Ionicons name="trophy-outline" size={48} color="#333333" />
              <Text style={styles.emptyChartText}>No personal records yet</Text>
              <Text style={styles.emptyChartSubtext}>Start logging workouts to track PRs</Text>
            </View>
          )}
        </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#4ECDC4',
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
  },
  periodButtonTextActive: {
    color: '#0D0D0D',
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
  chartContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
  },
  emptyChartSubtext: {
    fontSize: 12,
    color: '#444444',
    marginTop: 4,
  },
  progressSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  progressSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressSummaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressSummaryLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  progressSummaryDivider: {
    paddingHorizontal: 16,
  },
  progressChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  progressChangePositive: {
    backgroundColor: '#4ECDC420',
  },
  progressChangeNegative: {
    backgroundColor: '#FF6B6B20',
  },
  progressChangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressChangeTextPositive: {
    color: '#4ECDC4',
  },
  progressChangeTextNegative: {
    color: '#FF6B6B',
  },
  pieChartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pieCenterLabel: {
    fontSize: 11,
    color: '#888888',
  },
  legendContainer: {
    flex: 1,
    marginLeft: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    color: '#FFFFFF',
  },
  legendValue: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '600',
  },
  prCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  prExerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  prList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  prItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  prIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEAA720',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prInfo: {
    alignItems: 'flex-start',
  },
  prLabel: {
    fontSize: 10,
    color: '#888888',
  },
  prValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyPRs: {
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    paddingVertical: 40,
  },
});
