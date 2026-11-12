import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
  }, []);

  // Kurung kurawal penting: setUnauthorizedHandler mengembalikan `logout`, yang tanpa ini dianggap React sebagai cleanup.
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const login = useCallback(async (username, password) => {
    const { token: newToken } = await api.login(username, password);
    setToken(newToken);
    setTokenState(newToken);
  }, []);

  const value = useMemo(() => ({ token, login, logout }), [token, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
