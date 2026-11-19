export interface ModulePermissionDefinition {
  moduleId: string;
  moduleNameEn: string;
  moduleNameBn: string;
  description: string;
  actions: Array<{
    action: string;
    actionLabelEn: string;
    actionLabelBn: string;
    isDangerous?: boolean;
  }>;
}

export const PERMISSION_REGISTRY: ModulePermissionDefinition[] = [
  {
    moduleId: 'products',
    moduleNameEn: 'Products & Catalog',
    moduleNameBn: 'প্রডাক্ট ও ক্যাটালগ',
    description: 'Medical equipment master catalog, DGDA DAR specifications, pricing & tiers',
    actions: [
      { action: 'VIEW', actionLabelEn: 'View Products', actionLabelBn: 'পণ্য দেখুন' },
      { action: 'CREATE', actionLabelEn: 'Create Product', actionLabelBn: 'নতুন পণ্য তৈরি' },
      { action: 'READ', actionLabelEn: 'Read Product Details', actionLabelBn: 'পণ্যের বিবরণী' },
      { action: 'UPDATE', actionLabelEn: 'Update Product', actionLabelBn: 'পণ্য সম্পাদনা' },
      { action: 'DELETE', actionLabelEn: 'Delete Product', actionLabelBn: 'পণ্য মুছে ফেলুন', isDangerous: true },
      { action: 'APPROVE', actionLabelEn: 'DGDA Compliance Approval', actionLabelBn: 'DGDA অনুমোদন' },
      { action: 'EXPORT', actionLabelEn: 'Export Product List', actionLabelBn: 'এক্সপোর্ট করুন' },
    ],
  },
  {
    moduleId: 'inventory',
    moduleNameEn: 'Inventory & FEFO Batches',
    moduleNameBn: 'ইনভেন্টরি ও FEFO ব্যাচ',
    description: 'Multi-warehouse stock ledger, batch expiry tracking, serial numbers, stock transfers',
    actions: [
      { action: 'VIEW', actionLabelEn: 'View Inventory', actionLabelBn: 'ইনভেন্টরি দেখুন' },
      { action: 'READ', actionLabelEn: 'Read Stock Ledger', actionLabelBn: 'লেজার পড়ুন' },
      { action: 'CREATE', actionLabelEn: 'Stock Receive / Inward', actionLabelBn: 'স্টক গ্রহণ' },
      { action: 'UPDATE', actionLabelEn: 'Stock Adjustment', actionLabelBn: 'স্টক সমন্বয়' },
      { action: 'TRANSFER', actionLabelEn: 'Warehouse Transfer', actionLabelBn: 'গুদাম স্থানান্তর' },
      { action: 'APPROVE', actionLabelEn: 'Approve Stock Adjustment', actionLabelBn: 'সমন্বয় অনুমোদন' },
      { action: 'EXPORT', actionLabelEn: 'Export Stock Valuation', actionLabelBn: 'স্টক এক্সপোর্ট' },
    ],
  },
  {
    moduleId: 'sales',
    moduleNameEn: 'Sales & Orders',
    moduleNameBn: 'বিক্রয় ও অর্ডার প্রসেসিং',
    description: 'B2B & B2C sales orders, courier dispatch, delivery challans, gate passes',
    actions: [
      { action: 'VIEW', actionLabelEn: 'View Orders', actionLabelBn: 'অর্ডার দেখুন' },
      { action: 'CREATE', actionLabelEn: 'Create Sales Order', actionLabelBn: 'নতুন অর্ডার' },
      { action: 'UPDATE', actionLabelEn: 'Update Order', actionLabelBn: 'অর্ডার আপডেট' },
      { action: 'APPROVE', actionLabelEn: 'Commercial Credit Approval', actionLabelBn: 'ক্রেডিট অনুমোদন' },
      { action: 'FINALIZE', actionLabelEn: 'Finalize Challan / Gate Pass', actionLabelBn: 'চালান চূড়ান্তকরণ' },
      { action: 'PRINT', actionLabelEn: 'Print Challan / Invoice', actionLabelBn: 'চালান প্রিন্ট' },
      { action: 'CANCEL', actionLabelEn: 'Cancel Order', actionLabelBn: 'অর্ডার বাতিল', isDangerous: true },
      { action: 'EXPORT', actionLabelEn: 'Export Sales History', actionLabelBn: 'বিক্রয় এক্সপোর্ট' },
    ],
  },
  {
    moduleId: 'accounting',
    moduleNameEn: 'Accounts & General Ledger',
    moduleNameBn: 'অ্যাকাউন্টিং ও সাধারণ লেজার',
    description: '5-digit Chart of Accounts, balanced double-entry vouchers, trial balance, partner equity',
    actions: [
      { action: 'VIEW', actionLabelEn: 'View GL & Reports', actionLabelBn: 'লেজার ও রিপোর্ট দেখুন' },
      { action: 'CREATE', actionLabelEn: 'Draft Voucher', actionLabelBn: 'ভাউচার খসড়া তৈরি' },
      { action: 'UPDATE', actionLabelEn: 'Edit Voucher', actionLabelBn: 'ভাউচার সম্পাদনা' },
      { action: 'APPROVE', actionLabelEn: 'Approve Voucher', actionLabelBn: 'ভাউচার অনুমোদন' },
      { action: 'POST', actionLabelEn: 'Post to General Ledger', actionLabelBn: 'লেজারে পোস্ট করুন' },
      { action: 'EXPORT', actionLabelEn: 'Export Financial Statements', actionLabelBn: 'স্টেটমেন্ট এক্সপোর্ট' },
      { action: 'MANAGE_SETTINGS', actionLabelEn: 'Fiscal Year & Tax Settings', actionLabelBn: 'অর্থবছর সেটিংস' },
    ],
  },
  {
    moduleId: 'hrm',
    moduleNameEn: 'HRM & Payroll',
    moduleNameBn: 'এইচ আর ও পে-রোল',
    description: 'Employee directory, attendance logs, monthly salary computation, pay slip generation',
    actions: [
      { action: 'VIEW', actionLabelEn: 'View Employees', actionLabelBn: 'কর্মচারী তালিকা দেখুন' },
      { action: 'CREATE', actionLabelEn: 'Add Employee Profile', actionLabelBn: 'নতুন কর্মচারী যুক্ত' },
      { action: 'UPDATE', actionLabelEn: 'Update Employee', actionLabelBn: 'কর্মচারী তথ্য আপডেট' },
      { action: 'DELETE', actionLabelEn: 'Terminate / Remove', actionLabelBn: 'কর্মচারী অপসারণ', isDangerous: true },
      { action: 'APPROVE', actionLabelEn: 'Approve Payroll Run', actionLabelBn: 'পে-রোল অনুমোদন' },
      { action: 'PROCESS', actionLabelEn: 'Disburse Salary / Generate Slips', actionLabelBn: 'বেতন বিতরণ ও স্লিপ' },
      { action: 'EXPORT', actionLabelEn: 'Export Salary Sheet', actionLabelBn: 'বেতন শিট এক্সপোর্ট' },
    ],
  },
  {
    moduleId: 'procurement',
    moduleNameEn: 'Procurement & Import L/C',
    moduleNameBn: 'সংগ্রহ ও আমদানি এল/সি',
    description: 'Supplier directory, RFQ requests, Purchase Orders, Port customs, Landed Cost calculator',
    actions: [
      { action: 'VIEW', actionLabelEn: 'View POs & LCs', actionLabelBn: 'ক্রয় ও এল/সি দেখুন' },
      { action: 'CREATE', actionLabelEn: 'Create PO / RFQ', actionLabelBn: 'নতুন ক্রয়াদেশ' },
      { action: 'UPDATE', actionLabelEn: 'Update PO', actionLabelBn: 'ক্রয়াদেশ সম্পাদনা' },
      { action: 'APPROVE', actionLabelEn: 'Quorum PO Approval', actionLabelBn: 'কোরাম ক্রয় অনুমোদন' },
      { action: 'REJECT', actionLabelEn: 'Reject PO / RFQ', actionLabelBn: 'ক্রয়াদেশ বাতিল' },
      { action: 'EXPORT', actionLabelEn: 'Export Procurement Reports', actionLabelBn: 'ক্রয় রিপোর্ট এক্সপোর্ট' },
    ],
  },
  {
    moduleId: 'organization',
    moduleNameEn: 'Organization Management',
    moduleNameBn: 'প্রতিষ্ঠানের ব্যবস্থাপনা',
    description: 'Multi-organization profiles, legal details, branding, bank accounts, signatories, stamps',
    actions: [
      { action: 'VIEW', actionLabelEn: 'View Organizations', actionLabelBn: 'প্রতিষ্ঠান দেখুন' },
      { action: 'CREATE', actionLabelEn: 'Create Organization', actionLabelBn: 'নতুন প্রতিষ্ঠান' },
      { action: 'READ', actionLabelEn: 'Read Legal Profile', actionLabelBn: 'প্রোফাইল পড়ুন' },
      { action: 'UPDATE', actionLabelEn: 'Update Profile & Settings', actionLabelBn: 'প্রোফাইল আপডেট' },
      { action: 'DELETE', actionLabelEn: 'Deactivate Organization', actionLabelBn: 'প্রতিষ্ঠান স্থগিত', isDangerous: true },
      { action: 'MANAGE_BANKS', actionLabelEn: 'Manage Bank Accounts', actionLabelBn: 'ব্যাংক হিসাব ব্যবস্থাপনা' },
      { action: 'MANAGE_BRANDING', actionLabelEn: 'Manage Logos & Stamps', actionLabelBn: 'লোগো ও সিল ব্যবস্থাপনা' },
      { action: 'MANAGE_SETTINGS', actionLabelEn: 'Configure Defaults', actionLabelBn: 'ডিফল্ট নির্ধারণ' },
    ],
  },
  {
    moduleId: 'users',
    moduleNameEn: 'User & Access Control',
    moduleNameBn: 'ব্যবহারকারী ও প্রবেশাধিকার',
    description: 'Staff directory, RBAC roles, permission matrix, session revocation, security policies',
    actions: [
      { action: 'VIEW', actionLabelEn: 'View Users & Roles', actionLabelBn: 'ব্যবহারকারী ও রোল দেখুন' },
      { action: 'CREATE', actionLabelEn: 'Create User / Role', actionLabelBn: 'নতুন ব্যবহারকারী/রোল' },
      { action: 'READ', actionLabelEn: 'Read User Details', actionLabelBn: 'ব্যবহারকারী বিবরণ' },
      { action: 'UPDATE', actionLabelEn: 'Edit User / Roles', actionLabelBn: 'ব্যবহারকারী সম্পাদনা' },
      { action: 'DELETE', actionLabelEn: 'Suspend / Delete User', actionLabelBn: 'ব্যবহারকারী স্থগিত', isDangerous: true },
      { action: 'MANAGE_ROLES', actionLabelEn: 'Assign Roles', actionLabelBn: 'রোল নির্ধারণ' },
      { action: 'MANAGE_PERMISSIONS', actionLabelEn: 'Configure Permission Matrix', actionLabelBn: 'পারমিশন ম্যাট্রিক্স' },
      { action: 'RESET_PASSWORD', actionLabelEn: 'Reset User Password', actionLabelBn: 'পাসওয়ার্ড রিসেট', isDangerous: true },
    ],
  },
  {
    moduleId: 'support',
    moduleNameEn: 'Customer Support & RMA',
    moduleNameBn: 'কাস্টমার সাপোর্ট ও ওয়ারেন্টি',
    description: 'Live customer chat, ticket resolution, defective item RMA warranty inspection',
    actions: [
      { action: 'VIEW', actionLabelEn: 'View Support Inbox', actionLabelBn: 'ইনবক্স দেখুন' },
      { action: 'CREATE', actionLabelEn: 'Create Ticket / Claim', actionLabelBn: 'টিকেট তৈরি' },
      { action: 'READ', actionLabelEn: 'Read Chat History', actionLabelBn: 'চ্যাট ইতিহাস' },
      { action: 'UPDATE', actionLabelEn: 'Reply / Update Ticket', actionLabelBn: 'টিকেট উত্তর দিন' },
      { action: 'RESOLVE', actionLabelEn: 'Approve RMA Replacement', actionLabelBn: 'RMA ওয়ারেন্টি অনুমোদন' },
    ],
  },
  {
    moduleId: 'ai',
    moduleNameEn: 'AI Advisor & Automation',
    moduleNameBn: 'এআই সহকারী ও অটোমেশন',
    description: 'Google Gemini 1.5 medical customer support advisor, automated responses, diagnostic recommendations',
    actions: [
      { action: 'VIEW', actionLabelEn: 'View AI Status', actionLabelBn: 'এআই স্ট্যাটাস দেখুন' },
      { action: 'USE', actionLabelEn: 'Use AI Co-Pilot', actionLabelBn: 'এআই কো-পাইলট ব্যবহার' },
      { action: 'CONFIGURE', actionLabelEn: 'Configure Prompts & Keys', actionLabelBn: 'কনফিগারেশন' },
      { action: 'AUDIT_VIEW', actionLabelEn: 'View AI Chat Logs', actionLabelBn: 'এআই অডিট লগ' },
    ],
  },
  {
    moduleId: 'marketing',
    moduleNameEn: 'Banners, Social & Marketing',
    moduleNameBn: 'ব্যানার, সোশ্যাল ও মার্কেটিং',
    description: 'Website banners, homepage sliders, campaigns, promotions, landing pages, CMS content, and social media',
    actions: [
      { action: 'VIEW', actionLabelEn: 'View Marketing Hub', actionLabelBn: 'মার্কেটিং হাব দেখুন' },
      { action: 'CREATE', actionLabelEn: 'Create Banner/Campaign', actionLabelBn: 'ব্যানার ও ক্যাম্পেইন তৈরি' },
      { action: 'READ', actionLabelEn: 'Read Marketing Details', actionLabelBn: 'মার্কেটিং বিবরণ পড়ুন' },
      { action: 'UPDATE', actionLabelEn: 'Edit Marketing Content', actionLabelBn: 'মার্কেটিং কনটেন্ট সম্পাদনা' },
      { action: 'DELETE', actionLabelEn: 'Delete Draft Content', actionLabelBn: 'ড্রাফট কনটেন্ট মুছুন', isDangerous: true },
      { action: 'APPROVE', actionLabelEn: 'Approve Content/Campaigns', actionLabelBn: 'ক্যাম্পেইন ও কনটেন্ট অনুমোদন' },
      { action: 'PUBLISH', actionLabelEn: 'Publish Content Live', actionLabelBn: 'কনটেন্ট প্রকাশ করুন' },
      { action: 'MANAGE_SOCIAL', actionLabelEn: 'Manage Social Media', actionLabelBn: 'সোশ্যাল মিডিয়া পরিচালনা' },
      { action: 'MANAGE_SETTINGS', actionLabelEn: 'Configure Marketing Settings', actionLabelBn: 'মার্কেটিং সেটিংস' },
    ],
  },
  {
    moduleId: 'audit',
    moduleNameEn: 'Audit Trail & Compliance',
    moduleNameBn: 'অডিট ট্রেইল ও নিরাপত্তা',
    description: 'Immutable digital audit logs, security event trails, IP logging, and forensics',
    actions: [
      { action: 'VIEW', actionLabelEn: 'View System Audit Logs', actionLabelBn: 'অডিট লগ দেখুন' },
      { action: 'READ', actionLabelEn: 'Inspect Log Diffs', actionLabelBn: 'লগ ডিটেইলস পড়ুন' },
      { action: 'EXPORT', actionLabelEn: 'Export Audit Trail', actionLabelBn: 'অডিট এক্সপোর্ট' },
    ],
  },
];

/**
 * Standard enterprise role definitions for bootstrapping and presets
 */
export const STANDARD_ROLE_PRESETS = [
  {
    roleName: 'Super Administrator',
    slug: 'super_admin',
    description: 'Full unrestricted system-wide access to all modules and configurations',
    isSystemRole: true,
    permissions: PERMISSION_REGISTRY.map((m) => ({
      module: m.moduleId,
      actions: m.actions.map((a) => a.action),
    })),
  },
  {
    roleName: 'System Administrator',
    slug: 'system_admin',
    description: 'Technical administrator managing users, roles, organizations and settings',
    isSystemRole: true,
    permissions: PERMISSION_REGISTRY.map((m) => ({
      module: m.moduleId,
      actions: m.actions.map((a) => a.action),
    })),
  },
  {
    roleName: 'Managing Director',
    slug: 'managing_director',
    description: 'Executive management with full visibility, approvals and financial oversight',
    isSystemRole: false,
    permissions: PERMISSION_REGISTRY.map((m) => ({
      module: m.moduleId,
      actions: m.actions.map((a) => a.action),
    })),
  },
  {
    roleName: 'General Manager',
    slug: 'general_manager',
    description: 'Operational manager overseeing sales, inventory, procurement and staff',
    isSystemRole: false,
    permissions: [
      { module: 'products', actions: ['VIEW', 'READ', 'UPDATE', 'APPROVE', 'EXPORT'] },
      { module: 'inventory', actions: ['VIEW', 'READ', 'TRANSFER', 'APPROVE', 'EXPORT'] },
      { module: 'sales', actions: ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'FINALIZE', 'PRINT', 'EXPORT'] },
      { module: 'accounting', actions: ['VIEW', 'READ', 'APPROVE', 'EXPORT'] },
      { module: 'hrm', actions: ['VIEW', 'READ', 'APPROVE', 'EXPORT'] },
      { module: 'procurement', actions: ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'EXPORT'] },
      { module: 'organization', actions: ['VIEW', 'READ'] },
      { module: 'users', actions: ['VIEW', 'READ'] },
      { module: 'support', actions: ['VIEW', 'READ', 'UPDATE', 'RESOLVE'] },
      { module: 'audit', actions: ['VIEW', 'READ'] },
    ],
  },
  {
    roleName: 'Finance Manager',
    slug: 'finance_manager',
    description: 'Head of Accounts managing GL, vouchers, financial statements and taxes',
    isSystemRole: false,
    permissions: [
      { module: 'accounting', actions: ['VIEW', 'CREATE', 'READ', 'UPDATE', 'APPROVE', 'POST', 'EXPORT', 'MANAGE_SETTINGS'] },
      { module: 'sales', actions: ['VIEW', 'READ', 'APPROVE', 'FINALIZE', 'PRINT', 'EXPORT'] },
      { module: 'procurement', actions: ['VIEW', 'READ', 'APPROVE', 'EXPORT'] },
      { module: 'hrm', actions: ['VIEW', 'READ', 'APPROVE', 'PROCESS', 'EXPORT'] },
      { module: 'organization', actions: ['VIEW', 'READ', 'MANAGE_BANKS'] },
      { module: 'audit', actions: ['VIEW', 'READ', 'EXPORT'] },
    ],
  },
  {
    roleName: 'Accounts Officer',
    slug: 'accounts_officer',
    description: 'Daily voucher entry, invoice generation, receipts and bank reconciliation',
    isSystemRole: false,
    permissions: [
      { module: 'accounting', actions: ['VIEW', 'CREATE', 'READ', 'UPDATE', 'EXPORT'] },
      { module: 'sales', actions: ['VIEW', 'READ', 'FINALIZE', 'PRINT'] },
      { module: 'organization', actions: ['VIEW', 'READ'] },
    ],
  },
  {
    roleName: 'Sales Manager',
    slug: 'sales_manager',
    description: 'Sales pipeline oversight, credit limits, order approval and quotations',
    isSystemRole: false,
    permissions: [
      { module: 'products', actions: ['VIEW', 'READ', 'EXPORT'] },
      { module: 'sales', actions: ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'FINALIZE', 'PRINT', 'EXPORT'] },
      { module: 'inventory', actions: ['VIEW', 'READ'] },
      { module: 'support', actions: ['VIEW', 'READ', 'UPDATE', 'RESOLVE'] },
    ],
  },
  {
    roleName: 'Sales Executive',
    slug: 'sales_executive',
    description: 'Client order entry, quotation generation and delivery follow-up',
    isSystemRole: false,
    permissions: [
      { module: 'products', actions: ['VIEW', 'READ'] },
      { module: 'sales', actions: ['VIEW', 'CREATE', 'READ', 'PRINT'] },
      { module: 'inventory', actions: ['VIEW', 'READ'] },
    ],
  },
  {
    roleName: 'Store Manager',
    slug: 'store_manager',
    description: 'Central depot warehouse manager, dispatch, challan verification and stock receiving',
    isSystemRole: false,
    permissions: [
      { module: 'inventory', actions: ['VIEW', 'READ', 'CREATE', 'UPDATE', 'TRANSFER', 'APPROVE', 'EXPORT'] },
      { module: 'products', actions: ['VIEW', 'READ'] },
      { module: 'sales', actions: ['VIEW', 'READ', 'FINALIZE', 'PRINT'] },
      { module: 'procurement', actions: ['VIEW', 'READ'] },
    ],
  },
  {
    roleName: 'Inventory Officer',
    slug: 'inventory_officer',
    description: 'Batch entry, expiry monitoring, serial numbering and physical stock checks',
    isSystemRole: false,
    permissions: [
      { module: 'inventory', actions: ['VIEW', 'READ', 'CREATE', 'UPDATE', 'TRANSFER'] },
      { module: 'products', actions: ['VIEW', 'READ'] },
    ],
  },
  {
    roleName: 'Purchase Manager',
    slug: 'purchase_manager',
    description: 'Procurement, RFQ handling, supplier negotiation and foreign LC tracking',
    isSystemRole: false,
    permissions: [
      { module: 'procurement', actions: ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT'] },
      { module: 'products', actions: ['VIEW', 'READ', 'CREATE', 'UPDATE'] },
      { module: 'inventory', actions: ['VIEW', 'READ'] },
    ],
  },
  {
    roleName: 'HR Manager',
    slug: 'hr_manager',
    description: 'Human resources management, employee profiles, attendance and payroll approval',
    isSystemRole: false,
    permissions: [
      { module: 'hrm', actions: ['VIEW', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'PROCESS', 'EXPORT'] },
      { module: 'users', actions: ['VIEW', 'READ'] },
    ],
  },
  {
    roleName: 'HR Officer',
    slug: 'hr_officer',
    description: 'Attendance maintenance, leave tracking and preliminary salary calculation',
    isSystemRole: false,
    permissions: [
      { module: 'hrm', actions: ['VIEW', 'READ', 'UPDATE'] },
    ],
  },
  {
    roleName: 'E-commerce Manager',
    slug: 'ecommerce_manager',
    description: 'Public e-commerce storefront catalog, customer online orders, reviews and courier coordination',
    isSystemRole: false,
    permissions: [
      { module: 'products', actions: ['VIEW', 'READ', 'UPDATE', 'EXPORT'] },
      { module: 'sales', actions: ['VIEW', 'CREATE', 'READ', 'UPDATE', 'FINALIZE', 'PRINT'] },
      { module: 'support', actions: ['VIEW', 'READ', 'UPDATE'] },
    ],
  },
  {
    roleName: 'Customer Support',
    slug: 'customer_support',
    description: 'Live chat support, product inquiries, RMA warranty claims intake',
    isSystemRole: false,
    permissions: [
      { module: 'support', actions: ['VIEW', 'CREATE', 'READ', 'UPDATE'] },
      { module: 'products', actions: ['VIEW', 'READ'] },
      { module: 'sales', actions: ['VIEW', 'READ'] },
      { module: 'ai', actions: ['VIEW', 'USE'] },
    ],
  },
  {
    roleName: 'Auditor',
    slug: 'auditor',
    description: 'Read-only inspection across accounting, inventory, procurement and immutable audit logs',
    isSystemRole: false,
    permissions: [
      { module: 'accounting', actions: ['VIEW', 'READ', 'EXPORT'] },
      { module: 'inventory', actions: ['VIEW', 'READ', 'EXPORT'] },
      { module: 'sales', actions: ['VIEW', 'READ', 'EXPORT'] },
      { module: 'procurement', actions: ['VIEW', 'READ', 'EXPORT'] },
      { module: 'audit', actions: ['VIEW', 'READ', 'EXPORT'] },
    ],
  },
  {
    roleName: 'Viewer',
    slug: 'viewer',
    description: 'General read-only access to view catalogs, orders and inventory',
    isSystemRole: false,
    permissions: [
      { module: 'products', actions: ['VIEW', 'READ'] },
      { module: 'inventory', actions: ['VIEW', 'READ'] },
      { module: 'sales', actions: ['VIEW', 'READ'] },
    ],
  },
];
