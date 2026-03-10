import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  weight?: number;
  height?: number;
  fitness_goals?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, age?: number, weight?: number, fitness_goals?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; age?: number; weight?: number; height?: number; fitness_goals?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.setToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      setToken(response.access_token);
      setUser(response.user);
      api.setToken(response.access_token);
      await AsyncStorage.setItem('auth_token', response.access_token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(response.user));
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    age?: number,
    weight?: number,
    fitness_goals?: string
  ) => {
    try {
      const response = await api.register(email, password, name, age, weight, fitness_goals);
      setToken(response.access_token);
      setUser(response.user);
      api.setToken(response.access_token);
      await AsyncStorage.setItem('auth_token', response.access_token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(response.user));
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    api.setToken(null);
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
  };

  const updateProfile = async (data: { name?: string; age?: number; weight?: number; height?: number; fitness_goals?: string }) => {
    try {
      const updatedUser = await api.updateProfile(data);
      setUser(updatedUser);
      await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
    } catch (error: any) {
      throw new Error(error.message || 'Profile update failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
