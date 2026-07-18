import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';

// Lazy load screen components
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const GalleryScreen = lazy(() => import('./screens/GalleryScreen'));
const ArtworkDetailScreen = lazy(() => import('./screens/ArtworkDetailScreen'));
const ChatScreen = lazy(() => import('./screens/ChatScreen'));
const CustomOrderScreen = lazy(() => import('./screens/CustomOrderScreen'));
const OrderSuccessScreen = lazy(() => import('./screens/OrderSuccessScreen'));
const MyOrdersScreen = lazy(() => import('./screens/MyOrdersScreen'));
const PaymentScreen = lazy(() => import('./screens/PaymentScreen'));
const UserProfileScreen = lazy(() => import('./screens/UserProfileScreen'));
const ArtistProfileScreen = lazy(() => import('./screens/ArtistProfileScreen'));
const LoginScreen = lazy(() => import('./screens/LoginScreen'));
const SignupScreen = lazy(() => import('./screens/SignupScreen'));

// Hardware Back Button Manager for Android (Capacitor)
const BackButtonManager = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = CapApp.addListener('backButton', () => {
      const path = location.pathname;

      if (path === '/' || path === '/login' || path === '/signup') {
        // Exit app on root screens
        CapApp.exitApp();
        return;
      }

      if (path === '/order-success' || path === '/gallery' || path === '/profile') {
        navigate('/', { replace: true });
        return;
      }

      // Default back navigation
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
      } else {
        navigate('/', { replace: true });
      }
    });

    return () => {
      handleBackButton.then((handler) => handler.remove());
    };
  }, [location.pathname, navigate]);

  return null;
};

// Main App Navigation router switcher
const AppRoutes = () => {
  useEffect(() => {
    // Hide native splash screen once React mounts
    SplashScreen.hide().catch(() => {});
  }, []);

  return (
    <>
      <BackButtonManager />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />

          {/* Protected Tab / Navigation Routes */}
          <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><GalleryScreen /></ProtectedRoute>} />
          <Route path="/artwork/:id" element={<ProtectedRoute><ArtworkDetailScreen /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
          <Route path="/custom-order" element={<ProtectedRoute><CustomOrderScreen /></ProtectedRoute>} />
          <Route path="/order-success" element={<ProtectedRoute><OrderSuccessScreen /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrdersScreen /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><PaymentScreen /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfileScreen /></ProtectedRoute>} />
          <Route path="/artist" element={<ProtectedRoute><ArtistProfileScreen /></ProtectedRoute>} />

          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
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
