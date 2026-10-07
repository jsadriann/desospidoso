# DesospIdoso

Aplicação para identificar precocemente o perfil de pacientes idosos internados que, após a alta, precisarão de
acolhimento em instituição de longa permanência — apoiando a **desospitalização**.

```
desospIdoso/
├── backend/    API REST (Node.js + Express + PostgreSQL no Neon)
├── frontend/   App React (Vite + React Router), mobile-first
└── telas/      Protótipos (SVG) que serviram de base
```

## Requisitos

- **Node.js 18.18 ou superior** (recomendado: Node 22 LTS ou 24 LTS).
- Um banco **PostgreSQL no [Neon](https://neon.tech)** (o plano gratuito atende). As tabelas são criadas
  automaticamente na primeira vez que o backend inicia.

## Como rodar (desenvolvimento)

Em dois terminais:

```bash
# 1) API
cd backend
cp .env.example .env        # cole a DATABASE_URL do Neon e defina JWT_SECRET
npm install
npm run seed                # opcional: cria usuários e pacientes de exemplo no Neon
npm run dev                 # http://localhost:3333
```

```bash
# 2) Frontend
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Com o seed, entre com **annadasilva@yahoo.com / Senha@123** (função Médico). Há um usuário de exemplo para cada
função (veja `backend/src/seed.js`), todos com a senha `Senha@123`.

> **Neon:** a `DATABASE_URL` fica em Painel do Neon > seu projeto > **Connect** (prefira a conexão com
> *pooling*). Ao iniciar, o backend mostra `Banco conectado: ep-....neon.tech`. Para checar a conexão a qualquer
> momento, abra `http://localhost:3333/api/health` (deve responder `"database": "ok"`).

> **Esqueci minha senha:** sem SMTP configurado no `.env`, o código de 6 dígitos aparece no terminal do backend.

## Telas implementadas

| Tela (protótipo) | Rota |
|---|---|
| Página inicial (primeiro acesso — só na primeira visita; depois `/` abre o login) | `/` e `/sobre` |
| Login (com mensagens de erro) | `/login` |
| Cadastro + boas-vindas | `/cadastro`, `/boas-vindas` |
| Esqueci minha senha (e-mail → código → nova senha → sucesso) | `/esqueci-senha` |
| Pacientes (Todos / Recentes / Lixeira, busca, + Novo) | `/pacientes` |
| Ajuda | `/pacientes/ajuda` |
| Etapa 1 – Selecionar identificação | `/pacientes/novo` |
| Etapa 1 – Adicionar nova identificação | `/pacientes/novo/identificacao` |
| Etapa 2 – Dados específicos por função | `/pacientes/:id/preencher` |
| Detalhes do paciente (excluir / restaurar / editar) | `/pacientes/:id` |
| Editar identificação | `/pacientes/:id/identificacao` |
| Fichas completas + detalhes + Download em PDF | `/fichas`, `/fichas/:id` |
| Perfil, Dados pessoais (ver/editar, foto), Sair, Deletar conta | `/perfil`, `/perfil/dados`, `/perfil/dados/editar` |

## Layout responsivo

O CSS é *mobile first* (a base são os protótipos de celular) e se adapta em `frontend/src/styles.css`:

| Largura | Comportamento |
|---|---|
| até 360px | celulares pequenos: margens e componentes mais compactos |
| até 599px | celular: barra de navegação inferior e botão "+" flutuante (igual aos protótipos) |
| 600–1023px | tablet: conteúdo centralizado com largura máxima, cartões em 2 colunas, opções em grade; login, cadastro e senha viram um cartão centralizado |
| a partir de 900px | página inicial e boas-vindas em duas colunas (foto + conteúdo) |
| a partir de 1024px | desktop: menu lateral fixo (com "Novo paciente" e usuário logado), lista em 3+ colunas, formulários e detalhes em painel central |

## Regras de negócio (tiradas das telas)

- **Arquivo do paciente** = identificação + 7 seções, uma por função: Assistente social, Enfermeiro, Fisioterapeuta,
  Médico, Nutricionista, Psicólogo/Psiquiatra e Terapeuta ocupacional.
- A **identificação** é criada uma vez e reutilizada por todos os profissionais.
- Cada profissional **só preenche/edita a seção da sua função** (validado no backend).
- **Status** (do ponto de vista de quem está logado): *Pendente para você* (sua seção falta), *Pendente* (sua seção
  está feita, faltam outras), *Concluído* (todas as 7).
- **Recentes** = criados nos últimos 3 dias.
- **Lixeira**: exclusão é reversível; após **30 dias** o arquivo é apagado definitivamente (verificado a cada hora).
  Itens na lixeira não aparecem em Fichas completas e não podem ser editados.
- **Última alteração** no cartão: Criado/Atualizado/Restaurado/Excluído + hoje/ontem/anteontem ou "dia dd/mm/aaaa".
- **Fichas completas** = arquivos com as 7 seções preenchidas; podem ser baixados em PDF.
- **Senha**: mínimo 8 caracteres e ao menos um caractere especial.

Os questionários de cada função ficam em **`backend/src/forms.js`** (fonte única). O frontend busca em `GET /api/forms`
e monta os formulários dinamicamente — para mudar uma pergunta, altere só esse arquivo.

## API

Todas as rotas (exceto `/auth/*`, `/forms` e `/health`) exigem `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastro `{ name, email, password, confirmPassword, role }` |
| POST | `/api/auth/login` | Login `{ email, password }` → `{ token, user }` |
| POST | `/api/auth/forgot-password` | Envia código `{ email }` |
| POST | `/api/auth/verify-code` | Valida código `{ email, code }` → `{ resetToken }` |
| POST | `/api/auth/reset-password` | Nova senha `{ resetToken, password, confirmPassword }` |
| GET / PUT / DELETE | `/api/me` | Ver, editar (inclui foto em data URL) e deletar a conta |
| GET | `/api/forms` | Funções, eixos de internação e questionários |
| GET | `/api/patients?filter=todos\|recentes\|lixeira\|selecionaveis&q=` | Lista com status e progresso |
| POST | `/api/patients` | Nova identificação |
| GET / PUT | `/api/patients/:id` | Detalhes completos / editar identificação |
| PUT | `/api/patients/:id/sections/:role` | Salvar a seção da sua função `{ answers }` |
| DELETE | `/api/patients/:id` | Mover para a lixeira |
| POST | `/api/patients/:id/restore` | Restaurar da lixeira |
| GET | `/api/patients/:id/pdf` | PDF da ficha |
| GET | `/api/records?q=` | Fichas completas |

## Decisões e pontos para validar com a equipe

- **7 seções no progresso.** Alguns protótipos mostram "3 de 8" e 8 círculos, mas existem 7 funções e a Ajuda diz que a
  identificação não conta no progresso — por isso usei 7.
- **Psicólogo – acompanhamento:** adicionei a opção "Não." além das duas do protótipo, para cobrir paciente sem
  acompanhamento e sem necessidade de rede especializada.
- **Enfermeiro – comorbidades:** o protótipo repete "Problemas cardíacos" na última opção; usei "Outras" com campo de texto.
- **Banco:** PostgreSQL no Neon, via driver `pg`. O esquema (tabelas e índices) está em `backend/src/db.js`
  (`migrate()`), executado a cada inicialização com `CREATE TABLE IF NOT EXISTS`. Respostas dos questionários
  ficam em uma coluna `JSONB`.
- **Foto de perfil:** é reduzida no navegador (320 px) e salva no banco como data URL — simples e sem servidor de
  arquivos.

## Publicar (GitHub + Render + Neon)

O projeto está pronto para rodar como **um único serviço**: o backend entrega a API em `/api` e também as telas
do React (geradas em `frontend/dist`). Um endereço só, sem configurar CORS.

**1. Atualize as dependências na sua máquina** (gera os `package-lock.json` com o driver `pg`):

```bash
cd backend && npm install && cd ../frontend && npm install && cd ..
```

**2. Envie para o GitHub** (o `.gitignore` da raiz já impede o envio de `.env`, `node_modules` e `dist`):

```bash
git init
git add .
git commit -m "DesospIdoso: frontend React + API Node + PostgreSQL (Neon)"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/desospidoso.git
git push -u origin main
```

Antes do `git commit`, confira com `git status` que nenhum `.env` aparece na lista.

**3. Crie o serviço no Render** — duas opções:

- **Automática (Blueprint):** em *New > Blueprint*, escolha o repositório. O Render lê o `render.yaml` e cria o
  serviço; ele só vai pedir a `DATABASE_URL` (cole a string do Neon). O `JWT_SECRET` é gerado sozinho.
- **Manual:** *New > Web Service* → repositório → **Build Command** `npm run build` → **Start Command** `npm start`
  → plano **Free** → em *Environment* adicione `DATABASE_URL` e `JWT_SECRET` (e `SMTP_*`, se quiser e-mail real).

Quando o deploy terminar, abra o endereço `https://SEU-SERVICO.onrender.com`. Para conferir o banco:
`https://SEU-SERVICO.onrender.com/api/health` deve responder `"database": "ok"`.

> No plano gratuito do Render o serviço "dorme" após 15 minutos sem acesso; o primeiro acesso depois disso leva
> cerca de 1 minuto. Os dados não são afetados (ficam no Neon).

Cada `git push` na branch `main` publica uma nova versão automaticamente.

## Outras formas de hospedar

- **Um serviço (recomendado):** na raiz, `npm run build` e depois `npm start` — veja "Publicar" acima.
- **Separado (opcional):** publique `frontend/dist` em um host estático (ex.: Vercel) com
  `VITE_API_URL=https://sua-api` no build, e informe o endereço do site em `FRONTEND_URL` no backend (CORS).
