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
    password: process.env.MYSQL_PASSWORD || 'ebikestore_password_placeholder',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  }),
  jwt: Object.freeze({
    secret: process.env.JWT_SECRET || 'change_this_jwt_secret_key_minimum_32_chars',
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
    email: process.env.ADMIN_EMAIL || 'admin@fideloe-bikes.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!Secure',
  }),
  minio: Object.freeze({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: (process.env.MINIO_USE_SSL || 'false') === 'true',
    accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'change_this_minio_password',
    bucket: process.env.MINIO_BUCKET || 'ebikestore-products',
  }),
  encryption: Object.freeze({
    key: process.env.PII_ENCRYPTION_KEY || 'default_fallback_key_for_dev_only_12345'
  })
});

export default config;
