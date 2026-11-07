import dotenv from 'dotenv';
import { cleanEnv, str, port, url, bool } from 'envalid';

// Load environment variables from .env file
dotenv.config();

export const env = cleanEnv(process.env, {
  PORT: port({
    default: 5000,
    desc: 'Server listening port',
  }),
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development',
    desc: 'Application runtime environment',
  }),
  MONGODB_URI: str({
    default: 'mongodb://localhost:27017/sunbird_erp',
    desc: 'MongoDB Atlas connection URI',
  }),
  REDIS_URL: str({
    default: 'redis://localhost:6379',
    desc: 'Redis connection string',
  }),
  JWT_ACCESS_SECRET: str({
    desc: 'Secret key for signing short-lived access JWT tokens',
    default: 'sunbird_erp_development_access_token_secret_key_at_least_32_chars',
  }),
  JWT_REFRESH_SECRET: str({
    desc: 'Secret key for signing long-lived refresh JWT tokens',
    default: 'sunbird_erp_development_refresh_token_secret_key_at_least_32_chars',
  }),
  JWT_ACCESS_EXPIRY: str({
    default: '15m',
    desc: 'Access token expiration timeframe',
  }),
  JWT_REFRESH_EXPIRY: str({
    default: '7d',
    desc: 'Refresh token expiration timeframe',
  }),
  NID_HASH_SALT: str({
    default: 'sunbird_nid_secure_salt_2026',
    desc: 'Cryptographic salt for hashing citizen NID numbers',
  }),
  NID_HASH_PEPPER: str({
    default: 'sunbird_nid_secret_pepper_2026',
    desc: 'Secret pepper for high-entropy NID hashing',
  }),
  PORICHOY_API_KEY: str({
    default: '',
    desc: 'Bangladesh Government Porichoy NID verification API key',
  }),
  PORICHOY_API_URL: str({
    default: 'https://api.porichoy.bd/api/v2/verifications',
    desc: 'Porichoy API verification endpoint URL',
  }),
  SMS_API_KEY: str({
    default: '',
    desc: 'Bangladesh SMS Gateway API key for OTP delivery',
  }),
  SMS_API_URL: str({
    default: 'https://api.smsbd.net/v1/send',
    desc: 'SMS Gateway delivery endpoint URL',
  }),
  CLIENT_STOREFRONT_URL: url({
    default: 'http://localhost:3000',
    desc: 'Public Storefront client URL for CORS and redirects',
  }),
  CLIENT_ERP_URL: url({
    default: 'http://localhost:3001',
    desc: 'Internal ERP admin dashboard client URL for CORS',
  }),
  GEMINI_API_KEY: str({
    default: '',
    desc: 'Google Gemini API key for AI CS Advisor and Pillar 1 automation',
  }),
  // ── AWS S3 / MinIO Document Storage ──────────────────────────────────────
  AWS_ACCESS_KEY_ID: str({
    default: 'minioadmin',
    desc: 'AWS Access Key ID',
  }),
  AWS_SECRET_ACCESS_KEY: str({
    default: 'minioadmin',
    desc: 'AWS Secret Access Key',
  }),
  AWS_REGION: str({
    default: 'ap-southeast-1',
    desc: 'AWS S3 Region',
  }),
  AWS_S3_BUCKET: str({
    default: 'sunbird-documents',
    desc: 'AWS S3 Bucket Name for media & uploads',
  }),
  S3_BUCKET_NAME: str({
    default: 'sunbird-documents',
    desc: 'S3 or MinIO bucket name for statutory PDF storage',
  }),
  S3_REGION: str({
    default: 'ap-southeast-1',
    desc: 'AWS S3 region (or MinIO region placeholder)',
  }),
  S3_ACCESS_KEY_ID: str({
    default: 'minioadmin',
    desc: 'AWS Access Key ID or MinIO Access Key',
  }),
  S3_SECRET_ACCESS_KEY: str({
    default: 'minioadmin',
    desc: 'AWS Secret Access Key or MinIO Secret Key',
  }),
  S3_ENDPOINT: str({
    default: '',
    desc: 'Custom S3 endpoint for MinIO (leave empty for AWS)',
  }),
  S3_USE_PATH_STYLE: bool({
    default: false,
    desc: 'Use path-style S3 URLs (required for MinIO)',
  }),
  // ── Sun Bird Corporation NBR Registration ─────────────────────────────────
  COMPANY_BIN: str({
    default: '000000000-0201',
    desc: 'Sun Bird Corporation NBR Business Identification Number (BIN)',
  }),
  COMPANY_NAME_EN: str({
    default: 'Sun Bird Corporation',
    desc: 'Company legal name in English',
  }),
  COMPANY_NAME_BN: str({
    default: 'সান বার্ড কর্পোরেশন',
    desc: 'Company legal name in Bangla',
  }),
  COMPANY_ADDRESS_EN: str({
    default: 'Dhaka, Bangladesh',
    desc: 'Company registered address in English',
  }),
  COMPANY_ADDRESS_BN: str({
    default: 'ঢাকা, বাংলাদেশ',
    desc: 'Company registered address in Bangla',
  }),
  // ── Third-Party Courier Integrations (Pathao & Steadfast) ────────────────
  PATHAO_BASE_URL: str({
    default: 'https://courier-api-sandbox.pathao.com',
    desc: 'Pathao Merchant API base URL',
  }),
  PATHAO_CLIENT_ID: str({
    default: '',
    desc: 'Pathao Merchant OAuth Client ID',
  }),
  PATHAO_CLIENT_SECRET: str({
    default: '',
    desc: 'Pathao Merchant OAuth Client Secret',
  }),
  PATHAO_USERNAME: str({
    default: '',
    desc: 'Pathao Merchant account username / email',
  }),
  PATHAO_PASSWORD: str({
    default: '',
    desc: 'Pathao Merchant account password',
  }),
  PATHAO_STORE_ID: str({
    default: '1',
    desc: 'Pathao Merchant primary store ID',
  }),
  STEADFAST_BASE_URL: str({
    default: 'https://portal.steadfast.com.bd/api/v1',
    desc: 'Steadfast Courier API base URL',
  }),
  STEADFAST_API_KEY: str({
    default: '',
    desc: 'Steadfast Courier API Key',
  }),
  STEADFAST_SECRET_KEY: str({
    default: '',
    desc: 'Steadfast Courier Secret Key',
  }),
  // ── SSLCOMMERZ Payment Gateway & Courier Webhook Secrets ──────────────────
  SSLCOMMERZ_STORE_ID: str({
    default: 'sunbird_test',
    desc: 'SSLCOMMERZ Store ID',
  }),
  SSLCOMMERZ_STORE_PASSWORD: str({
    default: 'sunbird_test@ssl',
    desc: 'SSLCOMMERZ Store Password',
  }),
  SSLCOMMERZ_IS_SANDBOX: bool({
    default: true,
    desc: 'SSLCOMMERZ Sandbox mode flag',
  }),
  PATHAO_WEBHOOK_SECRET: str({
    default: 'pathao_webhook_secret_key',
    desc: 'Pathao webhook signature secret',
  }),
  STEADFAST_WEBHOOK_SECRET: str({
    default: 'steadfast_webhook_secret_key',
    desc: 'Steadfast webhook bearer secret',
  }),
});

export type Env = typeof env;
export default env;
