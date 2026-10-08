// Fotos de perfil no Object Storage do Neon (API compatível com S3).
// Credenciais em backend/.env: AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
// e AWS_S3_BUCKET (nome do bucket; padrão "desospidoso").
import crypto from 'node:crypto';
import { config } from './config.js';
import { one, query } from './db.js';

const { endpoint, region, accessKeyId, secretAccessKey, bucket } = config.storage;

// A biblioteca do S3 é carregada só se estiver instalada: sem ela (ex.: esqueceu o "npm install"),
// a API continua funcionando e apenas as fotos ficam desativadas.
let sdk = null;
try {
  sdk = await import('@aws-sdk/client-s3');
} catch {
  console.warn('[fotos] Biblioteca @aws-sdk/client-s3 não instalada. Rode "npm install" na pasta backend.');
}
const {
  CreateBucketCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client,
} = sdk || {};

export const storageEnabled = Boolean(sdk && endpoint && accessKeyId && secretAccessKey);

const s3 = storageEnabled
  ? new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true, // exigido pelo Neon
  })
  : null;

export class StorageError extends Error {
  constructor(message, status = 503) {
    super(message);
    this.status = status;
  }
}

function requireStorage() {
  if (!storageEnabled) {
    throw new StorageError('O armazenamento de fotos não está configurado no servidor.');
  }
}

/** Cria o bucket se ele ainda não existir. Roda ao iniciar a API. */
export async function ensureBucket() {
  if (!storageEnabled) {
    if (sdk) console.warn('[fotos] Object Storage não configurado (AWS_* no .env). Envio de fotos desativado.');
    return;
  }
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (err) {
    if (err?.$metadata?.httpStatusCode !== 404 && err?.name !== 'NotFound') throw err;
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`[fotos] bucket "${bucket}" criado`);
  }
  console.log(`[fotos] Object Storage conectado: ${new URL(endpoint).host}/${bucket}`);
}

// ---- Imagens ----

const SIGNATURES = [
  { type: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/png', ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { type: 'image/webp', ext: 'webp', test: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
];

/**
 * Lê uma imagem enviada como data URL (data:image/jpeg;base64,...).
 * Confere o conteúdo real do arquivo (não só o tipo declarado) e o tamanho.
 */
export function parseImage(dataUrl) {
  const match = /^data:image\/[a-z+]+;base64,([A-Za-z0-9+/=\s]+)$/.exec(String(dataUrl || ''));
  if (!match) throw new StorageError('Formato de imagem inválido. Use PNG, JPG ou WEBP.', 400);
  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.length > config.maxAvatarBytes) throw new StorageError('A imagem deve ter no máximo 2 MB.', 400);
  const kind = SIGNATURES.find((s) => buffer.length > 12 && s.test(buffer));
  if (!kind) throw new StorageError('Formato de imagem inválido. Use PNG, JPG ou WEBP.', 400);
  return { buffer, contentType: kind.type, ext: kind.ext };
}

/** Envia a foto para o bucket e devolve a chave do objeto (nome único a cada envio). */
export async function uploadAvatar({ buffer, contentType, ext }) {
  requireStorage();
  const key = `avatars/${crypto.randomUUID()}.${ext}`;
  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucket, Key: key, Body: buffer, ContentType: contentType, ContentLength: buffer.length,
    }));
  } catch (err) {
    console.error('[fotos] erro ao enviar:', err.message);
    throw new StorageError('Não foi possível salvar a foto. Tente novamente.', 502);
  }
  return key;
}

/** Baixa a foto do bucket. Devolve null se ela não existir mais. */
export async function downloadObject(key) {
  requireStorage();
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return Buffer.from(await res.Body.transformToByteArray());
  } catch (err) {
    if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

export async function deleteObject(key) {
  requireStorage();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/**
 * Apaga do bucket as fotos que saíram do banco.
 * Quando uma conta é excluída, a linha em user_avatars some por ON DELETE CASCADE e um
 * gatilho do banco coloca a chave da foto em storage_deletions. O mesmo acontece quando
 * a foto é trocada ou removida. Aqui os arquivos são apagados de fato e saem da fila.
 */
export async function purgeDeletedFiles() {
  if (!storageEnabled) return 0;
  const pending = await query(
    'SELECT object_key FROM storage_deletions WHERE attempts < 20 ORDER BY queued_at LIMIT 100',
  );
  let done = 0;
  for (const { object_key: key } of pending) {
    try {
      await deleteObject(key);
      await query('DELETE FROM storage_deletions WHERE object_key = $1', [key]);
      done += 1;
    } catch (err) {
      console.error('[fotos] não foi possível apagar', key, '-', err.message);
      await query('UPDATE storage_deletions SET attempts = attempts + 1 WHERE object_key = $1', [key]);
    }
  }
  return done;
}

/** Roda a limpeza sem travar a resposta da requisição. */
export function purgeSoon() {
  purgeDeletedFiles().catch((err) => console.error('[fotos]', err.message));
}

/**
 * Versões antigas guardavam a foto como data URL na coluna users.avatar.
 * Se houver alguma, envia para o bucket e limpa a coluna.
 */
export async function migrateLegacyAvatars() {
  if (!storageEnabled) return;
  const legacy = await query(
    `SELECT u.id, u.avatar FROM users u
      WHERE u.avatar LIKE 'data:image/%'
        AND NOT EXISTS (SELECT 1 FROM user_avatars a WHERE a.user_id = u.id)`,
  );
  for (const u of legacy) {
    try {
      const image = parseImage(u.avatar);
      const key = await uploadAvatar(image);
      await one(
        `INSERT INTO user_avatars (user_id, object_key, content_type, size_bytes) VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO NOTHING`,
        [u.id, key, image.contentType, image.buffer.length],
      );
      await one('UPDATE users SET avatar = NULL WHERE id = $1', [u.id]);
    } catch (err) {
      console.error(`[fotos] não foi possível migrar a foto do usuário ${u.id}:`, err.message);
    }
  }
  if (legacy.length) console.log(`[fotos] ${legacy.length} foto(s) antiga(s) enviadas para o Object Storage`);
}
