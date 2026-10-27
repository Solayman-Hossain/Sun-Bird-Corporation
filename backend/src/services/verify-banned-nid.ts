import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { BannedNidModel } from '../models/BannedNid';
import { VerificationLogService } from './VerificationLogService';
import { hashNid } from '../models/VerificationLog';

async function runBannedNidVerificationTests() {
  console.log('=== STARTING BANNED NID MODEL & SERVICE TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  const testNid = '19901234567890123';
  const dummyAdminId = new Types.ObjectId();

  try {
    await connectDatabase().catch(() => {});

    // Clean up
    const targetHash = hashNid(testNid);
    await BannedNidModel.deleteMany({ nidHash: targetHash });

    // Step 1: Verify Schema & Indexes
    console.log('--- 1. BannedNid Model & Index Verification ---');
    const indexes = BannedNidModel.schema.indexes();
    const hasUniqueNidHashIndex = indexes.some(
      ([spec, opts]) => (spec as any).nidHash === 1 && opts?.unique === true
    );
    assert(hasUniqueNidHashIndex, 'BannedNid has unique index on { nidHash: 1 }');

    // Step 2: Initially not banned
    console.log('\n--- 2. Query Non-Banned NID ---');
    const initiallyBanned = await VerificationLogService.isNidBanned(testNid);
    assert(initiallyBanned === false, 'Fresh NID is not banned');

    // Step 3: Ban NID via Service
    console.log('\n--- 3. Ban NID & Verify Persistence ---');
    const banRecord = await VerificationLogService.banNid({
      nid: testNid,
      reason: 'Fraudulent loan application with forged documents',
      bannedBy: dummyAdminId,
    });

    assert(Boolean(banRecord), 'Ban record created');
    assert(banRecord.nidHash === targetHash, 'nidHash matches SHA-256 salted hash');
    assert(banRecord.reason.includes('Fraudulent loan'), 'Ban reason stored correctly');
    assert(banRecord.bannedBy.equals(dummyAdminId), 'bannedBy admin stored correctly');

    // Step 4: isNidBanned returns true
    console.log('\n--- 4. Verify isNidBanned Returns True ---');
    const isNowBanned = await VerificationLogService.isNidBanned(testNid);
    assert(isNowBanned === true, 'isNidBanned correctly returns true for blacklisted NID');

    // Step 5: Duplicate Ban Handling (Unique Index)
    console.log('\n--- 5. Duplicate Ban Handling (Upsert) ---');
    const updatedBan = await VerificationLogService.banNid({
      nid: testNid,
      reason: 'Updated reason: Verified fraud across multiple accounts',
      bannedBy: dummyAdminId,
    });
    assert(updatedBan.reason.includes('Updated reason'), 'Upsert gracefully updates ban details without duplicate key error');

    const totalCount = await BannedNidModel.countDocuments({ nidHash: targetHash });
    assert(totalCount === 1, 'Only one record exists per banned NID hash (unique guarantee)');

    // Clean up
    await BannedNidModel.deleteMany({ nidHash: targetHash });

  } finally {
    await disconnectDatabase().catch(() => {});
  }

  console.log(`\n========================================`);
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runBannedNidVerificationTests().catch((err) => {
  console.error('BannedNid test failed:', err);
  process.exit(1);
});
