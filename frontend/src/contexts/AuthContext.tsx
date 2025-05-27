import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '../types/auth';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

/**
 * Authentication Context for managing global auth state
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to use the AuthContext
 * Throws error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that wraps the app and provides authentication state
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isAuthenticated = !!user;

  /**
   * Initialize auth state on app load
   * Check if user has a stored token and validate it
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userProfile = await apiService.get<User>('/profile/me');
      setUser(userProfile);
    } catch (error) {
      // Token is invalid, remove it
      localStorage.removeItem('token');
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login function - authenticates user and stores token
   */
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiService.post<{ access_token: string; user: User }>('/auth/login', credentials);
      
      // Store token
      localStorage.setItem('token', response.access_token);
      
      // Set user
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiService.post<{ access_token: string; user: User }>('/auth/register', data);
      
      // Store token
      localStorage.setItem('token', response.access_token);
      
      // Set user
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Logout function - clears all auth data
   */
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  /**
   * Context value object
   */
  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 