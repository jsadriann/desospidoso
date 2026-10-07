// Banco de dados: PostgreSQL (Neon) via driver "pg".
// A connection string vem de DATABASE_URL no arquivo .env.
import pg from 'pg';
import { config } from './config.js';

const { Pool, types } = pg;

// Conversões de tipo (Postgres -> JavaScript)
types.setTypeParser(20, (v) => Number(v)); // BIGINT (ex.: COUNT(*)) -> number
types.setTypeParser(1082, (v) => v); // DATE -> 'AAAA-MM-DD' (sem fuso horário)
types.setTypeParser(1184, (v) => new Date(v).toISOString()); // TIMESTAMPTZ -> ISO string

if (!config.databaseUrl || config.databaseUrl.includes('COLE_AQUI')) {
  throw new Error(
    'DATABASE_URL não configurada. Cole a connection string do Neon no arquivo backend/.env '
      + '(Painel do Neon > seu projeto > Connect).',
  );
}

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  // O Neon "dorme" quando fica ocioso; a primeira conexão pode levar alguns segundos.
  connectionTimeoutMillis: 20_000,
});

// O Neon encerra conexões ociosas; sem este handler o processo cairia.
pool.on('error', (err) => console.error('[db] conexão encerrada pelo servidor:', err.message));

/** Executa uma consulta e devolve as linhas. Use $1, $2... para os parâmetros. */
export async function query(text, params = []) {
  const { rows } = await pool.query(text, params);
  return rows;
}

/** Executa uma consulta e devolve só a primeira linha (ou null). */
export async function one(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

/** Executa fn dentro de uma transação. fn recebe { query, one } ligados à mesma conexão. */
export async function transaction(fn) {
  const client = await pool.connect();
  const tx = {
    query: async (text, params = []) => (await client.query(text, params)).rows,
    one: async (text, params = []) => (await client.query(text, params)).rows[0] || null,
  };
  try {
    await client.query('BEGIN');
    const result = await fn(tx);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Cria as tabelas (se ainda não existirem). Roda automaticamente ao iniciar a API. */
export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          TEXT        NOT NULL,
      email         TEXT        NOT NULL,
      password_hash TEXT        NOT NULL,
      role          TEXT        NOT NULL,
      avatar        TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));

    CREATE TABLE IF NOT EXISTS password_resets (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash   TEXT        NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      verified    BOOLEAN     NOT NULL DEFAULT false,
      used        BOOLEAN     NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Identificação do paciente (1ª etapa). Compartilhada por todas as funções.
    CREATE TABLE IF NOT EXISTS patients (
      id              SERIAL PRIMARY KEY,
      code            TEXT        NOT NULL UNIQUE,      -- "ID 03159" gerado pelo sistema
      full_name       TEXT        NOT NULL,
      birth_date      DATE        NOT NULL,
      hospital        TEXT        NOT NULL,
      ward            TEXT        NOT NULL,             -- enfermaria
      bed             TEXT        NOT NULL,             -- leito
      axis            TEXT        NOT NULL,             -- eixo de internação
      created_by      INTEGER     REFERENCES users(id) ON DELETE SET NULL,
      created_by_name TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      completed_at    TIMESTAMPTZ,                      -- quando todas as seções foram preenchidas
      deleted_at      TIMESTAMPTZ,                      -- lixeira
      last_action     TEXT        NOT NULL DEFAULT 'CREATED', -- CREATED | UPDATED | RESTORED | DELETED
      last_action_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Dados específicos do paciente por função (2ª etapa). Uma seção por função.
    CREATE TABLE IF NOT EXISTS sections (
      id              SERIAL PRIMARY KEY,
      patient_id      INTEGER     NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      role            TEXT        NOT NULL,
      answers         JSONB       NOT NULL,
      filled_by       INTEGER     REFERENCES users(id) ON DELETE SET NULL,
      filled_by_name  TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (patient_id, role)
    );

    CREATE INDEX IF NOT EXISTS patients_deleted_idx ON patients (deleted_at);
    CREATE INDEX IF NOT EXISTS sections_patient_idx ON sections (patient_id);
  `);
}

/** Envolve um handler async do Express para que erros cheguem ao tratador de erros. */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
