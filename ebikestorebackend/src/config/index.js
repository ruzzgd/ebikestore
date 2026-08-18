import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root project directory if present in local dev environment
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || process.env.BACKEND_PORT || '5000', 10),
  db: Object.freeze({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    database: process.env.MYSQL_DATABASE || 'ebikestore_db',
    user: process.env.MYSQL_USER || 'ebikestore_user',
    password: process.env.MYSQL_PASSWORD || 'ebikestore1234',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  }),
  jwt: Object.freeze({
    secret: process.env.JWT_SECRET || 'ebikestore_staging_jwt_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRE || '24h',
    cookieName: 'ebikestore_token',
  }),
  cors: Object.freeze({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  }),
  resend: Object.freeze({
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  }),
  adminSeed: Object.freeze({
    name: process.env.ADMIN_NAME || 'System Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'admin1234',
  }),
  minio: Object.freeze({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: (process.env.MINIO_USE_SSL || 'false') === 'true',
    accessKey: process.env.MINIO_ROOT_USER || 'ebikestore',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'ebikestore1234',
    bucket: process.env.MINIO_BUCKET || 'ebikestore-products',
  }),
  encryption: Object.freeze({
    key: process.env.PII_ENCRYPTION_KEY || 'ebikestore_staging_pii_key_2026'
  })
});

export default config;
