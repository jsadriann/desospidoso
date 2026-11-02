// Tema claro/escuro. A escolha fica na conta do usuário (banco) e também no navegador,
// para ser aplicada antes da página aparecer (sem "piscar" no tema errado).
const KEY = 'desospidoso.theme';
export const THEMES = ['light', 'dark'];

export function storedTheme() {
  try {
    const t = localStorage.getItem(KEY);
    return THEMES.includes(t) ? t : null;
  } catch {
    return null;
  }
}

/** Aplica o tema na página e lembra no navegador. */
export function applyTheme(theme) {
  const t = THEMES.includes(theme) ? theme : 'light';
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
    localStorage.setItem(KEY, t);
  } catch {
    /* navegação privada: aplica, mas não lembra neste navegador */
  }
  return t;
}
