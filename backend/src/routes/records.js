// "Fichas completas": arquivos de paciente com todas as seções preenchidas.
import { Router } from 'express';
import { ah } from '../db.js';
import { requireAuth } from '../auth.js';
import { listPatients } from '../patients.js';

const router = Router();
router.use(requireAuth);

// GET /api/records?q=texto
router.get('/', ah(async (req, res) => {
  res.json({ records: await listPatients({ filter: 'completos', q: req.query.q, user: req.user }) });
}));

export default router;
