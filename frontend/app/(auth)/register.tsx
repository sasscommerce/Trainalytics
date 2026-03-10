import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [fitnessGoals, setFitnessGoals] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: credentials, 2: profile

  const handleNext = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await register(
        email,
        password,
        name,
        age ? parseInt(age) : undefined,
        weight ? parseFloat(weight) : undefined,
        fitnessGoals || undefined
      );
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => (step === 1 ? router.back() : setStep(1))}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {step === 1 ? 'Create Account' : 'Set Your Goals'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? 'Start your fitness journey'
                : 'Help us personalize your experience'}
            </Text>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          </View>

          {/* Form */}
          {step === 1 ? (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#666666"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#666666"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#666666"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>

              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Age (years) - For heart rate zones"
                  placeholderTextColor="#666666"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="scale-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Current Weight (kg) - Optional"
                  placeholderTextColor="#666666"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputContainer, { height: 100, alignItems: 'flex-start', paddingTop: 16 }]}>
                <Ionicons name="trophy-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { textAlignVertical: 'top' }]}
                  placeholder="Fitness Goals - Optional (e.g., Build muscle, Lose weight, Get stronger)"
                  placeholderTextColor="#666666"
                  value={fitnessGoals}
                  onChangeText={setFitnessGoals}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={handleRegister}>
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer */}
          {step === 1 && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333333',
  },
  stepDotActive: {
    backgroundColor: '#4ECDC4',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#333333',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#4ECDC4',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666666',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    color: '#888888',
    fontSize: 14,
  },
  loginLink: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '600',
  },
});
