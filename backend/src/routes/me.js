import { Router } from 'express';
import { ah, one, transaction } from '../db.js';
import { ROLES } from '../forms.js';
import { findUserById, hashPassword, passwordProblem, publicUser, requireAuth } from '../auth.js';
import { deleteObject, parseImage, purgeSoon, uploadAvatar } from '../storage.js';

const router = Router();
router.use(requireAuth);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/me
router.get('/', (req, res) => res.json({ user: publicUser(req.user) }));

// PUT /api/me  { name, email, role, password?, confirmPassword? }
// (a foto tem rotas próprias: PUT/DELETE /api/me/avatar)
router.put('/', ah(async (req, res) => {
  const { name, email, role, password, confirmPassword } = req.body || {};
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

  await one(
    `UPDATE users SET name = $1, email = $2, role = $3, password_hash = $4, updated_at = now()
      WHERE id = $5`,
    [name.trim(), email.trim().toLowerCase(), role, passwordHash, req.user.id],
  );
  res.json({ user: publicUser(await findUserById(req.user.id)) });
}));

// PUT /api/me/avatar  { image: "data:image/jpeg;base64,..." }  -> envia ou troca a foto de perfil
// O arquivo vai para o Object Storage do Neon; a foto anterior é apagada do bucket.
router.put('/avatar', ah(async (req, res) => {
  const image = parseImage(req.body?.image);
  const key = await uploadAvatar(image);
  try {
    await transaction(async (tx) => {
      await tx.one(
        `INSERT INTO user_avatars (user_id, object_key, content_type, size_bytes) VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE
           SET object_key = EXCLUDED.object_key, content_type = EXCLUDED.content_type,
               size_bytes = EXCLUDED.size_bytes, created_at = now()`,
        [req.user.id, key, image.contentType, image.buffer.length],
      );
      await tx.one('UPDATE users SET avatar = NULL, updated_at = now() WHERE id = $1', [req.user.id]);
    });
  } catch (err) {
    await deleteObject(key).catch(() => {}); // não deixa arquivo solto no bucket
    throw err;
  }
  purgeSoon(); // apaga a foto anterior
  res.json({ user: publicUser(await findUserById(req.user.id)) });
}));

// DELETE /api/me/avatar  -> remove a foto de perfil
router.delete('/avatar', ah(async (req, res) => {
  await one('DELETE FROM user_avatars WHERE user_id = $1', [req.user.id]);
  await one('UPDATE users SET avatar = NULL, updated_at = now() WHERE id = $1', [req.user.id]);
  purgeSoon();
  res.json({ user: publicUser(await findUserById(req.user.id)) });
}));

// PUT /api/me/preferences  { theme: 'light' | 'dark' }  -> Perfil > Preferências
const THEMES = ['light', 'dark'];
router.put('/preferences', ah(async (req, res) => {
  const { theme } = req.body || {};
  if (!THEMES.includes(theme)) return res.status(400).json({ error: 'Tema inválido.' });
  await one('UPDATE users SET theme = $1, updated_at = now() WHERE id = $2', [theme, req.user.id]);
  res.json({ user: publicUser(await findUserById(req.user.id)) });
}));

// DELETE /api/me  -> "Deletar conta" (a ação não pode ser desfeita)
// Os arquivos de paciente continuam existindo; o nome de quem preencheu fica registrado.
// A foto de perfil sai junto: user_avatars tem ON DELETE CASCADE e o gatilho do banco
// manda o arquivo para a fila de exclusão, que é processada logo em seguida.
router.delete('/', ah(async (req, res) => {
  await one('DELETE FROM users WHERE id = $1', [req.user.id]);
  purgeSoon();
  res.status(204).end();
}));

export default router;
