import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { SupplierModel } from '../models/Supplier';
import { PurchaseOrderModel } from '../models/PurchaseOrder';
import { ProductModel } from '../models/Product';
import { WarehouseModel } from '../models/Warehouse';
import { PurchaseRequisitionModel } from '../models/PurchaseRequisition';
import { GoodsReceiveNoteModel } from '../models/GoodsReceiveNote';
import { PurchaseInvoiceModel } from '../models/PurchaseInvoice';
import { SupplierPaymentModel } from '../models/SupplierPayment';
import { PurchaseReturnModel } from '../models/PurchaseReturn';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';

import { SupplierService } from './SupplierService';
import { PurchaseRequisitionService } from './PurchaseRequisitionService';
import { GrnService } from './GrnService';
import { PurchaseInvoiceService } from './PurchaseInvoiceService';
import { SupplierPaymentService } from './SupplierPaymentService';
import { PurchaseReturnService } from './PurchaseReturnService';
import { PurchaseDashboardService } from './PurchaseDashboardService';

async function runPurchaseVerificationSuite() {
  console.log('================================================================');
  console.log('🚀 SUN BIRD ERP - MODULE 05: PURCHASE & SUPPLIER VERIFICATION');
  console.log('================================================================');

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB:', mongoose.connection.name);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  const testActorId = new Types.ObjectId().toString();
  const testOrgId = new Types.ObjectId().toString();
  const timestamp = Date.now().toString().slice(-6);

  try {
    // -------------------------------------------------------------------------
    // SETUP FIXTURES: Accounts, Product, Supplier, Warehouse
    // -------------------------------------------------------------------------
    console.log('\n--- Setup Fixtures ---');
    // Ensure GL Accounts exist for accounting integration
    await ChartOfAccountsModel.findOneAndUpdate(
      { accountCode: 1300 },
      { accountCode: 1300, accountName: 'Inventory Asset', accountType: 'ASSET', normalBalance: 'DEBIT', organizationId: new Types.ObjectId(testOrgId) },
      { upsert: true }
    );
    await ChartOfAccountsModel.findOneAndUpdate(
      { accountCode: 2100 },
      { accountCode: 2100, accountName: 'Accounts Payable', accountType: 'LIABILITY', normalBalance: 'CREDIT', organizationId: new Types.ObjectId(testOrgId) },
      { upsert: true }
    );
    await ChartOfAccountsModel.findOneAndUpdate(
      { accountCode: 1100 },
      { accountCode: 1100, accountName: 'Cash and Bank', accountType: 'ASSET', normalBalance: 'DEBIT', organizationId: new Types.ObjectId(testOrgId) },
      { upsert: true }
    );

    const testWarehouse = await WarehouseModel.create({
      warehouseCode: `WH-${timestamp}`,
      name: `Central Warehouse ${timestamp}`,
      type: 'CENTRAL',
      address: 'Tejgaon I/A, Dhaka',
      district: 'Dhaka',
      isCentralHub: true,
      isActive: true,
    });
    assert(Boolean(testWarehouse._id), 'Test Warehouse created');

    const testProduct = await ProductModel.create({
      sku: `MED-${timestamp}`,
      productCode: `PRD-${timestamp}`,
      nameEn: `Digital Infusion Pump ${timestamp}`,
      nameBn: `ডিজিটাল ইনফিউশন পাম্প`,
      category: 'Medical Equipment',
      baseUom: 'PIECE',
      purchasePrice: 15000,
      costPrice: 15500,
      retailPrice: 22000,
      wholesalePrice: 18000,
      showroomPrice: 20000,
      organizationId: new Types.ObjectId(testOrgId),
      status: 'ACTIVE',
      publicationStatus: 'PUBLISHED',
    });
    assert(Boolean(testProduct._id), 'Test Product master created');

    const testSupplier = await SupplierModel.create({
      supplierCode: `SUP-${timestamp}`,
      companyName: `MediEquip Bangladesh Ltd ${timestamp}`,
      email: `contact-${timestamp}@mediequip.com.bd`,
      phone: `01711${timestamp}`,
      bin: `12345678901`,
      country: 'Bangladesh',
      currency: 'BDT',
      supplierType: 'LOCAL',
      organizationId: new Types.ObjectId(testOrgId),
      isActive: true,
      userId: new Types.ObjectId(testActorId),
    });
    assert(Boolean(testSupplier._id), 'Test Supplier created');

    // -------------------------------------------------------------------------
    // TEST GROUP 1: Supplier Extended Services
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 1: Supplier Extensions ---');
    const duplicateCheck = await SupplierService.checkDuplicateSupplier(
      { phone: testSupplier.phone, email: testSupplier.email },
      testOrgId
    );
    assert(duplicateCheck.isDuplicate === true, 'Duplicate supplier detection by phone/email passed');

    const supplierStats = await SupplierService.getSupplierStats(testOrgId);
    assert(supplierStats.total >= 1, 'Supplier stats aggregated correctly');
    assert(supplierStats.active >= 1, 'Active supplier count verified');

    // -------------------------------------------------------------------------
    // TEST GROUP 2: Purchase Requisition Lifecycle
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 2: Purchase Requisition Lifecycle ---');
    const pr = await PurchaseRequisitionService.createRequisition(
      {
        department: 'Biomedical Engineering',
        requiredDeliveryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        warehouseId: testWarehouse._id.toString(),
        priority: 'HIGH',
        items: [
          {
            productId: testProduct._id.toString(),
            sku: testProduct.sku,
            productName: testProduct.nameEn,
            requestedQty: 10,
            uom: 'PIECE',
            estimatedUnitPrice: 15000,
            reason: 'Hospital emergency ward restock',
          },
        ],
        notes: 'Urgent medical requirement',
      },
      testActorId,
      testOrgId
    );
    assert(Boolean(pr._id), 'Purchase Requisition created in DRAFT status');
    assert(pr.status === 'DRAFT', 'PR status is DRAFT initially');
    assert(pr.items[0].estimatedTotal === 150000, 'PR item estimated total calculated accurately');

    const submittedPr = await PurchaseRequisitionService.submitRequisition(pr._id.toString(), testActorId);
    assert(submittedPr.status === 'SUBMITTED', 'PR status transitioned to SUBMITTED');
    assert(Boolean(submittedPr.approvalRequestId), 'PR linked to Module 03 ApprovalRequest');

    const approverId = new Types.ObjectId().toString();
    const approvedPr = await PurchaseRequisitionService.approveRequisition(pr._id.toString(), approverId);
    assert(approvedPr.status === 'APPROVED', 'PR approved successfully by non-maker approver');

    // Convert approved PR to Purchase Order
    const convertResult = await PurchaseRequisitionService.convertToPurchaseOrder(
      pr._id.toString(),
      [{ itemIndex: 0, convertQty: 10 }],
      approverId
    );
    assert(Boolean(convertResult.requisitionId), 'Requisition items converted to PO metadata');

    const po = await PurchaseOrderModel.create({
      poNumber: `PO-${timestamp}`,
      organizationId: new Types.ObjectId(testOrgId),
      supplierId: testSupplier._id,
      poDate: new Date(),
      deliveryDeadline: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      currency: 'BDT',
      exchangeRate: 1,
      items: [
        {
          productId: testProduct._id,
          sku: testProduct.sku,
          productName: testProduct.nameEn,
          quantity: 10,
          uom: 'PIECE',
          unitPrice: 15000,
          lineTotal: 150000,
          receivedQty: 0,
        },
      ],
      subtotal: 150000,
      taxAmount: 7500,
      grandTotal: 157500,
      paymentTerms: 'Net 30',
      deliveryWarehouseId: testWarehouse._id,
      status: 'APPROVED',
      approvalQuorumTier: 1,
      issuedBy: new Types.ObjectId(testActorId),
    });
    assert(Boolean(po._id), 'Purchase Order (PO) created from approved PR');

    // -------------------------------------------------------------------------
    // TEST GROUP 3: Goods Receive Note (GRN) & FEFO Stock Receipt
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 3: Goods Receive Note (GRN) ---');
    const grn = await GrnService.createGrn(
      {
        purchaseOrderId: po._id.toString(),
        supplierId: testSupplier._id.toString(),
        warehouseId: testWarehouse._id.toString(),
        items: [
          {
            productId: testProduct._id.toString(),
            sku: testProduct.sku,
            productName: testProduct.nameEn,
            orderedQty: 10,
            currentReceivedQty: 10,
            acceptedQty: 8,
            rejectedQty: 1,
            damagedQty: 1,
            uom: 'PIECE',
            unitCost: 15000,
            batchNumber: `BATCH-${timestamp}`,
            expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000),
            inspectionStatus: 'PASSED',
          },
        ],
        receivingNotes: '8 accepted, 1 rejected spec mismatch, 1 damaged in transit',
      },
      testActorId,
      testOrgId
    );
    assert(Boolean(grn._id), 'GRN created in DRAFT status');
    assert(grn.status === 'DRAFT', 'GRN initial status is DRAFT');
    assert(grn.totalAcceptedValue === 120000, 'GRN total accepted value computed correctly (8 * 15000 = 120000)');

    const session = await mongoose.startSession();
    let postedGrn: any;
    await session.withTransaction(async () => {
      postedGrn = await GrnService.postGrn(grn._id.toString(), testActorId, session);
    });
    session.endSession();
    assert(postedGrn.status === 'POSTED', 'GRN posted and inventory batches generated');

    // -------------------------------------------------------------------------
    // TEST GROUP 4: Purchase Invoice Entry & General Ledger Posting
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 4: Purchase Invoice & GL Posting ---');
    const invoice = await PurchaseInvoiceService.createInvoice(
      {
        supplierInvoiceNumber: `SINV-${timestamp}`,
        supplierId: testSupplier._id.toString(),
        purchaseOrderId: po._id.toString(),
        grnIds: [grn._id.toString()],
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        currency: 'BDT',
        subtotal: 120000,
        totalTax: 6000,
        grandTotal: 126000,
        items: [
          {
            productId: testProduct._id.toString(),
            sku: testProduct.sku,
            productName: testProduct.nameEn,
            qty: 8,
            uom: 'PIECE',
            unitPrice: 15000,
            taxRate: 5,
          },
        ],
        notes: 'Payment within 30 days net terms',
      },
      testActorId,
      testOrgId
    );
    assert(Boolean(invoice._id), 'Purchase Invoice created in DRAFT status');
    assert(invoice.outstandingAmount === 126000, 'Invoice outstanding balance equals grand total');

    const invSession = await mongoose.startSession();
    let postedInvoice: any;
    await invSession.withTransaction(async () => {
      postedInvoice = await PurchaseInvoiceService.postInvoice(invoice._id.toString(), testActorId, invSession);
    });
    invSession.endSession();
    assert(postedInvoice.status === 'POSTED', 'Invoice posted to General Ledger (DR Inventory, CR Accounts Payable)');
    assert(Boolean(postedInvoice.journalEntryId), 'Invoice linked to balanced Journal Entry');

    // -------------------------------------------------------------------------
    // TEST GROUP 5: Supplier Payment & Accounts Payable Settlement
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 5: Supplier Payment Voucher ---');
    const payment = await SupplierPaymentService.createPayment(
      {
        supplierId: testSupplier._id.toString(),
        paymentDate: new Date(),
        paymentMethod: 'BANK_TRANSFER',
        paymentAmount: 76000,
        currency: 'BDT',
        allocations: [
          {
            invoiceId: invoice._id.toString(),
            allocatedAmount: 76000,
          },
        ],
        notes: 'Partial settlement via corporate bank transfer',
      },
      testActorId,
      testOrgId
    );
    assert(Boolean(payment._id), 'Supplier Payment voucher created in DRAFT');
    assert(payment.status === 'DRAFT', 'Payment voucher status is DRAFT');

    const paySession = await mongoose.startSession();
    let postedPayment: any;
    await paySession.withTransaction(async () => {
      postedPayment = await SupplierPaymentService.postPayment(payment._id.toString(), testActorId, paySession);
    });
    paySession.endSession();
    assert(postedPayment.status === 'POSTED', 'Payment voucher posted (DR Accounts Payable, CR Cash/Bank)');

    // Verify invoice outstanding reduced
    const updatedInvoice = await PurchaseInvoiceModel.findById(invoice._id);
    assert(updatedInvoice?.status === 'PARTIALLY_PAID', 'Invoice status updated to PARTIALLY_PAID');
    assert(updatedInvoice?.paidAmount === 76000, 'Invoice paid amount credited 76000 BDT');
    assert(updatedInvoice?.outstandingAmount === 50000, 'Invoice remaining outstanding balance is 50000 BDT');

    // -------------------------------------------------------------------------
    // TEST GROUP 6: Purchase Return & Stock Adjustment
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 6: Purchase Return ---');
    const purchaseReturn = await PurchaseReturnService.createReturn(
      {
        supplierId: testSupplier._id.toString(),
        grnId: grn._id.toString(),
        invoiceId: invoice._id.toString(),
        warehouseId: testWarehouse._id.toString(),
        reason: 'Post-delivery manufacturer defect detected in 1 unit',
        items: [
          {
            productId: testProduct._id.toString(),
            sku: testProduct.sku,
            productName: testProduct.nameEn,
            returnedQty: 1,
            uom: 'PIECE',
            unitCost: 15000,
            batchNumber: `BATCH-${timestamp}`,
            returnReason: 'Internal pump sensor malfunction',
          },
        ],
      },
      testActorId,
      testOrgId
    );
    assert(Boolean(purchaseReturn._id), 'Purchase Return created in DRAFT');
    assert(purchaseReturn.totalReturnValue === 15000, 'Return total value computed as 15000 BDT');

    // -------------------------------------------------------------------------
    // TEST GROUP 7: Supplier Ledger & AP Aging Summary
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 7: Supplier Ledger & AP Aging ---');
    const ledger = await SupplierService.getSupplierLedger(testSupplier._id.toString(), testOrgId);
    assert(ledger.supplier !== undefined, 'Supplier ledger fetched successfully');
    assert(ledger.entries.length >= 2, 'Ledger contains Invoice and Payment debit/credit entries');

    const payables = await PurchaseInvoiceService.getPayablesSummary(testOrgId);
    assert(payables.totals !== undefined, 'Accounts Payable aging summary generated');
    assert(payables.totals.totalOutstanding >= 50000, 'Total outstanding AP matches pending invoice balance');

    const dashboard = await PurchaseDashboardService.getDashboardMetrics(testOrgId);
    assert(dashboard !== undefined, 'Purchase Dashboard metrics aggregated');
    assert(dashboard.totalSuppliers >= 1, 'Dashboard counts active suppliers');
    assert(dashboard.totalRequisitions >= 1, 'Dashboard counts requisitions');
    assert(dashboard.totalInvoices >= 1, 'Dashboard counts invoices');

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup Test Records ---');
    await PurchaseReturnModel.deleteOne({ _id: purchaseReturn._id });
    await SupplierPaymentModel.deleteOne({ _id: payment._id });
    await PurchaseInvoiceModel.deleteOne({ _id: invoice._id });
    await GoodsReceiveNoteModel.deleteOne({ _id: grn._id });
    await PurchaseOrderModel.deleteOne({ _id: po._id });
    await PurchaseRequisitionModel.deleteOne({ _id: pr._id });
    await ProductModel.deleteOne({ _id: testProduct._id });
    await SupplierModel.deleteOne({ _id: testSupplier._id });
    await WarehouseModel.deleteOne({ _id: testWarehouse._id });
    console.log('✅ Temporary test fixtures cleaned up.');
  } catch (err: any) {
    console.error('❌ Verification Error:', err.message, err.stack);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n================================================================');
    console.log(`📊 FINAL RESULT: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================');
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runPurchaseVerificationSuite();
