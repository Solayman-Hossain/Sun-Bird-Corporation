import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { RoleModel } from '../models/Role';
import { UserModel } from '../models/User';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { WarehouseModel } from '../models/Warehouse';
import { ProductModel } from '../models/Product';
import { UomConversionModel } from '../models/UomConversion';
import { CounterModel } from '../models/Counter';
import logger from '../config/logger';

export async function runMasterSeeder() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  SUN BIRD CORPORATION — ENTERPRISE DATABASE MASTER SEEDER');
  console.log('  (Idempotent Master Data Provisioning for 2026 Cloud ERP)');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  await connectDatabase();

  try {
    // ── 1. Roles & Permissions Master ───────────────────────────────────────
    console.log('--- Seeding Roles & Permissions ---');
    const rolesData = [
      {
        roleName: 'Super Admin',
        slug: 'super-admin',
        description: 'Global system administrator with unrestricted ERP access',
        permissions: [
          { module: '*', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT'] },
        ],
        isSystemRole: true,
        isActive: true,
      },
      {
        roleName: 'Managing Director',
        slug: 'managing-director',
        description: 'Executive head with Tier 4 Quorum & emergency override signing authority',
        permissions: [
          { module: '*', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT'] },
        ],
        isSystemRole: true,
        isActive: true,
      },
      {
        roleName: 'Director of Finance',
        slug: 'director-finance',
        description: 'Financial director with Quorum signing and GL reconciliation authority',
        permissions: [
          { module: 'ACCOUNTING', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT'] },
          { module: 'APPROVALS', actions: ['CREATE', 'READ', 'UPDATE', 'APPROVE'] },
          { module: 'REPORTS', actions: ['READ', 'EXPORT'] },
        ],
        isSystemRole: true,
        isActive: true,
      },
      {
        roleName: 'Inventory Manager',
        slug: 'inventory-manager',
        description: 'Warehouse supervisor managing batches, stock movements, and serials',
        permissions: [
          { module: 'INVENTORY', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT'] },
          { module: 'PRODUCTS', actions: ['CREATE', 'READ', 'UPDATE', 'EXPORT'] },
          { module: 'WAREHOUSES', actions: ['READ', 'UPDATE'] },
        ],
        isSystemRole: false,
        isActive: true,
      },
      {
        roleName: 'Accounts Officer',
        slug: 'accounts-officer',
        description: 'Finance staff preparing journal vouchers, bank entries, and VAT records',
        permissions: [
          { module: 'ACCOUNTING', actions: ['CREATE', 'READ', 'UPDATE', 'EXPORT'] },
          { module: 'REPORTS', actions: ['READ', 'EXPORT'] },
        ],
        isSystemRole: false,
        isActive: true,
      },
      {
        roleName: 'Sales Executive',
        slug: 'sales-executive',
        description: 'Commercial sales representative generating B2B leads and quotations',
        permissions: [
          { module: 'SALES', actions: ['CREATE', 'READ', 'UPDATE', 'EXPORT'] },
          { module: 'CRM', actions: ['CREATE', 'READ', 'UPDATE'] },
          { module: 'CUSTOMERS', actions: ['CREATE', 'READ', 'UPDATE'] },
        ],
        isSystemRole: false,
        isActive: true,
      },
      {
        roleName: 'POS Cashier',
        slug: 'pos-cashier',
        description: 'Showroom cashier executing retail checkouts and POS challans',
        permissions: [
          { module: 'POS', actions: ['CREATE', 'READ', 'UPDATE'] },
          { module: 'SALES', actions: ['CREATE', 'READ'] },
        ],
        isSystemRole: false,
        isActive: true,
      },
      {
        roleName: 'HR Officer',
        slug: 'hr-officer',
        description: 'Human resources personnel managing staff onboarding and attendance',
        permissions: [
          { module: 'HRM', actions: ['CREATE', 'READ', 'UPDATE', 'APPROVE', 'EXPORT'] },
        ],
        isSystemRole: false,
        isActive: true,
      },
    ];

    const roleMap: Record<string, any> = {};
    for (const r of rolesData) {
      const doc = await RoleModel.findOneAndUpdate(
        { slug: r.slug },
        { $set: r },
        { upsert: true, new: true }
      );
      roleMap[r.slug] = doc._id;
    }
    console.log(`✅ Roles seeded (${Object.keys(roleMap).length} system roles)`);

    // ── 2. Super Admin & Directors ──────────────────────────────────────────
    console.log('\n--- Seeding Executive Directors & Super Admin ---');
    const defaultPasswordHash = await bcrypt.hash('SunBird@2026', 10);

    const initialUsers = [
      {
        mobile: '01700000001',
        fullName: 'System Super Administrator',
        email: 'admin@sunbird.com',
        passwordHash: defaultPasswordHash,
        userType: 'SUPER_ADMIN' as const,
        roleId: roleMap['super-admin'],
        totpSecret: 'JBSWY3DPEHPK3PXP',
        isActive: true,
        isMobileVerified: true,
      },
      {
        mobile: '01700000002',
        fullName: 'Engr. Mahbubur Rahman',
        email: 'md@sunbird.com',
        passwordHash: defaultPasswordHash,
        userType: 'DIRECTOR' as const,
        directorRole: 'MD' as const,
        roleId: roleMap['managing-director'],
        totpSecret: 'JBSWY3DPEHPK3PXP',
        isActive: true,
        isMobileVerified: true,
      },
      {
        mobile: '01700000003',
        fullName: 'Nasir Uddin Ahmed, FCA',
        email: 'finance.director@sunbird.com',
        passwordHash: defaultPasswordHash,
        userType: 'DIRECTOR' as const,
        directorRole: 'DIRECTOR_FINANCE' as const,
        roleId: roleMap['director-finance'],
        totpSecret: 'JBSWY3DPEHPK3PXP',
        isActive: true,
        isMobileVerified: true,
      },
      {
        mobile: '01700000004',
        fullName: 'Syed Tanvir Hossain',
        email: 'admin.director@sunbird.com',
        passwordHash: defaultPasswordHash,
        userType: 'DIRECTOR' as const,
        directorRole: 'DIRECTOR_ADMIN' as const,
        roleId: roleMap['super-admin'],
        totpSecret: 'JBSWY3DPEHPK3PXP',
        isActive: true,
        isMobileVerified: true,
      },
    ];

    for (const u of initialUsers) {
      await UserModel.findOneAndUpdate(
        { email: u.email },
        { $set: u },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Executive users seeded (Super Admin, MD, Finance & Admin Directors)`);

    // ── 3. Standard 35 Chart of Accounts ────────────────────────────────────
    console.log('\n--- Seeding Standard 35 Chart of Accounts (COA) ---');
    const coaData = [
      // ASSETS (1010 - 1510)
      { accountCode: 1010, accountName: 'Cash in Hand (Central Vault)', accountType: 'ASSET', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 1020, accountName: 'Bank Accounts (Current / Operating)', accountType: 'ASSET', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 1030, accountName: 'Bank & MFS Clearing (bKash/Nagad/SSLCOMMERZ)', accountType: 'ASSET', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 1100, accountName: 'Accounts Receivable (Trade Debtors)', accountType: 'ASSET', normalBalance: 'DEBIT', isControl: true },
      { accountCode: 1200, accountName: 'Merchandise Inventory (Medical Devices & Reagents)', accountType: 'ASSET', normalBalance: 'DEBIT', isControl: true },
      { accountCode: 1300, accountName: 'Advance Tax & VAT Input Credit (Mushak-6.3)', accountType: 'ASSET', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 1310, accountName: 'Security Deposits & Import LC Margin', accountType: 'ASSET', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 1400, accountName: 'Prepaid Expenses & General Advances', accountType: 'ASSET', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 1420, accountName: 'Employee Advance / Loan Recoveries', accountType: 'ASSET', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 1500, accountName: 'Property, Plant & Equipment (PPE)', accountType: 'ASSET', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 1510, accountName: 'Accumulated Depreciation — PPE', accountType: 'ASSET', normalBalance: 'CREDIT', isControl: false },

      // LIABILITIES (2010 - 2500)
      { accountCode: 2010, accountName: 'Accounts Payable — Local Suppliers', accountType: 'LIABILITY', normalBalance: 'CREDIT', isControl: true },
      { accountCode: 2020, accountName: 'Accounts Payable — Import LC Foreign Creditors', accountType: 'LIABILITY', normalBalance: 'CREDIT', isControl: true },
      { accountCode: 2050, accountName: 'VAT / Tax Output Payable', accountType: 'LIABILITY', normalBalance: 'CREDIT', isControl: false },
      { accountCode: 2100, accountName: 'Salaries & Allowances Payable', accountType: 'LIABILITY', normalBalance: 'CREDIT', isControl: false },
      { accountCode: 2200, accountName: 'Short-Term Bank Borrowings & Overdrafts', accountType: 'LIABILITY', normalBalance: 'CREDIT', isControl: false },
      { accountCode: 2300, accountName: 'Long-Term Term Loans & Leases', accountType: 'LIABILITY', normalBalance: 'CREDIT', isControl: false },
      { accountCode: 2310, accountName: 'VAT Output Payable (15% Standard)', accountType: 'LIABILITY', normalBalance: 'CREDIT', isControl: false },
      { accountCode: 2400, accountName: 'Customer Advances & Showroom Booking Deposits', accountType: 'LIABILITY', normalBalance: 'CREDIT', isControl: false },
      { accountCode: 2500, accountName: 'Accrued Expenses & Other Liabilities', accountType: 'LIABILITY', normalBalance: 'CREDIT', isControl: false },

      // EQUITY (3010 - 3200)
      { accountCode: 3010, accountName: "Partners' Capital Account", accountType: 'EQUITY', normalBalance: 'CREDIT', isControl: false },
      { accountCode: 3020, accountName: "Partners' Current / Drawings Account", accountType: 'EQUITY', normalBalance: 'CREDIT', isControl: false },
      { accountCode: 3100, accountName: 'Retained Earnings', accountType: 'EQUITY', normalBalance: 'CREDIT', isControl: false },
      { accountCode: 3200, accountName: 'General Reserve Fund', accountType: 'EQUITY', normalBalance: 'CREDIT', isControl: false },

      // REVENUE (4010 - 4100)
      { accountCode: 4010, accountName: 'Sales Revenue — Medical Devices & Equipment', accountType: 'REVENUE', normalBalance: 'CREDIT', isControl: false },
      { accountCode: 4020, accountName: 'Sales Revenue — Diagnostic Reagents & Consumables', accountType: 'REVENUE', normalBalance: 'CREDIT', isControl: false },
      { accountCode: 4030, accountName: 'After-Sales Service & Maintenance Revenue', accountType: 'REVENUE', normalBalance: 'CREDIT', isControl: false },
      { accountCode: 4095, accountName: 'Foreign Exchange Realized Gain', accountType: 'REVENUE', normalBalance: 'CREDIT', isControl: false },
      { accountCode: 4100, accountName: 'Miscellaneous Income & Bank Interest', accountType: 'REVENUE', normalBalance: 'CREDIT', isControl: false },

      // EXPENSES (5010 - 6510)
      { accountCode: 5010, accountName: 'Cost of Goods Sold (COGS) — Medical Devices', accountType: 'EXPENSE', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 5020, accountName: 'Freight, Clearing & Customs Duty (Landed Cost)', accountType: 'EXPENSE', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 6010, accountName: 'Salaries & Statutory Allowances', accountType: 'EXPENSE', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 6020, accountName: 'Sales Commissions', accountType: 'EXPENSE', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 6110, accountName: 'Staff Basic Salary Expense', accountType: 'EXPENSE', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 6120, accountName: 'House Rent & Conveyance Allowance Expense', accountType: 'EXPENSE', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 6200, accountName: 'Office Rent & Utilities', accountType: 'EXPENSE', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 6210, accountName: 'Marketing, Advertising & Hospital Promotion', accountType: 'EXPENSE', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 6300, accountName: 'Depreciation Expense (Straight-Line Method)', accountType: 'EXPENSE', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 6400, accountName: 'Bank Charges, LC Commission & Gateway Fees', accountType: 'EXPENSE', normalBalance: 'DEBIT', isControl: false },
      { accountCode: 6510, accountName: 'Foreign Exchange Realized Loss', accountType: 'EXPENSE', normalBalance: 'DEBIT', isControl: false },
    ];

    for (const coa of coaData) {
      await ChartOfAccountsModel.findOneAndUpdate(
        { accountCode: coa.accountCode },
        { $set: { ...coa, isActive: true } },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Chart of Accounts seeded (${coaData.length} statutory double-entry accounts)`);

    // ── 4. Central & Regional Warehouses ────────────────────────────────────
    console.log('\n--- Seeding Warehouses & Showroom Branches ---');
    const warehouseData = [
      {
        warehouseCode: 'WH-DAC-CENTRAL',
        name: 'Tejgaon Central Depot',
        type: 'CENTRAL' as const,
        address: 'Plot 14, Industrial Area, Tejgaon, Dhaka',
        district: 'Dhaka',
        isCentralHub: true,
        contactPerson: 'Sultan Mahmud (Chief Store Officer)',
        mobile: '01811000001',
        capacityCbf: 25000,
        binCount: 450,
        location: {
          type: 'Point' as const,
          coordinates: [90.3921, 23.7594],
        },
        gpsLatitude: 23.7594,
        gpsLongitude: 90.3921,
        geofenceRadiusMeters: 50,
        isActive: true,
      },
      {
        warehouseCode: 'WH-DAC-BANANI',
        name: 'Banani Showroom & Retail Outlet',
        type: 'OUTLET' as const,
        address: 'House 42, Road 11, Block C, Banani, Dhaka',
        district: 'Dhaka',
        isCentralHub: false,
        contactPerson: 'Fahim Morshed (Showroom Manager)',
        mobile: '01811000002',
        capacityCbf: 5000,
        binCount: 120,
        location: {
          type: 'Point' as const,
          coordinates: [90.4066, 23.7937],
        },
        gpsLatitude: 23.7937,
        gpsLongitude: 90.4066,
        geofenceRadiusMeters: 50,
        isActive: true,
      },
      {
        warehouseCode: 'WH-CTG-DEPOT',
        name: 'Chittagong Regional Distribution Depot',
        type: 'BRANCH' as const,
        address: 'Amanat Tower, 84 Agrabad C/A, Chittagong',
        district: 'Chittagong',
        isCentralHub: false,
        contactPerson: 'Rashedul Karim (Regional Lead)',
        mobile: '01811000003',
        capacityCbf: 15000,
        binCount: 250,
        location: {
          type: 'Point' as const,
          coordinates: [91.7832, 22.3569],
        },
        gpsLatitude: 22.3569,
        gpsLongitude: 91.7832,
        geofenceRadiusMeters: 50,
        isActive: true,
      },
    ];

    for (const wh of warehouseData) {
      await WarehouseModel.findOneAndUpdate(
        { warehouseCode: wh.warehouseCode },
        { $set: wh },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Warehouses seeded (${warehouseData.length} locations with GPS geofencing)`);

    // ── 5. Sample Products (Medical & Diagnostic SKUs) ──────────────────────
    console.log('\n--- Seeding Medical & Diagnostic Master Products ---');
    const productsData = [
      {
        sku: 'MED-ECG-001',
        nameEn: '12-Lead Digital ECG Machine',
        nameBn: '১২-লিড ডিজিটাল ইসিজি মেশিন',
        brand: 'Mindray',
        category: 'Medical Equipment',
        hsCode: '90189010',
        baseUom: 'PCS',
        isMedical: true,
        isExpirable: false,
        minStockQty: 2,
        retailPrice: 185000,
        showroomPrice: 180000,
        resellerTierPrices: [
          { tier: 1 as const, price: 170000 },
          { tier: 2 as const, price: 165000 },
          { tier: 3 as const, price: 160000 },
        ],
        barcodes: ['8901234567890'],
        seoContent: {
          metaTitle: 'Mindray 12-Lead ECG Machine Bangladesh | Sun Bird Corp',
          metaDescription: 'Mindray ECG Machine for hospitals and clinics. Best price in BD.',
          descriptionEn: 'Professional grade 12-lead digital ECG machine with thermal printer.',
          descriptionBn: 'পেশাদার গ্রেডের ১২-লিড ডিজিটাল ইসিজি মেশিন।',
        },
        isActive: true,
      },
      {
        sku: 'MED-PULSE-002',
        nameEn: 'Hospital Bedside Patient Monitor (Multi-Para)',
        nameBn: 'হাসপাতাল মাল্টি-প্যারা পেশেন্ট মনিটর',
        brand: 'Edan',
        category: 'Medical Equipment',
        hsCode: '90181900',
        baseUom: 'PCS',
        isMedical: true,
        isExpirable: false,
        minStockQty: 5,
        retailPrice: 75000,
        showroomPrice: 72000,
        resellerTierPrices: [
          { tier: 1 as const, price: 68000 },
          { tier: 2 as const, price: 65000 },
        ],
        barcodes: ['8901234567891'],
        isActive: true,
      },
      {
        sku: 'MED-SYR-003',
        nameEn: 'Auto-Disable Disposable Syringes 5ml (Box of 100)',
        nameBn: 'অটো-ডিজেবল ডিসপোজেবল সিরিঞ্জ ৫ মি.লি.',
        brand: 'Sun Bird Health',
        category: 'Medical Consumables',
        hsCode: '90183100',
        baseUom: 'BOX',
        isMedical: true,
        isExpirable: true,
        minStockQty: 50,
        retailPrice: 450,
        showroomPrice: 420,
        resellerTierPrices: [
          { tier: 1 as const, price: 380 },
          { tier: 2 as const, price: 350 },
        ],
        barcodes: ['8901234567892'],
        isActive: true,
      },
      {
        sku: 'DIAG-RGT-004',
        nameEn: 'Clinical Chemistry Lipid Profile Reagent Kit',
        nameBn: 'ক্লিনিক্যাল কেমিস্ট্রি লিপিড প্রোফাইল রিএজেন্ট কিট',
        brand: 'Biobase',
        category: 'Diagnostic Reagents',
        hsCode: '38220000',
        baseUom: 'KIT',
        isMedical: true,
        isExpirable: true,
        minStockQty: 20,
        retailPrice: 4800,
        showroomPrice: 4500,
        resellerTierPrices: [
          { tier: 1 as const, price: 4100 },
          { tier: 2 as const, price: 3900 },
        ],
        barcodes: ['8901234567893'],
        isActive: true,
      },
    ];

    for (const p of productsData) {
      await ProductModel.findOneAndUpdate(
        { sku: p.sku },
        { $set: p },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Master Products seeded (${productsData.length} Medical SKUs with NBR HS Codes)`);

    // ── 6. UOM Conversion Master ────────────────────────────────────────────
    console.log('\n--- Seeding Multi-UOM Conversion Rules ---');
    const uomData = [
      {
        fromUom: 'CARTON',
        toUom: 'BOX',
        conversionFactor: 24, // 1 Carton = 24 Boxes
        roundingRule: 'ROUND' as const,
        description: 'Syringes Carton to Box conversion',
      },
      {
        fromUom: 'BOX',
        toUom: 'PCS',
        conversionFactor: 100, // 1 Box = 100 Pieces
        roundingRule: 'ROUND' as const,
        description: 'Box to Piece conversion',
      },
    ];

    for (const uom of uomData) {
      await UomConversionModel.findOneAndUpdate(
        { fromUom: uom.fromUom, toUom: uom.toUom },
        { $set: uom },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ UOM conversion rules seeded (Carton -> Box -> PCS)`);

    // ── 7. Sequence Counters Initialized for 2026 ───────────────────────────
    console.log('\n--- Seeding Sequence Counters for Year 2026 ---');
    const counterCodes = ['CH', 'INV', 'JV', 'PO', 'PR', 'CRM', 'AR', 'WH', 'LC'];
    const currentYear = 2026;

    for (const code of counterCodes) {
      const counterId = `${code}_${currentYear}`;
      await CounterModel.findOneAndUpdate(
        { _id: counterId },
        { $setOnInsert: { _id: counterId, seq: 0 } },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Sequence Counters initialized for 2026 (${counterCodes.join(', ')})`);

    console.log('\n════════════════════════════════════════════════════════════════════════');
    console.log('  MASTER SEEDING COMPLETED SUCCESSFULLY! ALL DATA PERSISTED.');
    console.log('════════════════════════════════════════════════════════════════════════\n');
  } catch (err: any) {
    logger.error('Error in Master Seeder:', err);
    console.error('❌ Master Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

// Auto-run if executed directly via CLI
if (require.main === module) {
  runMasterSeeder();
}

export default runMasterSeeder;
