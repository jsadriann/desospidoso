import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { ah, one, query } from './db.js';
import { StorageError, downloadObject } from './storage.js';
import { FORMS, ROLES, AXES } from './forms.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import patientRoutes from './routes/patients.js';
import recordRoutes from './routes/records.js';

export const app = express();

app.use(cors({ origin: config.frontendUrl.split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '4mb' })); // foto de perfil chega como data URL (até 2 MB)

// Verifica a API e a conexão com o banco (Neon)
app.get('/api/health', ah(async (req, res) => {
  await query('SELECT 1');
  res.json({ ok: true, database: 'ok' });
}));

// Funções, eixos e questionários (fonte única para o frontend)
app.get('/api/forms', (req, res) => res.json({ roles: ROLES, axes: AXES, forms: FORMS }));

// Foto de perfil, lida do Object Storage do Neon. O nome do arquivo é um UUID novo a cada
// envio e só é servido enquanto estiver ligado a uma conta, por isso pode ficar em cache.
app.get('/api/avatars/:file', ah(async (req, res) => {
  const key = `avatars/${req.params.file}`;
  const avatar = await one('SELECT content_type FROM user_avatars WHERE object_key = $1', [key]);
  const body = avatar && await downloadObject(key);
  if (!body) return res.status(404).json({ error: 'Foto não encontrada.' });
  res.setHeader('Content-Type', avatar.content_type);
  res.setHeader('Content-Length', body.length);
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(body);
}));

app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// ---- Frontend (produção) ----
// Depois de "npm run build" na raiz, as telas do React ficam em frontend/dist e são
// servidas por esta mesma API: um único endereço para site + API (ex.: no Render).
const FRONTEND_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (fs.existsSync(path.join(FRONTEND_DIST, 'index.html'))) {
  // Arquivos com hash no nome (assets/) podem ficar em cache por 1 ano; o resto é revalidado.
  app.use('/assets', express.static(path.join(FRONTEND_DIST, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(FRONTEND_DIST, { index: false, maxAge: '1h' }));
  // Qualquer outra rota (ex.: /pacientes/3) abre o app React, que cuida da navegação.
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// Tratamento de erros inesperados
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Arquivo muito grande.' });
  if (err instanceof StorageError) return res.status(err.status).json({ error: err.message });
  // E-mail duplicado (índice único) em cadastros simultâneos
  if (err?.code === '23505' && String(err.constraint).includes('email')) {
    return res.status(409).json({ error: 'Este endereço de e-mail já está cadastrado. Utilize um diferente para prosseguir.' });
  }
  // Banco indisponível (Neon fora do ar, sem internet, credenciais erradas)
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', '28P01', '3D000'].includes(err?.code)
    || /timeout|Connection terminated/i.test(err?.message || '')) {
    console.error('[db]', err.message);
    return res.status(503).json({ error: 'Não foi possível conectar ao banco de dados. Tente novamente em instantes.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Não foi possível concluir a operação. Tente novamente.' });
});
