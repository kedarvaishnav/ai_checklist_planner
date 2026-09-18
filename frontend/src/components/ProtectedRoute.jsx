// src/components/ProtectedRoute.jsx
// Wraps routes that require the user to be logged in.
// Redirects to /auth if no session exists.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Show nothing while we're checking the stored token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-ink-soft">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
