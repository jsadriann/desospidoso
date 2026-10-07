import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { one } from './db.js';

// ---- Senhas (scrypt nativo do Node, sem dependências nativas) ----
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(hash, 'hex');
  return original.length === test.length && crypto.timingSafeEqual(original, test);
}

/** Regra da tela de redefinição: mínimo 8 caracteres e ao menos um caractere especial. */
export function passwordProblem(password) {
  if (!password || password.length < 8) return 'A senha deve conter no mínimo 8 caracteres.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'A senha deve conter ao menos um caractere especial.';
  return null;
}

// ---- Tokens ----
export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, { expiresIn: '7d' });
}

export function signResetToken(resetId) {
  return jwt.sign({ rid: resetId, typ: 'reset' }, config.jwtSecret, { expiresIn: '15m' });
}

export function verifyResetToken(token) {
  const payload = jwt.verify(token, config.jwtSecret);
  if (payload.typ !== 'reset') throw new Error('invalid');
  return payload.rid;
}

// Usuário + chave da foto de perfil (tabela user_avatars).
const USER_SQL = `SELECT u.*, a.object_key AS avatar_key
                    FROM users u LEFT JOIN user_avatars a ON a.user_id = u.id`;
export const findUserById = (id) => one(`${USER_SQL} WHERE u.id = $1`, [id]);
export const findUserByEmail = (email) => one(`${USER_SQL} WHERE lower(u.email) = lower($1)`, [String(email).trim()]);

/** Endereço público da foto: /api/avatars/<uuid>.jpg (nome novo a cada envio, então pode ficar em cache). */
function avatarUrl(u) {
  if (u.avatar_key) return `/api/${u.avatar_key}`;
  if (u.avatar?.startsWith('data:image/')) return u.avatar; // foto antiga, antes do Object Storage
  return null;
}

export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id, name: u.name, email: u.email, role: u.role, avatar: avatarUrl(u), createdAt: u.created_at,
    preferences: { theme: u.theme || 'light' },
  };
}

/** Middleware: exige "Authorization: Bearer <token>". Coloca o usuário em req.user. */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
    if (payload.typ) throw new Error('wrong token type');
  } catch {
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }
  try {
    const user = await findUserById(Number(payload.sub));
    if (!user) return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    req.user = user;
    return next();
  } catch (err) {
    return next(err); // erro de banco -> 500 (não desloga o usuário)
  }
}
