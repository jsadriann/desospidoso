// Controle da tela de primeiro acesso ("Página inicial").
// Ela aparece só na primeira visita; depois o app abre direto no login.
const KEY = 'desospidoso.introSeen';

export function introSeen() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* navegação privada: apenas segue sem lembrar */
  }
}
