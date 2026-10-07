# DesospIdoso

Aplicação web para apoiar a desospitalização de pacientes idosos internados no Hospital e Maternidade Dra. Zilda
Arns Neumann. A equipe multiprofissional registra, ainda durante a internação, as informações de cada paciente, e o
sistema reúne tudo em uma ficha que ajuda a definir o acolhimento mais adequado após a alta.

## Tecnologias

- Frontend: React, Vite e React Router
- Backend: Node.js e Express
- Banco de dados: PostgreSQL (Neon)
- Autenticação: JWT
- PDF da ficha: pdf-lib

## Estrutura

```
desospIdoso/
├── backend/          API (Express + PostgreSQL)
│   └── src/
│       ├── routes/   rotas da API
│       ├── forms.js  questionários de cada função
│       ├── db.js     conexão e criação das tabelas
│       └── seed.js   dados de exemplo
├── frontend/         aplicação React
│   ├── public/       imagens e logo
│   └── src/
│       ├── pages/    telas
│       └── components/
├── package.json      scripts de build e start (usados no deploy)
└── render.yaml       configuração do Render
```

## Como rodar localmente

Requisitos: Node.js 18 ou superior e um banco PostgreSQL (o projeto usa o Neon).

1. Configure o backend:

```bash
cd backend
cp .env.example .env
```

Preencha o `.env`:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do Neon (painel do Neon, botão Connect) |
| `JWT_SECRET` | Texto longo e aleatório usado para assinar os logins |
| `PORT` | Porta da API (padrão 3333) |
| `FRONTEND_URL` | Endereço do frontend em desenvolvimento (padrão http://localhost:5173) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Envio do código de recuperação de senha. Se ficarem vazios, o código aparece no terminal do backend |

2. Instale as dependências e inicie a API:

```bash
npm install
npm run seed   # opcional, cria usuários e pacientes de exemplo
npm run dev
```

As tabelas são criadas automaticamente na primeira execução.

3. Em outro terminal, inicie o frontend:

```bash
cd frontend
npm install
npm run dev
```

O sistema fica disponível em http://localhost:5173.

Com os dados de exemplo, é possível entrar com `annadasilva@yahoo.com` e senha `Senha@123` (função Médico). Existe
um usuário de exemplo para cada função, todos com a mesma senha (lista em `backend/src/seed.js`).

## Como o sistema funciona

### Acesso

Na primeira visita é exibida uma tela de apresentação. Depois disso, o sistema abre direto no login. A apresentação
continua acessível pelo link "Conheça o DesospIdoso".

No cadastro, o profissional informa nome, e-mail, senha e sua função:

- Assistente social
- Enfermeiro
- Fisioterapeuta
- Médico
- Nutricionista
- Psicólogo / Psiquiatra
- Terapeuta ocupacional

A senha precisa ter no mínimo 8 caracteres, incluindo um caractere especial. Quem esquecer a senha recebe um código de
6 dígitos por e-mail, válido por 15 minutos.

### Arquivo do paciente

Cada paciente tem um arquivo formado por duas partes:

1. Identificação: nome, data de nascimento, hospital, enfermaria, leito e eixo de internação (clínica médica,
   cirúrgico ou UTI). É criada uma única vez e fica disponível para toda a equipe.
2. Dados específicos por função: uma seção para cada uma das 7 funções. Cada profissional preenche e edita apenas a
   seção da sua função.

Para criar um arquivo, o profissional clica em "Novo paciente", escolhe uma identificação já cadastrada (ou cria uma
nova) e preenche o questionário da sua função.

### Lista de pacientes

Cada cartão mostra o nome, o ID, o status, o progresso (por exemplo, "3 de 7 seções concluídas") e a última
alteração (criado, atualizado, restaurado ou excluído, com "hoje", "ontem", "anteontem" ou a data).

Os status são:

- Pendente para você: a seção da sua função ainda não foi preenchida.
- Pendente: a sua seção já foi preenchida, mas faltam seções de outras funções.
- Concluído: todas as 7 seções foram preenchidas.

As abas filtram a lista:

- Todos
- Recentes: pacientes criados nos últimos 3 dias.
- Lixeira: arquivos excluídos. Eles podem ser restaurados em até 30 dias e, depois disso, são apagados
  definitivamente.

### Fichas completas

Quando as 7 seções de um arquivo são preenchidas, ele passa a aparecer em "Fichas completas". Ali é possível ver
todas as respostas e baixar a ficha em PDF.

### Perfil

O profissional pode ver e editar nome, e-mail, senha, função e foto, sair da conta ou excluir a conta.

### Questionários

As perguntas de cada função ficam em `backend/src/forms.js`. O frontend monta os formulários a partir desse arquivo,
então para mudar uma pergunta ou opção basta editá-lo.

## API

As rotas, exceto `/api/auth/*`, `/api/forms` e `/api/health`, exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastro |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Envia o código de recuperação |
| POST | `/api/auth/verify-code` | Valida o código |
| POST | `/api/auth/reset-password` | Define a nova senha |
| GET, PUT, DELETE | `/api/me` | Ver, editar e excluir a própria conta |
| GET | `/api/forms` | Funções, eixos de internação e questionários |
| GET | `/api/patients` | Lista de pacientes (`filter`: todos, recentes, lixeira; `q`: busca por nome ou ID) |
| POST | `/api/patients` | Cria uma identificação |
| GET, PUT | `/api/patients/:id` | Detalhes do arquivo / edita a identificação |
| PUT | `/api/patients/:id/sections/:role` | Salva a seção da função do usuário |
| DELETE | `/api/patients/:id` | Move para a lixeira |
| POST | `/api/patients/:id/restore` | Restaura da lixeira |
| GET | `/api/patients/:id/pdf` | PDF da ficha |
| GET | `/api/records` | Fichas completas |
| GET | `/api/health` | Verifica a API e a conexão com o banco |

## Deploy

Em produção, o backend serve a API em `/api` e também as telas do React, então o sistema roda como um único serviço.

Na raiz do projeto:

```bash
npm run build   # instala as dependências e gera o frontend
npm start       # inicia o servidor
```

### Render

1. Envie o projeto para um repositório no GitHub.
2. No Render, crie um Blueprint (New > Blueprint) apontando para o repositório. O arquivo `render.yaml` já tem a
   configuração do serviço.
3. Informe a variável `DATABASE_URL` com a string de conexão do Neon. O `JWT_SECRET` é gerado pelo próprio Render.

Cada push na branch `main` gera um novo deploy. Para conferir se o banco está conectado, acesse `/api/health` no
endereço do serviço.

No plano gratuito do Render, o serviço é suspenso após 15 minutos sem acesso, e o primeiro acesso seguinte demora
cerca de um minuto.
