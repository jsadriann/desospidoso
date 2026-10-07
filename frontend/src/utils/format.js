// Datas e textos de apoio usados nos cartões e detalhes.

const pad = (n) => String(n).padStart(2, '0');

/** "1944-07-10" ou ISO completo -> "10/07/1944" */
export function formatDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split('-').reverse().join('/');
  const d = new Date(value);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Diferença em dias de calendário entre a data e hoje. */
function daysAgo(iso) {
  const d = new Date(iso);
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const t = new Date();
  const b = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((b - a) / 86_400_000);
}

/** "hoje" | "ontem" | "anteontem" | "dia 20/09/2026" (regras da tela de Ajuda). */
export function relativeDay(iso) {
  const n = daysAgo(iso);
  if (n <= 0) return 'hoje';
  if (n === 1) return 'ontem';
  if (n === 2) return 'anteontem';
  return `dia ${formatDate(iso)}`;
}

const ACTIONS = { CREATED: 'Criado', UPDATED: 'Atualizado', RESTORED: 'Restaurado', DELETED: 'Excluído' };

/** Texto do canto inferior direito do cartão: "Atualizado hoje", "Criado dia 20/09/2026"... */
export function lastActionLabel(action, at) {
  return `${ACTIONS[action] || 'Atualizado'} ${relativeDay(at)}`;
}

/** "Criado hoje dia 27/09/2026 por Anna da Silva" */
export function createdLine(iso, by, verb = 'Criado') {
  if (!iso) return '';
  const rel = relativeDay(iso);
  const when = rel.startsWith('dia') ? rel : `${rel} dia ${formatDate(iso)}`;
  return `${verb} ${when}${by ? ` por ${by}` : ''}`;
}

/** Converte um arquivo de imagem em data URL reduzida (para a foto de perfil). */
export function resizeImage(file, size = 320) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, size / Math.min(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
