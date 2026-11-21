# MODULE 18 — PRODUCTION DEPLOYMENT GUIDE
## Sun Bird Corporation ERP & Healthcare E-Commerce Platform

---

### 1. Prerequisites & Environment Matrix

Ensure the following runtimes and services are provisioned before launching the production build:
- **Node.js:** `v20.x` or `v22.x LTS`
- **MongoDB:** `v7.0+` or MongoDB Atlas Cluster (M10+ with Replica Set for transactions)
- **Redis:** `v7.0+` (Redis Cloud / AWS ElastiCache for BullMQ & Stock Locks)
- **Object Storage:** AWS S3 or MinIO S3-compatible storage
- **Reverse Proxy:** NGINX / Cloudflare with TLS 1.3 termination

---

### 2. Environment Variables Configuration

Copy `.env.example` to `.env` in both `backend` and `frontend` directories.

#### Critical Backend Variables (`backend/.env`):
```ini
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/sunbird_erp?retryWrites=true&w=majority
REDIS_URL=redis://:<password>@redis-host:6379

# Security & Tokens
JWT_SECRET=production_super_secret_jwt_key_at_least_32_chars
REFRESH_TOKEN_SECRET=production_super_secret_refresh_token_key_32_chars

# Storage (AWS S3 or MinIO)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=sunbird-erp-production-media

# AI Services
GEMINI_API_KEY=AIzaSy...

# Courier & Integrations
STEADFAST_API_KEY=...
STEADFAST_SECRET_KEY=...
PATHAO_CLIENT_ID=...
PATHAO_CLIENT_SECRET=...
```

#### Critical Frontend Variables (`frontend/.env.production`):
```ini
NEXT_PUBLIC_API_URL=https://api.sunbird.com.bd/api/v1
NEXT_PUBLIC_APP_NAME="Sun Bird Corporation"
```

---

### 3. Step-by-Step Production Build & Deployment

#### Step 1: Install Dependencies
```bash
# Backend
cd backend
npm ci --omit=dev

# Frontend
cd ../frontend
npm ci
```

#### Step 2: Build Artifacts
```bash
# Backend compilation
npm --prefix backend run build

# Frontend compilation
npm --prefix frontend run build
```

#### Step 3: Run Seeders (Initial Setup Only)
```bash
npm --prefix backend run seed
```

#### Step 4: Process Management (PM2)
```bash
# Start backend API cluster
pm2 start dist/server.js --name "sunbird-backend-api" -i max

# Start background BullMQ queue worker
pm2 start dist/queues/worker.js --name "sunbird-queue-worker"

# Start Next.js frontend
cd frontend
pm2 start "npm run start" --name "sunbird-frontend-web"
```

---

### 4. Zero-Downtime Rollback Procedure

1. If a deployment issue occurs, execute instant traffic rollback via NGINX upstream to the previous release directory (`/var/www/sunbird/releases/previous`).
2. Restore the automated pre-deployment database checkpoint using `SystemAdminService.executeRestore()`.
3. Check application logs via `pm2 logs`.
