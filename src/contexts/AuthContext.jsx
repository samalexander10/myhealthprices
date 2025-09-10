import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, authenticated: false, user: null });
  useEffect(() => {
    axios.get('/auth/me', { withCredentials: true }).then(res => {
      setState({ loading: false, authenticated: !!res.data.authenticated, user: res.data.user || null });
    }).catch(() => setState({ loading: false, authenticated: false, user: null }));
  }, []);
  const login = () => {
    window.location.href = '/auth/google';
  };
  const logout = async () => {
    await axios.post('/auth/logout', {}, { withCredentials: true });
    window.location.href = '/';
  };
  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
