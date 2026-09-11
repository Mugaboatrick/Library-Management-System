import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from './Spinner';

// Protect routes: require login, optionally require roles
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner full />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to role-appropriate dashboard
    const home = user.role === 'LIBRARIAN' ? '/admin' : '/dashboard';
    return <Navigate to={home} replace />;
  }

  return children;
};

export default ProtectedRoute;
