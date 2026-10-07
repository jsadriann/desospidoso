import { Router } from 'express';
import { ah, one, transaction } from '../db.js';
import { requireAuth } from '../auth.js';
import { ROLES, validateAnswers } from '../forms.js';
import {
  generateCode, getPatientDetail, getPatientRow, listPatients, refreshCompletion, touch, validateIdentification,
} from '../patients.js';
import { buildRecordPdf } from '../pdf.js';

const router = Router();
router.use(requireAuth);

const FILTERS = ['todos', 'recentes', 'lixeira', 'selecionaveis', 'selecionaveis_recentes'];
const NOT_FOUND = { error: 'Paciente não encontrado.' };
const IN_TRASH = { error: 'Restaure o arquivo da lixeira antes de editá-lo.' };

// GET /api/patients?filter=todos|recentes|lixeira|selecionaveis|selecionaveis_recentes&q=texto
router.get('/', ah(async (req, res) => {
  const filter = FILTERS.includes(req.query.filter) ? req.query.filter : 'todos';
  res.json({ patients: await listPatients({ filter, q: req.query.q, user: req.user }) });
}));

// POST /api/patients  -> nova identificação de paciente (Etapa 1)
router.post('/', ah(async (req, res) => {
  const { fields, error } = validateIdentification(req.body);
  if (error) return res.status(400).json({ error });
  const row = await one(
    `INSERT INTO patients (code, full_name, birth_date, hospital, ward, bed, axis, created_by, created_by_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [await generateCode(), fields.fullName, fields.birthDate, fields.hospital, fields.ward, fields.bed, fields.axis,
      req.user.id, req.user.name],
  );
  res.status(201).json({ patient: await getPatientDetail(row.id, req.user) });
}));

// GET /api/patients/:id
router.get('/:id', ah(async (req, res) => {
  const patient = await getPatientDetail(req.params.id, req.user);
  if (!patient) return res.status(404).json(NOT_FOUND);
  res.json({ patient });
}));

// PUT /api/patients/:id  -> editar identificação
router.put('/:id', ah(async (req, res) => {
  const p = await getPatientRow(req.params.id);
  if (!p) return res.status(404).json(NOT_FOUND);
  if (p.deleted_at) return res.status(409).json(IN_TRASH);
  const { fields, error } = validateIdentification(req.body);
  if (error) return res.status(400).json({ error });
  await one(
    'UPDATE patients SET full_name = $1, birth_date = $2, hospital = $3, ward = $4, bed = $5, axis = $6 WHERE id = $7',
    [fields.fullName, fields.birthDate, fields.hospital, fields.ward, fields.bed, fields.axis, p.id],
  );
  await touch(p.id, 'UPDATED');
  res.json({ patient: await getPatientDetail(p.id, req.user) });
}));

// PUT /api/patients/:id/sections/:role  { answers }
// Cada profissional só preenche/edita a seção da sua função.
router.put('/:id/sections/:role', ah(async (req, res) => {
  const { role } = req.params;
  if (!ROLES[role]) return res.status(404).json({ error: 'Seção não encontrada.' });
  if (role !== req.user.role) {
    return res.status(403).json({ error: 'Você só pode preencher a seção da sua função.' });
  }
  const p = await getPatientRow(req.params.id);
  if (!p) return res.status(404).json(NOT_FOUND);
  if (p.deleted_at) return res.status(409).json(IN_TRASH);

  const { errors, clean } = validateAnswers(role, req.body?.answers || {});
  if (errors.length) {
    return res.status(400).json({ error: 'Por favor, preencha todos os campos antes de continuar.', details: errors });
  }
  await transaction(async (tx) => {
    await tx.one(
      `INSERT INTO sections (patient_id, role, answers, filled_by, filled_by_name)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       ON CONFLICT (patient_id, role) DO UPDATE
         SET answers = EXCLUDED.answers, filled_by = EXCLUDED.filled_by,
             filled_by_name = EXCLUDED.filled_by_name, updated_at = now()`,
      [p.id, role, JSON.stringify(clean), req.user.id, req.user.name],
    );
    await touch(p.id, 'UPDATED', tx);
    await refreshCompletion(p.id, tx);
  });
  res.json({ patient: await getPatientDetail(p.id, req.user) });
}));

// DELETE /api/patients/:id  -> mover para a lixeira
router.delete('/:id', ah(async (req, res) => {
  const p = await getPatientRow(req.params.id);
  if (!p) return res.status(404).json(NOT_FOUND);
  if (!p.deleted_at) {
    await one('UPDATE patients SET deleted_at = now() WHERE id = $1', [p.id]);
    await touch(p.id, 'DELETED');
  }
  res.json({ patient: await getPatientDetail(p.id, req.user) });
}));

// POST /api/patients/:id/restore  -> restaurar da lixeira
router.post('/:id/restore', ah(async (req, res) => {
  const p = await getPatientRow(req.params.id);
  if (!p) return res.status(404).json(NOT_FOUND);
  if (p.deleted_at) {
    await one('UPDATE patients SET deleted_at = NULL WHERE id = $1', [p.id]);
    await touch(p.id, 'RESTORED');
  }
  res.json({ patient: await getPatientDetail(p.id, req.user) });
}));

// GET /api/patients/:id/pdf  -> "Download em PDF" da ficha
router.get('/:id/pdf', ah(async (req, res) => {
  const patient = await getPatientDetail(req.params.id, req.user);
  if (!patient) return res.status(404).json(NOT_FOUND);
  const bytes = await buildRecordPdf(patient);
  const name = `ficha-${patient.code}-${patient.fullName.normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase()}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  res.send(Buffer.from(bytes));
}));

export default router;
