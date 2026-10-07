import { Router } from 'express';
import crypto from 'node:crypto';
import { ah, one } from '../db.js';
import { config } from '../config.js';
import { ROLES } from '../forms.js';
import {
  hashPassword, verifyPassword, passwordProblem, signToken, signResetToken, verifyResetToken, publicUser,
} from '../auth.js';
import { sendResetCode } from '../mailer.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FILL_ALL = 'Por favor, preencha todos os campos antes de continuar.';
const EMAIL_TAKEN = 'Este endereço de e-mail já está cadastrado. Utilize um diferente para prosseguir.';

const findByEmail = (email) => one('SELECT * FROM users WHERE lower(email) = lower($1)', [email.trim()]);

// POST /api/auth/register  { name, email, password, confirmPassword, role }
router.post('/register', ah(async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password || !confirmPassword || !role) {
    return res.status(400).json({ error: FILL_ALL });
  }
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Informe um e-mail válido.' });
  if (!ROLES[role]) return res.status(400).json({ error: 'Selecione uma função válida.' });
  if (password !== confirmPassword) return res.status(400).json({ error: 'As senhas não coincidem.' });
  const problem = passwordProblem(password);
  if (problem) return res.status(400).json({ error: problem });

  if (await findByEmail(email)) return res.status(409).json({ error: EMAIL_TAKEN });
  const user = await one(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [name.trim(), email.trim().toLowerCase(), hashPassword(password), role],
  );
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

// POST /api/auth/login  { email, password }
router.post('/login', ah(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email?.trim() || !password) return res.status(400).json({ error: FILL_ALL });
  const user = await findByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos, tente novamente, por favor.' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

// ---- Esqueci minha senha (3 passos) ----

// 1) POST /api/auth/forgot-password  { email }
router.post('/forgot-password', ah(async (req, res) => {
  const { email } = req.body || {};
  if (!email?.trim()) return res.status(400).json({ error: FILL_ALL });
  const user = await findByEmail(email);
  // Resposta igual exista ou não o e-mail (não revela quem tem conta).
  if (user) {
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    const expires = new Date(Date.now() + config.resetCodeMinutes * 60_000);
    await one('UPDATE password_resets SET used = true WHERE user_id = $1 AND used = false', [user.id]);
    await one('INSERT INTO password_resets (user_id, code_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, hashPassword(code), expires]);
    await sendResetCode(user.email, user.name, code);
  }
  res.json({ ok: true });
}));

// 2) POST /api/auth/verify-code  { email, code }  -> { resetToken }
router.post('/verify-code', ah(async (req, res) => {
  const { email, code } = req.body || {};
  if (!email?.trim() || !code?.trim()) return res.status(400).json({ error: FILL_ALL });
  const user = await findByEmail(email);
  const reset = user && await one(
    `SELECT * FROM password_resets
      WHERE user_id = $1 AND used = false AND expires_at > now()
      ORDER BY id DESC LIMIT 1`,
    [user.id],
  );
  if (!reset || !verifyPassword(code.trim(), reset.code_hash)) {
    return res.status(400).json({ error: 'Código inválido ou expirado. Tente novamente ou reenvie o código.' });
  }
  await one('UPDATE password_resets SET verified = true WHERE id = $1', [reset.id]);
  res.json({ resetToken: signResetToken(reset.id) });
}));

// 3) POST /api/auth/reset-password  { resetToken, password, confirmPassword }
router.post('/reset-password', ah(async (req, res) => {
  const { resetToken, password, confirmPassword } = req.body || {};
  if (!resetToken || !password || !confirmPassword) return res.status(400).json({ error: FILL_ALL });
  const expired = 'O prazo para redefinir a senha expirou. Solicite um novo código.';
  let resetId;
  try {
    resetId = verifyResetToken(resetToken);
  } catch {
    return res.status(400).json({ error: expired });
  }
  const reset = await one('SELECT * FROM password_resets WHERE id = $1', [resetId]);
  if (!reset || reset.used || !reset.verified) return res.status(400).json({ error: expired });
  if (password !== confirmPassword) return res.status(400).json({ error: 'As senhas devem coincidir.' });
  const problem = passwordProblem(password);
  if (problem) return res.status(400).json({ error: problem });

  await one('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [hashPassword(password), reset.user_id]);
  await one('UPDATE password_resets SET used = true WHERE id = $1', [reset.id]);
  res.json({ ok: true });
}));

export default router;
