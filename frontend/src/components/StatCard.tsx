import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subtext,
  color = '#4ECDC4',
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
  subtext: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
  },
});
