import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api.js';
import { markIntroSeen } from '../utils/intro.js';
import { applyTheme, onDeviceThemeChange, storedTheme } from '../utils/theme.js';
import { applyPrefs, storedPrefs } from '../utils/prefs.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());
  const [meta, setMeta] = useState(null); // { roles, axes, forms }
  const [toast, setToast] = useState(null);
  // themePref: o que o usuário escolheu ('light' | 'dark' | 'system'); theme: o que aparece na tela
  const [themePref, setThemePref] = useState(() => storedTheme() || 'light');
  const [theme, setThemeState] = useState(() => applyTheme(storedTheme() || 'light'));
  const toastTimer = useRef();
  // Demais preferências: tamanho do texto, contraste, animações, lista de pacientes, confirmação ao salvar
  const [prefs, setPrefsState] = useState(() => applyPrefs(storedPrefs()));

  /** Aplica uma preferência de tema e guarda os dois estados. */
  const applyPref = useCallback((pref) => {
    setThemePref(pref);
    setThemeState(applyTheme(pref));
  }, []);

  // Seguindo o dispositivo: quando o celular/computador troca de tema, o app acompanha na hora
  useEffect(() => (themePref === 'system' ? onDeviceThemeChange(() => setThemeState(applyTheme('system'))) : undefined), [themePref]);

  /** Atualiza o usuário e aplica o tema salvo na conta dele. */
  const setUser = useCallback((u) => {
    setUserState(u);
    const t = u?.preferences?.theme;
    if (t) applyPref(t);
    if (u?.preferences) {
      const { theme: _theme, ...rest } = u.preferences;
      setPrefsState(applyPrefs(rest));
    }
  }, [applyPref]);

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
   * Troca a preferência de tema ('light' | 'dark' | 'system'): aplica na hora, lembra no navegador e salva na conta.
   * Se não conseguir salvar na conta, volta ao tema anterior.
   */
  const setTheme = useCallback(async (next) => {
    const previous = themePref;
    applyPref(next);
    if (!tokenStore.get()) return true;
    try {
      const { user: u } = await api.updatePreferences({ theme: next });
      setUserState(u);
      return true;
    } catch {
      applyPref(previous);
      return false;
    }
  }, [themePref, applyPref]);

  /**
   * Muda uma ou mais preferências ({ textSize: 'grande' }, { reduceMotion: true }...): aplica na hora,
   * lembra no navegador e salva na conta. Se não conseguir salvar, volta ao que era.
   */
  const updatePrefs = useCallback(async (patch) => {
    const previous = prefs;
    setPrefsState(applyPrefs({ ...prefs, ...patch }));
    if (!tokenStore.get()) return true;
    try {
      const { user: u } = await api.updatePreferences(patch);
      setUserState(u);
      return true;
    } catch {
      setPrefsState(applyPrefs(previous));
      return false;
    }
  }, [prefs]);

  const value = useMemo(
    () => ({
      user, setUser, loading, signIn, logout, meta, toast, notify, closeToast: () => setToast(null), theme, themePref, setTheme, prefs, updatePrefs,
    }),
    [user, setUser, loading, signIn, logout, meta, toast, notify, theme, themePref, setTheme, prefs, updatePrefs],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
