import { app } from './app.js';
import { config } from './config.js';
import { migrate, pool } from './db.js';
import { purgeTrash } from './patients.js';

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

  await purgeTrash().catch((e) => console.error('[lixeira]', e.message));
  setInterval(() => purgeTrash().catch((e) => console.error('[lixeira]', e.message)), 60 * 60 * 1000);

  const server = app.listen(config.port, () => {
    console.log(`API DesospIdoso rodando em http://localhost:${config.port}`);
  });

  const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
