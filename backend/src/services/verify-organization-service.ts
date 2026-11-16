import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { OrganizationModel } from '../models/Organization';
import { UserModel } from '../models/User';
import { OrganizationService } from './OrganizationService';

async function runOrganizationServiceVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  MODULE 01: ORGANIZATION PROFILE MANAGEMENT VERIFICATION SUITE');
  console.log('  (Multi-Org, Branding, Banks, Signatures, Stamps, Stats & Isolation)');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  await connectDatabase();
  const runId = Date.now().toString().slice(-5);

  try {
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  1. Seed Default Organization');
    console.log('────────────────────────────────────────────────────────────────────────');

    const defaultOrg = await OrganizationService.ensureDefaultOrganization();
    assert(!!defaultOrg, 'Default organization successfully ensured');
    assert(defaultOrg.isDefault === true, 'Default organization has isDefault === true');
    assert(defaultOrg.currency === 'BDT', 'Default currency is BDT');
    assert(defaultOrg.country === 'Bangladesh', 'Default country is Bangladesh');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  2. Create Second Organization');
    console.log('────────────────────────────────────────────────────────────────────────');

    const newOrgCode = `ORG${runId}`;
    const createdOrg = await OrganizationService.createOrganization(
      {
        organizationCode: newOrgCode,
        legalName: `Sun Bird Diagnostic Care Ltd. ${runId}`,
        displayName: 'Sun Bird Diagnostic Care',
        organizationType: 'PRIVATE_LIMITED',
        registrationNumber: `REG-${runId}`,
        tradeLicenseNumber: `TRAD-${runId}`,
        tinNumber: `TIN-${runId}`,
        binNumber: `BIN-${runId}`,
        email: `care.${runId}@sunbirdbd.com`,
        phone: '+880 1711-000000',
        address: 'Plot 45, Gulshan Avenue, Dhaka-1212',
        city: 'Dhaka',
        district: 'Dhaka',
        country: 'Bangladesh',
        status: 'ACTIVE',
        isDefault: false,
      },
      'TEST_SUPER_ADMIN',
      'SUPER_ADMIN'
    );

    assert(createdOrg.organizationCode === newOrgCode, 'Second organization created with unique code');
    assert(createdOrg.isDefault === false, 'Second organization correctly created as non-default');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  3. Update Organization Profile');
    console.log('────────────────────────────────────────────────────────────────────────');

    const updatedOrg = await OrganizationService.updateOrganization(
      createdOrg._id.toString(),
      {
        displayName: 'Sun Bird Diagnostic & Imaging Center',
        website: 'https://imaging.sunbirdbd.com',
      },
      'TEST_SUPER_ADMIN',
      'SUPER_ADMIN'
    );

    assert(
      updatedOrg.displayName === 'Sun Bird Diagnostic & Imaging Center',
      'Organization display name updated'
    );
    assert(
      updatedOrg.website === 'https://imaging.sunbirdbd.com',
      'Organization website updated'
    );

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  4. Manage Bank Accounts');
    console.log('────────────────────────────────────────────────────────────────────────');

    const withBank = await OrganizationService.addBankAccount(
      createdOrg._id.toString(),
      {
        bankName: 'Eastern Bank Ltd.',
        branchName: 'Gulshan Branch',
        accountName: 'Sun Bird Diagnostic Care Ltd.',
        accountNumber: `10410100${runId}`,
        routingNumber: '095271342',
        accountType: 'CURRENT',
        currency: 'BDT',
        isActive: true,
        isDefault: true,
      },
      'TEST_SUPER_ADMIN',
      'SUPER_ADMIN'
    );

    assert(withBank.bankAccounts.length === 1, 'Bank account added successfully');
    const addedBank = withBank.bankAccounts[0];
    assert(addedBank.bankName === 'Eastern Bank Ltd.', 'Bank name matches Eastern Bank Ltd.');
    assert(addedBank.isDefault === true, 'Bank account marked as default');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  5. Manage Signatories and Stamps');
    console.log('────────────────────────────────────────────────────────────────────────');

    const withSig = await OrganizationService.addSignatory(
      createdOrg._id.toString(),
      {
        personName: 'Dr. Rafiqul Islam',
        designation: 'Managing Director & Radiologist',
        signatureImageUrl: 'https://placehold.co/200x80/png?text=Rafiqul+Sig',
        isActive: true,
        applicableDocuments: ['QUOTATION', 'INVOICE'],
      },
      'TEST_SUPER_ADMIN',
      'SUPER_ADMIN'
    );

    assert(withSig.signatories.length === 1, 'Signatory added');
    assert(withSig.signatories[0].personName === 'Dr. Rafiqul Islam', 'Signatory name verified');

    const withStamp = await OrganizationService.addStamp(
      createdOrg._id.toString(),
      {
        stampName: 'Diagnostic Seal',
        stampType: 'OFFICIAL',
        stampImageUrl: 'https://placehold.co/100x100/png?text=Diagnostic+Seal',
        isActive: true,
      },
      'TEST_SUPER_ADMIN',
      'SUPER_ADMIN'
    );

    assert(withStamp.stamps.length === 1, 'Official stamp added');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  6. Manage Document Configuration & Branding');
    console.log('────────────────────────────────────────────────────────────────────────');

    const withDocs = await OrganizationService.updateDocumentConfig(
      createdOrg._id.toString(),
      {
        quotationPrefix: 'SBD-QT-',
        invoicePrefix: 'SBD-INV-',
        showStampOnInvoice: true,
        showBankDetailsOnInvoice: true,
      },
      'TEST_SUPER_ADMIN',
      'SUPER_ADMIN'
    );

    assert(withDocs.documentConfig.quotationPrefix === 'SBD-QT-', 'Document prefix updated');

    const withBranding = await OrganizationService.updateBranding(
      createdOrg._id.toString(),
      {
        primaryColor: '#0c4a6e',
        accentColor: '#38bdf8',
        documentHeader: 'SUN BIRD DIAGNOSTIC CARE LTD. — Gulshan Diagnostics',
      },
      'TEST_SUPER_ADMIN',
      'SUPER_ADMIN'
    );

    assert(withBranding.branding.primaryColor === '#0c4a6e', 'Branding primary color updated');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  7. Status Toggle & Default Switch Safety');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Attempting to deactivate default organization must fail
    let errorCaught = false;
    try {
      await OrganizationService.setStatus(
        defaultOrg._id.toString(),
        'INACTIVE',
        'TEST_SUPER_ADMIN',
        'SUPER_ADMIN'
      );
    } catch {
      errorCaught = true;
    }
    assert(errorCaught, 'Correctly prevented deactivating the default organization');

    // Switch default to the new organization
    const switchedOrg = await OrganizationService.setDefault(
      createdOrg._id.toString(),
      'TEST_SUPER_ADMIN',
      'SUPER_ADMIN'
    );
    assert(switchedOrg.isDefault === true, 'New organization is now default');

    const previousDefault = await OrganizationModel.findById(defaultOrg._id);
    assert(previousDefault?.isDefault === false, 'Previous default organization isDefault became false');

    // Switch back to original default for stability
    await OrganizationService.setDefault(
      defaultOrg._id.toString(),
      'TEST_SUPER_ADMIN',
      'SUPER_ADMIN'
    );

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  8. Organization Dashboard Statistics (Live DB Records)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const stats = await OrganizationService.getDashboardStats();
    assert(stats.totalOrganizations >= 2, `Total organizations count >= 2 (${stats.totalOrganizations})`);
    assert(stats.activeOrganizations >= 2, `Active organizations count >= 2 (${stats.activeOrganizations})`);
    assert(stats.defaultOrganization?.organizationCode === 'SBC-01', 'Default organization in stats is SBC-01');
    assert(stats.financialMetrics.totalSales > 0, `Total sales metric retrieved (${stats.financialMetrics.totalSales})`);
    assert(stats.organizationBreakdown.length >= 2, 'Organization breakdown populated for each company');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  9. Immutable Activity Logs');
    console.log('────────────────────────────────────────────────────────────────────────');

    const logs = await OrganizationService.getActivityLogs(createdOrg._id.toString());
    assert(logs.length > 0, `Activity logs retrieved (${logs.length} entries recorded)`);
    assert(
      logs.some((l) => l.action === 'ORGANIZATION_CREATE'),
      'ORGANIZATION_CREATE action present in audit trail'
    );

    // Clean up test organization
    await OrganizationModel.deleteOne({ _id: createdOrg._id });
    console.log(`Cleaned up temporary test organization ${createdOrg.organizationCode}`);

    console.log('\n════════════════════════════════════════════════════════════════════════');
    console.log(`  VERIFICATION COMPLETE: ${passed} PASSED / ${failed} FAILED`);
    console.log('════════════════════════════════════════════════════════════════════════\n');
  } catch (err: any) {
    console.error('❌ Verification suite encountered unhandled error:', err);
    failed++;
  } finally {
    await disconnectDatabase();
  }
}

runOrganizationServiceVerificationSuite();

