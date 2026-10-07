import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api.js';
import { markIntroSeen } from '../utils/intro.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());
  const [meta, setMeta] = useState(null); // { roles, axes, forms }
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (tokenStore.get()) {
      api.me()
        .then((d) => setUser(d.user))
        .catch(() => logout())
        .finally(() => setLoading(false));
    }
    api.forms().then(setMeta).catch(() => {});
  }, [logout]);

  const signIn = useCallback(({ token, user: u }) => {
    tokenStore.set(token);
    markIntroSeen();
    setUser(u);
  }, []);

  /** Mostra o aviso verde (sucesso) ou vermelho (falha) das telas. */
  const notify = useCallback((type = 'success', message) => {
    clearTimeout(toastTimer.current);
    setToast({ type, message, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, signIn, logout, meta, toast, notify, closeToast: () => setToast(null) }),
    [user, loading, signIn, logout, meta, toast, notify],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
