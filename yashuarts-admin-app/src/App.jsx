import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';

// Lazy load admin screens
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const PricingManagementScreen = lazy(() => import('./screens/PricingManagementScreen'));
const AddEditArtworkScreen = lazy(() => import('./screens/AddEditArtworkScreen'));
const OrdersScreen = lazy(() => import('./screens/OrdersScreen'));
const AdminArtworksScreen = lazy(() => import('./screens/AdminArtworksScreen'));
const AdminMessagesScreen = lazy(() => import('./screens/AdminMessagesScreen'));
const AdminSettingsScreen = lazy(() => import('./screens/AdminSettingsScreen'));
const LoginScreen = lazy(() => import('./screens/LoginScreen'));

// Hardware back button capacitor event handler for Android
const BackButtonManager = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = CapApp.addListener('backButton', () => {
      const path = location.pathname;

      if (path === '/admin' || path === '/admin/dashboard') {
        CapApp.exitApp();
        return;
      }

      if (
        path === '/admin/pricing' ||
        path === '/admin/orders' ||
        path === '/admin/artworks' ||
        path === '/admin/messages' ||
        path === '/admin/settings'
      ) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      if (path.startsWith('/admin/artwork/')) {
        navigate('/admin/artworks', { replace: true });
        return;
      }

      // Default back navigation
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    });

    return () => {
      handleBackButton.then((handler) => handler.remove());
    };
  }, [location.pathname, navigate]);

  return null;
};

const AppRoutes = () => {
  useEffect(() => {
    SplashScreen.hide().catch(() => {});
  }, []);

  return (
    <>
      <BackButtonManager />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public Route */}
          <Route path="/admin" element={<LoginScreen />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <HomeScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pricing"
            element={
              <ProtectedRoute>
                <PricingManagementScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/artwork/:id"
            element={
              <ProtectedRoute>
                <AddEditArtworkScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute>
                <OrdersScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/artworks"
            element={
              <ProtectedRoute>
                <AdminArtworksScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/messages"
            element={
              <ProtectedRoute>
                <AdminMessagesScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminSettingsScreen />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to login */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
