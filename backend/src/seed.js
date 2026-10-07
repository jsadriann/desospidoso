// Popula o banco (Neon) com dados de exemplo (os mesmos nomes das telas).
// Uso: npm run seed   — senha de todos os usuários: Senha@123
// Pode rodar mais de uma vez: não duplica usuários nem pacientes.
import { migrate, one, pool, transaction } from './db.js';
import { hashPassword } from './auth.js';
import { FORMS, ROLES, validateAnswers } from './forms.js';
import { generateCode, refreshCompletion } from './patients.js';

const USERS = [
  ['Anna da Silva', 'annadasilva@yahoo.com', 'MEDICO'],
  ['Maria Nunes', 'maria.nunes@hospital.com', 'ASSISTENTE_SOCIAL'],
  ['Carla Souza', 'carla.souza@hospital.com', 'ENFERMEIRO'],
  ['Gustavo Rocha', 'gustavo.rocha@hospital.com', 'FISIOTERAPEUTA'],
  ['Joana Alves', 'joana.alves@hospital.com', 'NUTRICIONISTA'],
  ['Matheus Sampaio', 'matheus.sampaio@hospital.com', 'PSICOLOGO'],
  ['Paula Lima', 'paula.lima@hospital.com', 'TERAPEUTA_OCUPACIONAL'],
];

/** Gera respostas válidas escolhendo sempre a 1ª opção. */
function sampleAnswers(form) {
  const a = {};
  const walk = (qs) => {
    for (const q of qs) {
      if (q.type === 'group') { walk(q.items); continue; }
      if (q.type === 'text') { a[q.id] = q.inputLabel?.startsWith('Diagn') ? 'Hipertensão arterial sistêmica não controlada' : 'Sem alterações'; continue; }
      const opt = q.options[0];
      a[q.id] = q.type === 'checkbox' ? [opt.value] : opt.value;
      if (opt.input) a[opt.input.id] = 'Exemplo';
      if (opt.followUp) walk(opt.followUp);
    }
  };
  walk(form.questions);
  const { errors, clean } = validateAnswers(form.role, a);
  if (errors.length) throw new Error(`${form.role}: ${errors.join(', ')}`);
  return clean;
}

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);

async function seed() {
  await migrate();

  const users = {};
  for (const [name, email, role] of USERS) {
    users[role] = await one('SELECT * FROM users WHERE lower(email) = lower($1)', [email])
      || await one(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, hashPassword('Senha@123'), role],
      );
  }

  const patients = [
    // nome, nascimento, enfermaria, leito, eixo, funções já preenchidas, criado há N dias
    ['Renata Braga', '1946-09-27', 'Enfermaria 01', 'Leito 12', 'CLINICA_MEDICA', ['ASSISTENTE_SOCIAL', 'ENFERMEIRO', 'FISIOTERAPEUTA'], 0],
    ['Leia Marinho', '1944-07-10', 'Enfermaria 01', 'Leito 08', 'UTI', ['ASSISTENTE_SOCIAL', 'MEDICO'], 0],
    ['Sonia Gomes', '1946-09-27', 'Enfermaria 02', 'Leito 14', 'UTI', Object.keys(ROLES), 2],
    ['Luiz Carvalho', '1930-07-10', 'Enfermaria 04', 'Leito 05', 'CIRURGICO', Object.keys(ROLES), 17],
  ];

  for (const [name, birth, ward, bed, axis, roles, ago] of patients) {
    if (await one('SELECT 1 FROM patients WHERE full_name = $1', [name])) continue;
    const creator = users.MEDICO;
    const when = daysAgo(ago);
    const code = await generateCode();
    await transaction(async (tx) => {
      const p = await tx.one(
        `INSERT INTO patients (code, full_name, birth_date, hospital, ward, bed, axis, created_by, created_by_name,
                               created_at, updated_at, last_action_at)
         VALUES ($1, $2, $3, 'Hospital São José', $4, $5, $6, $7, $8, $9, $9, $9) RETURNING id`,
        [code, name, birth, ward, bed, axis, creator.id, creator.name, when],
      );
      for (const role of roles) {
        const form = FORMS.find((f) => f.role === role);
        const u = users[role];
        await tx.one(
          `INSERT INTO sections (patient_id, role, answers, filled_by, filled_by_name, created_at, updated_at)
           VALUES ($1, $2, $3::jsonb, $4, $5, $6, $6)`,
          [p.id, role, JSON.stringify(sampleAnswers(form)), u.id, u.name, when],
        );
      }
      await refreshCompletion(p.id, tx);
    });
  }
  console.log('Banco populado. Login de exemplo: annadasilva@yahoo.com / Senha@123 (Médico)');
}

seed()
  .catch((err) => {
    console.error('Erro ao popular o banco:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
