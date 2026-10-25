// src/App.jsx
// Router-agnostic root component. Sets up authentication context and application routes.
//
// Routes:
//   /auth          — Login / Register page (public)
//   /              — My Checklists list (protected)
//   /new           — Create a new checklist (protected)
//   /checklist/:id — View a single checklist (protected)

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import MyChecklistsPage from './pages/MyChecklistsPage';
import NewChecklistPage from './pages/NewChecklistPage';
import ChecklistPage from './pages/ChecklistPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MyChecklistsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new"
          element={
            <ProtectedRoute>
              <NewChecklistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checklist/:id"
          element={
            <ProtectedRoute>
              <ChecklistPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
