import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api.js';
import { markIntroSeen } from '../utils/intro.js';
import { applyTheme, storedTheme } from '../utils/theme.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());
  const [meta, setMeta] = useState(null); // { roles, axes, forms }
  const [toast, setToast] = useState(null);
  const [theme, setThemeState] = useState(() => applyTheme(storedTheme() || 'light'));
  const toastTimer = useRef();

  /** Atualiza o usuário e aplica o tema salvo na conta dele. */
  const setUser = useCallback((u) => {
    setUserState(u);
    const t = u?.preferences?.theme;
    if (t) setThemeState(applyTheme(t));
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUserState(null);
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
  }, [logout, setUser]);

  const signIn = useCallback(({ token, user: u }) => {
    tokenStore.set(token);
    markIntroSeen();
    setUser(u);
  }, [setUser]);

  /** Mostra o aviso verde (sucesso) ou vermelho (falha) das telas. */
  const notify = useCallback((type = 'success', message) => {
    clearTimeout(toastTimer.current);
    setToast({ type, message, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  /**
   * Troca o tema: aplica na hora, lembra no navegador e salva na conta.
   * Se não conseguir salvar na conta, volta ao tema anterior.
   */
  const setTheme = useCallback(async (next) => {
    const previous = theme;
    setThemeState(applyTheme(next));
    if (!tokenStore.get()) return true;
    try {
      const { user: u } = await api.updatePreferences({ theme: next });
      setUserState(u);
      return true;
    } catch {
      setThemeState(applyTheme(previous));
      return false;
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      user, setUser, loading, signIn, logout, meta, toast, notify, closeToast: () => setToast(null), theme, setTheme,
    }),
    [user, setUser, loading, signIn, logout, meta, toast, notify, theme, setTheme],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
