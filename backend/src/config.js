import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 3333),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-desospidoso',
  // Connection string do PostgreSQL no Neon (Painel do Neon > Connect)
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Object Storage do Neon (compatível com S3) — fotos de perfil
  storage: {
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_S3_BUCKET || 'desospidoso',
  },
  maxAvatarBytes: 2 * 1024 * 1024,
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'DesospIdoso <nao-responda@desospidoso.com>',
  },
  // Regras de negócio vindas das telas
  trashRetentionDays: 30, // "após 30 dias, todos os arquivos que não forem restaurados serão permanentemente excluídos"
  recentDays: 3, // "Nenhum paciente adicionado nos últimos 3 dias"
  resetCodeMinutes: 15,
};
