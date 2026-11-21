import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import {
  OrganizationModel as Organization,
  UserModel as User,
  SystemSettings,
  SecurityPolicy,
  BackupRecord,
  RestoreRecord,
  IntegrationConfig,
  FeatureFlag,
  SystemLog,
  DataExchangeJob,
  RefreshTokenModel as RefreshToken,
  LoginHistoryModel as LoginHistory,
  AuditLogModel as AuditLog,
} from '../models';
import { SystemAdminService } from './SystemAdminService';
import logger from '../config/logger';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${message}`);
  } else {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runSystemAdminModuleVerification() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  MODULE 16: SYSTEM ADMINISTRATION & PLATFORM CONFIGURATION TEST SUITE');
  console.log('  Enterprise Administration, Security Center, Backups & Integrations');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  try {
    await connectDatabase();

    // Find or seed a test organization and super admin user
    let org = await Organization.findOne();
    if (!org) {
      org = await Organization.create({
        organizationCode: 'SBC-MAIN',
        legalName: 'Sun Bird Corporation Central Org',
        displayName: 'Sun Bird Corporation',
        organizationType: 'PRIVATE_LIMITED',
        isActive: true,
      });
    }
    const orgId = org._id.toString();

    let admin = await User.findOne({ userType: 'SUPER_ADMIN' });
    if (!admin) {
      admin = await User.create({
        fullName: 'System Super Administrator',
        email: 'superadmin.test@sunbird.com.bd',
        mobile: '+8801700000000',
        userType: 'SUPER_ADMIN',
        isActive: true,
        authorizedOrganizations: [org._id],
      });
    }
    const adminId = admin._id.toString();

    // ─────────────────────────────────────────────────────────────
    // 1. SYSTEM DASHBOARD & LIVE KPI METRICS
    // ─────────────────────────────────────────────────────────────
    console.log('--- 1. Testing System Dashboard & Live KPI Metrics ---');
    const dashboard = await SystemAdminService.getDashboardMetrics(orgId);
    assert(Boolean(dashboard && dashboard.kpi), 'System dashboard KPI metrics returned');
    assert(typeof dashboard.kpi.totalOrganizations === 'number', 'Total organizations metric is computed');
    assert(typeof dashboard.kpi.totalUsers === 'number', 'Total users metric is computed');
    assert(typeof dashboard.kpi.systemUptimeSeconds === 'number', 'System uptime is measured');
    assert(Boolean(dashboard.systemHealth && dashboard.systemHealth.database), 'System health report computed');
    assert(dashboard.systemHealth.backendApi === 'OPERATIONAL', 'Backend API status is OPERATIONAL');

    // ─────────────────────────────────────────────────────────────
    // 2. GENERAL SYSTEM SETTINGS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Testing General System Settings & Localization ---');
    const settings = await SystemAdminService.getSystemSettings();
    assert(Boolean(settings && settings.appName), 'Default system settings bootstrapped');
    assert(settings.defaultLanguage === 'bn' || settings.defaultLanguage === 'en', 'Valid default language set');
    assert(settings.currency.code === 'BDT', 'Currency configured to BDT');

    const updatedSettings = await SystemAdminService.updateSystemSettings(
      {
        appName: 'SUN BIRD Corporation Global Cloud ERP',
        defaultPaginationSize: 50,
      },
      adminId
    );
    assert(updatedSettings.appName === 'SUN BIRD Corporation Global Cloud ERP', 'System settings appName updated');
    assert(updatedSettings.defaultPaginationSize === 50, 'Pagination size updated to 50');

    // ─────────────────────────────────────────────────────────────
    // 3. SECURITY POLICY & PASSWORD POLICIES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Testing Enterprise Security Policy ---');
    const policy = await SystemAdminService.getSecurityPolicy();
    assert(Boolean(policy && policy.minPasswordLength), 'Default security policy bootstrapped');
    assert(policy.failedLoginLockoutThreshold === 5, 'Failed login lockout threshold verified');

    const updatedPolicy = await SystemAdminService.updateSecurityPolicy(
      {
        minPasswordLength: 10,
        lockoutDurationMinutes: 45,
      },
      adminId
    );
    assert(updatedPolicy.minPasswordLength === 10, 'Password minimum length updated to 10');
    assert(updatedPolicy.lockoutDurationMinutes === 45, 'Lockout duration updated to 45 mins');

    // ─────────────────────────────────────────────────────────────
    // 4. DATABASE MONITORING
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Testing Database Monitoring & Collection Metrics ---');
    const dbMetrics = await SystemAdminService.getDatabaseMonitoringMetrics();
    assert(Boolean(dbMetrics && dbMetrics.databaseName), 'Database monitoring metrics returned');
    assert(dbMetrics.status === 'HEALTHY', 'MongoDB status is HEALTHY');
    assert(Array.isArray(dbMetrics.collections), 'Collections array returned');
    assert(dbMetrics.totalCollectionsListed >= 0, 'Collection count reported safely');

    // ─────────────────────────────────────────────────────────────
    // 5. DATABASE BACKUP MANAGEMENT
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Testing Database Backup Management ---');
    const backup = await SystemAdminService.triggerBackup('MANUAL', adminId);
    assert(Boolean(backup && backup.backupId), 'Backup record generated');
    assert(backup.status === 'COMPLETED', 'Backup completed successfully');
    assert(Boolean(backup.checksum && backup.checksum.startsWith('sha256-')), 'Cryptographic checksum generated');
    assert(backup.sizeBytes > 0, 'Backup size is positive bytes');

    const backupHistory = await SystemAdminService.getBackupHistory(5);
    assert(Array.isArray(backupHistory) && backupHistory.length > 0, 'Backup history retrieved');

    // ─────────────────────────────────────────────────────────────
    // 6. RESTORE OPERATIONS & VERIFICATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 6. Testing Controlled Database Restore Workflow ---');
    const restore = await SystemAdminService.executeRestore({
      backupId: backup.backupId,
      targetEnvironment: 'STAGING',
      confirmedBy: adminId,
    });
    assert(Boolean(restore && restore.restoreId), 'Restore operation executed');
    assert(restore.status === 'COMPLETED', 'Restore status completed');
    assert(Boolean(restore.preRestoreBackupId), 'Automated pre-restore snapshot created for safety');

    const restoreHistory = await SystemAdminService.getRestoreHistory(5);
    assert(Array.isArray(restoreHistory) && restoreHistory.length > 0, 'Restore history retrieved');

    // ─────────────────────────────────────────────────────────────
    // 7. FILE STORAGE METRICS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 7. Testing File Storage Management ---');
    const storageMetrics = await SystemAdminService.getFileStorageMetrics();
    assert(Boolean(storageMetrics && storageMetrics.provider), 'Storage provider reported');
    assert(storageMetrics.maxFileSizeMb === 25, 'Storage size limit verified');
    assert(Array.isArray(storageMetrics.allowedMimeTypes), 'Allowed MIME types listed');

    // ─────────────────────────────────────────────────────────────
    // 8. INTEGRATIONS MANAGEMENT & LIVE PINGS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 8. Testing Integrations Management & Live Diagnostic Pings ---');
    const integrations = await SystemAdminService.getIntegrationsList();
    assert(Array.isArray(integrations) && integrations.length >= 8, 'Standard integration profiles seeded');

    const mongoTest = await SystemAdminService.testIntegration('MONGODB');
    assert(mongoTest.status === 'HEALTHY', 'MongoDB live diagnostic ping is HEALTHY');

    const redisTest = await SystemAdminService.testIntegration('REDIS');
    assert(redisTest.status === 'HEALTHY' || redisTest.status === 'DEGRADED', 'Redis diagnostic test reported');

    const aiTest = await SystemAdminService.testIntegration('GEMINI_AI');
    assert(Boolean(aiTest && aiTest.status), 'Gemini AI integration status evaluated');

    // ─────────────────────────────────────────────────────────────
    // 9. QUEUE & BACKGROUND JOB MONITORING
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 9. Testing Background Job & Queue Monitoring ---');
    const queueMetrics = await SystemAdminService.getQueueMonitoringMetrics();
    assert(Boolean(queueMetrics && queueMetrics.queues), 'Queue monitoring metrics returned');
    assert(queueMetrics.totalQueues === 4, '4 standard queues monitored');
    const emailQ = queueMetrics.queues.find((q) => q.name === 'email-queue');
    assert(Boolean(emailQ), 'Email queue status tracked');

    // ─────────────────────────────────────────────────────────────
    // 10. APPLICATION LOGS & FILTERING
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 10. Testing Application Logs & Event Logging ---');
    await SystemAdminService.logSystemEvent({
      severity: 'WARN',
      service: 'ERP_TEST',
      module: 'SYSTEM',
      message: 'Test automated warning log event for Module 16',
      organizationId: orgId,
      userId: adminId,
    });

    const logsResult = await SystemAdminService.getApplicationLogs({
      module: 'SYSTEM',
      limit: 10,
    });
    assert(Array.isArray(logsResult.logs) && logsResult.logs.length > 0, 'System logs retrieved with pagination');
    assert(logsResult.pagination.total > 0, 'Total logs count computed');

    // ─────────────────────────────────────────────────────────────
    // 11. FEATURE FLAGS & CENTRAL TOGGLES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 11. Testing Central Feature Flags ---');
    const flags = await SystemAdminService.getFeatureFlags();
    assert(Array.isArray(flags) && flags.length >= 6, 'Standard enterprise feature flags seeded');

    const toggled = await SystemAdminService.toggleFeatureFlag(
      'COMMERCIAL_LC_RADAR',
      false,
      adminId,
      'Temporary test toggle'
    );
    assert(toggled?.isGloballyEnabled === false, 'Feature flag successfully toggled to false');
    assert(toggled?.changeHistory.length! > 0, 'Feature flag audit change history preserved');

    // Re-enable
    await SystemAdminService.toggleFeatureFlag('COMMERCIAL_LC_RADAR', true, adminId);

    // ─────────────────────────────────────────────────────────────
    // 12. DATA IMPORT & EXPORT JOBS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 12. Testing Data Import & Export Administration ---');
    const exportJob = await SystemAdminService.createDataExchangeJob({
      jobType: 'EXPORT',
      entityType: 'PRODUCT',
      format: 'CSV',
      organizationId: orgId,
      requestedBy: adminId,
    });
    assert(Boolean(exportJob && exportJob.jobId), 'Data export job created');
    assert(exportJob.status === 'COMPLETED', 'Export job completed with valid URL');

    const exchangeHistory = await SystemAdminService.getDataExchangeHistory(orgId, 5);
    assert(Array.isArray(exchangeHistory) && exchangeHistory.length > 0, 'Data exchange history retrieved');

    // ─────────────────────────────────────────────────────────────
    // 13. SESSION MANAGEMENT & REVOCATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 13. Testing Session Management & Revocation ---');
    // Create a mock active session
    const testSession = await RefreshToken.create({
      userId: admin._id,
      tokenHash: 'test_hash_' + Date.now(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isRevoked: false,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });
    assert(Boolean(testSession && testSession._id), 'Test active user session created');

    const sessions = await SystemAdminService.getActiveSessions(10);
    assert(Array.isArray(sessions) && sessions.length > 0, 'Active sessions list retrieved');

    const revoked = await SystemAdminService.revokeSession(testSession._id.toString(), adminId);
    assert(revoked === true, 'Session successfully revoked by administrator');

    const checkRevoked = await RefreshToken.findById(testSession._id);
    assert(checkRevoked?.isRevoked === true, 'Session is marked revoked in database');

    // ─────────────────────────────────────────────────────────────
    // 14. LOGIN HISTORY & AUDIT TRAIL
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 14. Testing Login History & Audit Integration ---');
    await LoginHistory.create({
      userId: admin._id,
      email: admin.email,
      ipAddress: '192.168.1.105',
      userAgent: 'Chrome 124.0.0.0',
      status: 'SUCCESS',
      organizationId: org._id,
    });

    const loginHist = await SystemAdminService.getLoginHistory({ limit: 5 });
    assert(Array.isArray(loginHist.records) && loginHist.records.length > 0, 'Login history records retrieved');

    const latestAudit = await AuditLog.findOne({ module: 'SYSTEM' }).sort({ createdAt: -1 });
    assert(Boolean(latestAudit), 'System administration actions logged to immutable AuditLog collection');

    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log(`  MODULE 16: ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('═══════════════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Verification failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runSystemAdminModuleVerification();
