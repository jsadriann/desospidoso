// Preferências de exibição (Perfil > Preferências). Ficam na conta do usuário e também no navegador,
// para serem aplicadas antes da página aparecer. Cada uma vira um atributo no <html> que o CSS usa:
//   data-text="grande" | "muito-grande"   -> tamanho do texto (a tela inteira cresce proporcionalmente)
//   data-contrast="high"                  -> alto contraste
//   data-motion="reduce"                  -> sem animações
const KEY = 'desospidoso.prefs';

export const PREF_DEFAULTS = {
  textSize: 'normal', highContrast: false, reduceMotion: false, confirmSave: true, listStatus: '', listSort: 'recente',
};

export function storedPrefs() {
  try {
    return { ...PREF_DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...PREF_DEFAULTS };
  }
}

/** Aplica as preferências de exibição na página e lembra no navegador. Devolve o objeto completo. */
export function applyPrefs(prefs) {
  const p = { ...PREF_DEFAULTS, ...prefs };
  const root = document.documentElement;
  const set = (name, value) => (value ? root.setAttribute(name, value) : root.removeAttribute(name));
  set('data-text', p.textSize !== 'normal' ? p.textSize : '');
  set('data-contrast', p.highContrast ? 'high' : '');
  set('data-motion', p.reduceMotion ? 'reduce' : '');
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* navegação privada: aplica, mas não lembra neste navegador */
  }
  return p;
}
