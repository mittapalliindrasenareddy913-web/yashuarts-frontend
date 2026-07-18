import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const profileStr = localStorage.getItem('yashuarts_profile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        setSession({ token: profile.token });
        setUser({
          id: profile._id,
          email: profile.email,
          role: profile.role,
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || '',
          mobile_number: profile.mobile_number || ''
        });
      } catch (e) {
        localStorage.removeItem('yashuarts_profile');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email, password) => {
    try {
      const data = await api.auth.login(email, password);
      setSession({ token: data.token });
      setUser({
        id: data._id,
        email: data.email,
        role: data.role,
        full_name: data.full_name || '',
        avatar_url: data.avatar_url || ''
      });
      return { error: null };
    } catch (e) {
      return { error: { message: e.message || 'Login failed' } };
    }
  };

  const adminSignIn = async (email, password) => {
    try {
      const data = await api.auth.adminLogin(email, password);
      setSession({ token: data.token });
      setUser({
        id: data._id,
        email: data.email,
        role: data.role,
        full_name: data.full_name || '',
        avatar_url: data.avatar_url || ''
      });
      return { error: null };
    } catch (e) {
      throw e;
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      const data = await api.auth.register(email, password, fullName);
      setSession({ token: data.token });
      setUser({
        id: data._id,
        email: data.email,
        role: data.role,
        full_name: data.full_name || '',
        avatar_url: data.avatar_url || ''
      });
      return { error: null };
    } catch (e) {
      return { error: { message: e.message || 'Signup failed' } };
    }
  };

  const signOut = async () => {
    api.auth.logout();
    setSession(null);
    setUser(null);
  };

  const updateUser = (updateData) => {
    setUser((currUser) => {
      if (!currUser) return currUser;
      const updated = { ...currUser, ...updateData };
      const profileStr = localStorage.getItem('yashuarts_profile');
      if (profileStr) {
        try {
          const profile = JSON.parse(profileStr);
          localStorage.setItem('yashuarts_profile', JSON.stringify({ ...profile, ...updateData }));
        } catch (e) {}
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        adminSignIn,
        signUp,
        signOut,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
