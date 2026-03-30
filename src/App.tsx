import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerView from './pages/CustomerView';
import AdminView from './pages/AdminView';
import Login from './pages/Login';
import { ErrorBoundary } from './components/ErrorBoundary';

// Simple auth guard component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('eliteGoldAdminAuth') === 'jeevan@916$';
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  React.useEffect(() => {
    // Prevent right click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Prevent common dev tools shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Customer Route - Clean view without settings */}
          <Route path="/" element={<CustomerView />} />
          
          {/* Admin Login Route */}
          <Route path="/admin/login" element={<Login />} />
          
          {/* Protected Admin Route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminView />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all redirect to customer view */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
