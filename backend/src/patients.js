// Regras de negócio dos arquivos de paciente (PostgreSQL).
import crypto from 'node:crypto';
import { one, query } from './db.js';
import { config } from './config.js';
import { AXES, FORMS, ROLE_ORDER, TOTAL_SECTIONS, describeAnswers, formByRole } from './forms.js';

const DAY = 86_400_000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);

export async function generateCode() {
  for (let i = 0; i < 50; i++) {
    const code = String(crypto.randomInt(0, 100_000)).padStart(5, '0');
    if (!(await one('SELECT 1 FROM patients WHERE code = $1', [code]))) return code;
  }
  return String(Date.now()).slice(-8);
}

/** Remove definitivamente o que está na lixeira há mais de 30 dias. */
export async function purgeTrash() {
  const rows = await query(
    'DELETE FROM patients WHERE deleted_at IS NOT NULL AND deleted_at < $1 RETURNING id',
    [daysAgo(config.trashRetentionDays)],
  );
  if (rows.length) console.log(`[lixeira] ${rows.length} arquivo(s) excluído(s) permanentemente.`);
}

async function sectionsByPatient(ids) {
  if (ids.length === 0) return new Map();
  const rows = await query('SELECT * FROM sections WHERE patient_id = ANY($1::int[])', [ids]);
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.patient_id)) map.set(r.patient_id, []);
    map.get(r.patient_id).push(r);
  }
  return map;
}

/** Status do arquivo do ponto de vista do usuário logado (ver tela "Ajuda"). */
export function statusFor(doneRoles, userRole) {
  if (doneRoles.size >= TOTAL_SECTIONS) return 'CONCLUIDO';
  if (!doneRoles.has(userRole)) return 'PENDENTE_PARA_VOCE';
  return 'PENDENTE';
}

export function toSummary(p, sections, userRole) {
  const done = new Set(sections.map((s) => s.role));
  return {
    id: p.id,
    code: p.code,
    fullName: p.full_name,
    birthDate: p.birth_date,
    hospital: p.hospital,
    ward: p.ward,
    bed: p.bed,
    axis: p.axis,
    axisLabel: AXES[p.axis] || p.axis,
    createdAt: p.created_at,
    createdByName: p.created_by_name,
    updatedAt: p.updated_at,
    completedAt: p.completed_at,
    deletedAt: p.deleted_at,
    lastAction: p.last_action,
    lastActionAt: p.last_action_at,
    sectionsDone: done.size,
    totalSections: TOTAL_SECTIONS,
    progress: ROLE_ORDER.map((role) => ({ role, done: done.has(role) })),
    status: statusFor(done, userRole),
    myRoleDone: done.has(userRole),
  };
}

/**
 * Lista arquivos de paciente.
 * filter: 'todos' | 'recentes' | 'lixeira' | 'completos' | 'selecionaveis' | 'selecionaveis_recentes'
 */
export async function listPatients({ filter = 'todos', q, user }) {
  const params = [];
  const p = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  let where = 'deleted_at IS NULL';
  if (filter === 'lixeira') {
    await purgeTrash();
    where = 'deleted_at IS NOT NULL';
  } else if (filter === 'recentes') {
    where += ` AND created_at >= ${p(daysAgo(config.recentDays))}`;
  } else if (filter === 'completos') {
    where += ' AND completed_at IS NOT NULL';
  } else if (filter === 'selecionaveis' || filter === 'selecionaveis_recentes') {
    // Etapa 1 do "+ Novo": identificações cuja seção da minha função ainda não foi preenchida
    where += ` AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.patient_id = patients.id AND s.role = ${p(user.role)})`;
    if (filter === 'selecionaveis_recentes') where += ` AND created_at >= ${p(daysAgo(config.recentDays))}`;
  }
  if (q?.trim()) {
    const term = p(`%${q.trim()}%`);
    where += ` AND (full_name ILIKE ${term} OR code ILIKE ${term})`;
  }
  const order = filter === 'lixeira' ? 'deleted_at DESC' : 'last_action_at DESC';
  const rows = await query(`SELECT * FROM patients WHERE ${where} ORDER BY ${order}`, params);
  const secs = await sectionsByPatient(rows.map((r) => r.id));
  return rows.map((row) => toSummary(row, secs.get(row.id) || [], user.role));
}

export async function getPatientRow(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  return one('SELECT * FROM patients WHERE id = $1', [n]);
}

/** Arquivo completo: identificação + seções (com respostas e texto legível). */
export async function getPatientDetail(id, user) {
  const p = await getPatientRow(id);
  if (!p) return null;
  const sections = await query('SELECT * FROM sections WHERE patient_id = $1', [p.id]);
  const byRole = new Map(sections.map((s) => [s.role, s]));
  return {
    ...toSummary(p, sections, user.role),
    sections: FORMS.map((f) => {
      const s = byRole.get(f.role);
      const answers = s ? s.answers : null; // JSONB já vem como objeto
      return {
        role: f.role,
        title: f.title,
        icon: f.icon,
        done: !!s,
        filledByName: s?.filled_by_name || null,
        createdAt: s?.created_at || null,
        updatedAt: s?.updated_at || null,
        answers,
        display: s ? describeAnswers(f.role, answers) : [],
        canEdit: f.role === user.role && !p.deleted_at,
      };
    }),
  };
}

export function validateIdentification(body = {}) {
  const fields = {
    fullName: body.fullName?.trim(),
    birthDate: body.birthDate?.trim(),
    hospital: body.hospital?.trim(),
    ward: body.ward?.toString().trim(),
    bed: body.bed?.toString().trim(),
    axis: body.axis,
  };
  if (Object.values(fields).some((v) => !v)) return { error: 'Por favor, preencha todos os campos antes de continuar.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.birthDate) || Number.isNaN(Date.parse(fields.birthDate))) {
    return { error: 'Informe uma data de nascimento válida.' };
  }
  if (fields.birthDate > new Date().toISOString().slice(0, 10)) {
    return { error: 'A data de nascimento não pode estar no futuro.' };
  }
  if (!AXES[fields.axis]) return { error: 'Selecione o eixo de internação.' };
  return { fields };
}

/** Recalcula a data de conclusão depois que uma seção muda. db: conexão (padrão ou transação). */
export async function refreshCompletion(patientId, db = { one }) {
  const { n } = await db.one('SELECT COUNT(*) AS n FROM sections WHERE patient_id = $1', [patientId]);
  if (n >= TOTAL_SECTIONS) {
    await db.one('UPDATE patients SET completed_at = COALESCE(completed_at, now()) WHERE id = $1', [patientId]);
  } else {
    await db.one('UPDATE patients SET completed_at = NULL WHERE id = $1', [patientId]);
  }
}

/** Registra a última ação (Criado/Atualizado/Restaurado/Excluído) mostrada nos cartões. */
export async function touch(patientId, action, db = { one }) {
  await db.one(
    'UPDATE patients SET last_action = $1, last_action_at = now(), updated_at = now() WHERE id = $2',
    [action, patientId],
  );
}

export { formByRole };
