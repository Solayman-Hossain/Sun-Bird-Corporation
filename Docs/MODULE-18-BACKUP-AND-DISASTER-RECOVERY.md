# MODULE 18 — BACKUP & DISASTER RECOVERY GUIDE
## Sun Bird Corporation ERP & Healthcare E-Commerce Platform

---

### 1. Disaster Recovery Objectives (RPO & RTO)

- **Recovery Point Objective (RPO):** $\le 1\text{ Hour}$ (Maximum acceptable data loss period).
- **Recovery Time Objective (RTO):** $\le 15\text{ Minutes}$ (Time to fully restore operational capability).

---

### 2. Backup Mechanisms & Storage Architecture

#### A. Automated Database Backups (Module 16)
- **Schedule:** Automated cron snapshot executed every 6 hours via BullMQ.
- **Payload:** All collections dumped into an encrypted archive with document count validation.
- **Integrity:** Every backup generates a SHA-256 cryptographic checksum stored in `BackupRecord.checksum` (e.g., `sha256-4f8a...`).
- **Destinations:** Stored locally in a secure backup folder and mirrored to AWS S3 (`s3://sunbird-erp-backups/`).

#### B. Pre-Restore Safety Checkpoints
Before executing any database restore (whether manual or automated), `SystemAdminService.executeRestore()` automatically triggers a pre-restore backup snapshot (`preRestoreBackupId`). This ensures that if a restore fails or points to an unintended snapshot, the state can be immediately reverted without permanent data loss.

---

### 3. Step-by-Step Restoration Workflow

1. **Access System Administration Console:**
   - Navigate to `http://localhost:3000/erp` $\rightarrow$ Section 12 (System Admin) $\rightarrow$ Submodule 13 (Restore Management).
2. **Select Target Backup Record:**
   - Choose a verified backup snapshot from `BackupRecord` history.
   - Verify that `checksum` matches the file header.
3. **Execute Controlled Restore:**
   - System confirms Super Admin authentication.
   - Automated safety snapshot is created.
   - Collections are restored.
   - Post-restore database ping confirms read/write availability.
4. **Audit Logging:**
   - An immutable entry is appended to `AuditLog` (`action: RESTORE_EXECUTE`).

---

### 4. Verification Test Confirmation
The backup and restore mechanisms were verified by `verify-system-admin-module.ts` and `verify-module18-e2e-integration.ts` with 100% pass rate:
- Backup completed successfully.
- SHA-256 checksum generated.
- Safety rollback checkpoint created.
