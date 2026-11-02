// Tema claro/escuro. A escolha fica na conta do usuário (banco) e também no navegador,
// para ser aplicada antes da página aparecer (sem "piscar" no tema errado).
// Preferência: 'light' | 'dark' | 'system' ('system' = seguir o tema do dispositivo).
const KEY = 'desospidoso.theme';
export const THEMES = ['light', 'dark'];
export const PREFS = ['light', 'dark', 'system'];

const media = () => window.matchMedia?.('(prefers-color-scheme: dark)');

/** Tema do dispositivo agora ('light' ou 'dark'). */
export const deviceTheme = () => (media()?.matches ? 'dark' : 'light');

/** Tema que de fato aparece na tela para uma preferência. */
export const resolveTheme = (pref) => (pref === 'system' ? deviceTheme() : (THEMES.includes(pref) ? pref : 'light'));

export function storedTheme() {
  try {
    const t = localStorage.getItem(KEY);
    return PREFS.includes(t) ? t : null;
  } catch {
    return null;
  }
}

/** Aplica a preferência na página, lembra no navegador e devolve o tema que ficou na tela. */
export function applyTheme(pref) {
  const p = PREFS.includes(pref) ? pref : 'light';
  const t = resolveTheme(p);
  const root = document.documentElement;
  // Ao trocar de tema, as cores mudam suavemente (classe removida logo depois)
  if (root.dataset.theme && root.dataset.theme !== t) {
    root.classList.add('theme-switching');
    clearTimeout(applyTheme.timer);
    applyTheme.timer = setTimeout(() => root.classList.remove('theme-switching'), 450);
  }
  root.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#111318' : '#246317');
  try {
    localStorage.setItem(KEY, p);
  } catch {
    /* navegação privada: aplica, mas não lembra neste navegador */
  }
  return t;
}

/** Avisa quando o tema do dispositivo muda (retorna a função para parar de ouvir). */
export function onDeviceThemeChange(fn) {
  const m = media();
  if (!m) return () => {};
  m.addEventListener('change', fn);
  return () => m.removeEventListener('change', fn);
}
