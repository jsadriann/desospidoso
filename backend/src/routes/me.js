import { Router } from 'express';
import { ah, one } from '../db.js';
import { ROLES } from '../forms.js';
import { hashPassword, passwordProblem, publicUser, requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

// GET /api/me
router.get('/', (req, res) => res.json({ user: publicUser(req.user) }));

// PUT /api/me  { name, email, role, password?, confirmPassword?, avatar? }
// avatar: data URL (data:image/...;base64,...) ou null para remover
router.put('/', ah(async (req, res) => {
  const { name, email, role, password, confirmPassword, avatar } = req.body || {};
  if (!name?.trim() || !email?.trim() || !role) {
    return res.status(400).json({ error: 'Por favor, preencha todos os campos antes de continuar.' });
  }
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Informe um e-mail válido.' });
  if (!ROLES[role]) return res.status(400).json({ error: 'Selecione uma função válida.' });

  const other = await one('SELECT id FROM users WHERE lower(email) = lower($1) AND id <> $2', [email.trim(), req.user.id]);
  if (other) {
    return res.status(409).json({ error: 'Este endereço de e-mail já está cadastrado. Utilize um diferente para prosseguir.' });
  }

  let passwordHash = req.user.password_hash;
  if (password) {
    if (password !== confirmPassword) return res.status(400).json({ error: 'As senhas não coincidem.' });
    const problem = passwordProblem(password);
    if (problem) return res.status(400).json({ error: problem });
    passwordHash = hashPassword(password);
  }

  let newAvatar = req.user.avatar;
  if (avatar === null) newAvatar = null;
  else if (typeof avatar === 'string' && avatar !== req.user.avatar) {
    if (!/^data:image\/(png|jpe?g|webp);base64,/.test(avatar)) {
      return res.status(400).json({ error: 'Formato de imagem inválido. Use PNG, JPG ou WEBP.' });
    }
    if (avatar.length * 0.75 > MAX_AVATAR_BYTES) return res.status(400).json({ error: 'A imagem deve ter no máximo 2 MB.' });
    newAvatar = avatar;
  }

  const user = await one(
    `UPDATE users SET name = $1, email = $2, role = $3, password_hash = $4, avatar = $5, updated_at = now()
      WHERE id = $6 RETURNING *`,
    [name.trim(), email.trim().toLowerCase(), role, passwordHash, newAvatar, req.user.id],
  );
  res.json({ user: publicUser(user) });
}));

// DELETE /api/me  -> "Deletar conta" (a ação não pode ser desfeita)
// Os arquivos de paciente continuam existindo; o nome de quem preencheu fica registrado.
router.delete('/', ah(async (req, res) => {
  await one('DELETE FROM users WHERE id = $1', [req.user.id]);
  res.status(204).end();
}));

export default router;
