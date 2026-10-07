import { app } from './app.js';
import { config } from './config.js';
import { migrate, pool } from './db.js';
import { purgeTrash } from './patients.js';
import { ensureBucket, migrateLegacyAvatars, purgeDeletedFiles } from './storage.js';

async function start() {
  try {
    await migrate(); // cria as tabelas no Neon, se ainda não existirem
  } catch (err) {
    console.error('\nNão foi possível conectar ao PostgreSQL (Neon).');
    console.error('Confira a DATABASE_URL no arquivo backend/.env.');
    console.error(`Detalhe: ${err.message}\n`);
    process.exit(1);
  }
  const { host } = new URL(config.databaseUrl);
  console.log(`Banco conectado: ${host}`);

  // Object Storage (fotos de perfil). Se falhar, a API sobe mesmo assim; só as fotos ficam indisponíveis.
  try {
    await ensureBucket();
    await migrateLegacyAvatars();
    await purgeDeletedFiles();
  } catch (err) {
    console.error('[fotos] Object Storage indisponível:', err.message);
  }

  const hourly = () => {
    purgeTrash().catch((e) => console.error('[lixeira]', e.message));
    purgeDeletedFiles().catch((e) => console.error('[fotos]', e.message));
  };
  await purgeTrash().catch((e) => console.error('[lixeira]', e.message));
  setInterval(hourly, 60 * 60 * 1000);

  const server = app.listen(config.port, () => {
    console.log(`API DesospIdoso rodando em http://localhost:${config.port}`);
  });

  const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
