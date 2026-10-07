// Geração do PDF da ficha completa (botão "Download em PDF").
import fs from 'node:fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { AXES } from './forms.js';

// Logo (mesmo Vector.svg do frontend): lemos os <path> e desenhamos como vetor no PDF.
const LOGO_SVG = fs.readFileSync(new URL('./assets/logo.svg', import.meta.url), 'utf8');
const LOGO_WIDTH = Number(/width="([\d.]+)"/.exec(LOGO_SVG)[1]);
const LOGO_HEIGHT = Number(/height="([\d.]+)"/.exec(LOGO_SVG)[1]);
const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const LOGO_PATHS = [...LOGO_SVG.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\bfill="(#[0-9A-Fa-f]{6})"/g)]
  .map(([, d, fill]) => ({ d, color: hexToRgb(fill) }));

const GREEN = rgb(0x24 / 255, 0x63 / 255, 0x17 / 255);
const DARK = rgb(0x16 / 255, 0x19 / 255, 0x25 / 255);
const GRAY = rgb(0x85 / 255, 0x85 / 255, 0x85 / 255);
const TZ = process.env.APP_TIMEZONE || 'America/Fortaleza';

const fmtDate = (iso) => {
  if (!iso) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso.split('-').reverse().join('/');
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ });
};

export async function buildRecordPdf(patient) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Ficha - ${patient.fullName}`);
  pdf.setAuthor('DesospIdoso');
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28; const H = 841.89; const M = 50; const maxW = W - 2 * M;
  let page = pdf.addPage([W, H]);
  let y = H - M;

  const newPageIfNeeded = (needed) => {
    if (y - needed < M) {
      page = pdf.addPage([W, H]);
      y = H - M;
    }
  };

  const wrap = (text, font, size, width) => {
    const words = String(text).replace(/\s+/g, ' ').split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > width && line) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };

  const text = (str, { font = regular, size = 10, color = DARK, indent = 0, gap = 4 } = {}) => {
    for (const line of wrap(str, font, size, maxW - indent)) {
      newPageIfNeeded(size + gap);
      page.drawText(line, { x: M + indent, y: y - size, size, font, color });
      y -= size + gap;
    }
  };

  const heading = (str) => {
    newPageIfNeeded(40);
    y -= 10;
    text(str, { font: bold, size: 13 });
    page.drawLine({ start: { x: M, y: y - 2 }, end: { x: W - M, y: y - 2 }, thickness: 1, color: DARK });
    y -= 12;
  };

  // Cabeçalho com a logo
  const logoScale = 150 / LOGO_WIDTH;
  for (const p of LOGO_PATHS) page.drawSvgPath(p.d, { x: M, y, scale: logoScale, color: p.color });
  y -= LOGO_HEIGHT * logoScale + 16;
  text('Ficha completa do paciente', { font: bold, size: 12 });
  text(`Gerada em ${new Date().toLocaleString('pt-BR', { timeZone: TZ })}`, { size: 9, color: GRAY });

  heading('Identificação');
  text(`ID ${patient.code}`, { color: GRAY });
  const idRows = [
    ['Nome completo', patient.fullName],
    ['Data de nascimento', fmtDate(patient.birthDate)],
    ['Hospital', patient.hospital],
    ['Enfermaria', patient.ward],
    ['Leito', patient.bed],
    ['Eixo de internação', AXES[patient.axis] || patient.axis],
    ['Criado em', `${fmtDate(patient.createdAt)}${patient.createdByName ? ` por ${patient.createdByName}` : ''}`],
  ];
  for (const [k, v] of idRows) text(`${k}: ${v}`);

  heading('Dados específicos do paciente por função');
  for (const s of patient.sections) {
    newPageIfNeeded(50);
    y -= 6;
    text(s.title, { font: bold, size: 11, color: GREEN });
    if (!s.done) {
      text('Seção ainda não preenchida.', { color: GRAY });
      continue;
    }
    text(`Preenchido em ${fmtDate(s.updatedAt || s.createdAt)} por ${s.filledByName || '-'}`, { size: 9, color: GRAY });
    for (const b of s.display) {
      if (b.question) {
        y -= 3;
        text(`• ${b.question}`, { font: bold, size: 10 });
      }
      if (b.subtitle) text(b.subtitle, { font: bold, size: 9.5, indent: 10 });
      for (const l of b.lines) text(l, { indent: 10 });
      for (const e of b.extras) text(`${e.label}: ${e.value}`, { indent: 10 });
    }
  }

  return pdf.save();
}
