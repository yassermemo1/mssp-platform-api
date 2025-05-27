import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { UserRole, ApiError } from '../../types/auth';
import './RegisterForm.css';

interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/**
 * RegisterForm Component
 * Simple, clean registration form for new users
 */
const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: UserRole.ENGINEER, // Default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  /**
   * Handle input field changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!credentials.email || !credentials.password || !credentials.firstName || !credentials.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    if (!isValidEmail(credentials.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (credentials.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (credentials.password !== credentials.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.post('/auth/register', {
        email: credentials.email,
        password: credentials.password,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        role: credentials.role,
      });

      setSuccess('Registration successful! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Simple email validation
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="register-form-container">
      <div className="register-form-card">
        <div className="register-header">
          <h1>MSSP Platform</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={credentials.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
                disabled={loading}
                autoComplete="given-name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={credentials.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
                disabled={loading}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={credentials.role}
              onChange={handleInputChange}
              disabled={loading}
              required
            >
              <option value={UserRole.ENGINEER}>Engineer</option>
              <option value={UserRole.ACCOUNT_MANAGER}>Account Manager</option>
              <option value={UserRole.PROJECT_MANAGER}>Project Manager</option>
              <option value={UserRole.MANAGER}>Manager</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={credentials.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              disabled={loading}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="register-footer">
          <p>Already have an account? <Link to="/login" className="login-link">Sign in here</Link></p>
          <p className="platform-name">MSSP Client Management Platform</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm; 