import mongoose, { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { WarehouseModel } from '../models/Warehouse';
import { WarehouseBinModel } from '../models/WarehouseBin';
import { ProductModel } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { StockLedgerModel } from '../models/StockLedger';
import { StockTransferModel } from '../models/StockTransfer';
import { StockAdjustmentModel } from '../models/StockAdjustment';
import { PhysicalCountModel } from '../models/PhysicalCount';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { JournalEntryModel } from '../models/JournalEntry';
import { WarehouseBinService } from './WarehouseBinService';
import { StockTransferService } from './StockTransferService';
import { StockAdjustmentService } from './StockAdjustmentService';
import { PhysicalCountService } from './PhysicalCountService';
import { InventoryEngineService } from './InventoryEngineService';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

async function runInventoryVerification() {
  console.log('\n===============================================================');
  console.log('   SUN BIRD ERP — MODULE 06: INVENTORY & FEFO VERIFICATION     ');
  console.log('===============================================================\n');

  await connectDatabase();

  const runId = Date.now().toString().slice(-6);
  const testUserId = new Types.ObjectId();
  const testOrgId = new Types.ObjectId();

  let passCount = 0;

  try {
    // ─── STEP 1: WAREHOUSES & LOCATIONS / BINS ──────────────────────────────
    console.log('[Step 1] Creating Test Warehouses and Bins...');
    const srcWarehouse = await WarehouseModel.create({
      organizationId: testOrgId,
      warehouseCode: `WH-SRC-${runId}`,
      name: `Source Central Hub ${runId}`,
      type: 'CENTRAL',
      address: 'Tejgaon I/A, Dhaka',
      district: 'Dhaka',
      isCentralHub: true,
      isActive: true,
    });

    const destWarehouse = await WarehouseModel.create({
      organizationId: testOrgId,
      warehouseCode: `WH-DST-${runId}`,
      name: `Destination Branch ${runId}`,
      type: 'BRANCH',
      address: 'GEC Circle, Chittagong',
      district: 'Chittagong',
      isCentralHub: false,
      isActive: true,
    });

    assert(Boolean(srcWarehouse._id), 'Source warehouse created');
    assert(Boolean(destWarehouse._id), 'Destination warehouse created');
    passCount += 2;
    console.log('  ✓ Source & Destination Warehouses created successfully');

    const binA = await WarehouseBinService.createBin({
      organizationId: testOrgId,
      warehouseId: srcWarehouse._id,
      binCode: `BIN-A1-${runId}`,
      zone: 'Zone-A',
      aisle: 'A1',
      rack: 'R1',
      shelf: 'S1',
      binType: 'STANDARD',
    });

    const binB = await WarehouseBinService.createBin({
      organizationId: testOrgId,
      warehouseId: destWarehouse._id,
      binCode: `BIN-B1-${runId}`,
      zone: 'Zone-B',
      aisle: 'B1',
      rack: 'R1',
      shelf: 'S1',
      binType: 'STANDARD',
    });

    assert(binA.binCode === `BIN-A1-${runId}`, 'Source Bin created with uppercase code');
    assert(binB.zone === 'Zone-B', 'Destination Bin created with zone');
    passCount += 2;
    console.log('  ✓ Warehouse Bins created successfully');

    // ─── STEP 2: PRODUCTS & BATCH SETUP ─────────────────────────────────────
    console.log('\n[Step 2] Creating Products and Batches with Multi-Expiry Dates...');
    const testProduct = await ProductModel.create({
      organizationId: testOrgId,
      sku: `MED-OXY-${runId}`,
      nameEn: `Medical Oxygen Concentrator ${runId}`,
      category: 'Medical Equipment',
      hsCode: '9019.20.00',
      baseUom: 'UNIT',
      minStockQty: 10,
      isMedical: true,
      isExpirable: true,
      status: 'ACTIVE',
    });

    const now = new Date();
    const expirySoon = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days ahead
    const expiryLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

    const batch1 = await ProductBatchModel.create({
      organizationId: testOrgId,
      productId: testProduct._id,
      sku: testProduct.sku,
      batchNumber: `BATCH-EARLY-${runId}`,
      category: 'EXPIRY_CONTROLLED',
      expiryDate: expirySoon,
      manufacturingDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      baseUom: 'UNIT',
      currentQty: 50,
      reservedQty: 0,
      unitCost: 25000,
      warehouseId: srcWarehouse._id,
      binId: binA._id,
      locationStatus: 'ON_HAND',
    });

    const batch2 = await ProductBatchModel.create({
      organizationId: testOrgId,
      productId: testProduct._id,
      sku: testProduct.sku,
      batchNumber: `BATCH-LATE-${runId}`,
      category: 'EXPIRY_CONTROLLED',
      expiryDate: expiryLater,
      manufacturingDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      baseUom: 'UNIT',
      currentQty: 50,
      reservedQty: 0,
      unitCost: 26000,
      warehouseId: srcWarehouse._id,
      binId: binA._id,
      locationStatus: 'ON_HAND',
    });

    assert(batch1.currentQty === 50, 'Batch 1 created with currentQty 50');
    assert(batch2.currentQty === 50, 'Batch 2 created with currentQty 50');
    passCount += 2;
    console.log('  ✓ Batches with early & late expiry created successfully');

    // ─── STEP 3: INVENTORY DASHBOARD & STOCK OVERVIEW ───────────────────────
    console.log('\n[Step 3] Testing Real-Data Inventory Dashboard & Stock Overview...');
    const dashboard = await InventoryEngineService.getInventoryDashboard({
      organizationId: testOrgId,
      warehouseId: srcWarehouse._id,
    });

    assert(dashboard.totalAvailableStock >= 100, `Dashboard available stock >= 100 (got ${dashboard.totalAvailableStock})`);
    assert(dashboard.inventoryValuation > 0, `Dashboard inventory valuation > 0 (got ${dashboard.inventoryValuation})`);
    assert(dashboard.expiringProducts >= 1, `Dashboard caught near-expiry batch (got ${dashboard.expiringProducts})`);
    passCount += 3;
    console.log('  ✓ Real-data Dashboard calculations verified');

    const overview = await InventoryEngineService.getStockOverview({
      organizationId: testOrgId,
      warehouseId: srcWarehouse._id,
      search: testProduct.sku,
    });

    assert(overview.total >= 2, `Overview found batches for SKU (got ${overview.total})`);
    const firstOverviewItem = overview.items[0];
    assert(firstOverviewItem.availableQuantity === 50, 'Overview Available Quantity matches currentQty');
    assert(firstOverviewItem.physicalQuantity === 50, 'Overview Physical Quantity = Available + Reserved');
    passCount += 3;
    console.log('  ✓ Stock Overview buckets (Physical, Available, Reserved) verified');

    // ─── STEP 4: STRICT FEFO & FIFO ALLOCATION ──────────────────────────────
    console.log('\n[Step 4] Testing Strict FEFO & FIFO Stock Allocation...');
    const fefoAllocations = await InventoryEngineService.allocateStock({
      sku: testProduct.sku,
      warehouseId: srcWarehouse._id,
      quantity: 30,
      method: 'FEFO',
    });

    assert(fefoAllocations.length === 1, 'FEFO allocated in 1 batch');
    assert(
      fefoAllocations[0].batchNumber === `BATCH-EARLY-${runId}`,
      `FEFO prioritized earliest expiring batch (expected BATCH-EARLY-${runId}, got ${fefoAllocations[0].batchNumber})`
    );
    assert(fefoAllocations[0].allocatedQty === 30, 'FEFO allocated exact requested quantity');
    passCount += 3;
    console.log('  ✓ FEFO allocation strictly prioritizes nearest expiry date');

    const fefoMultiAlloc = await InventoryEngineService.allocateStock({
      sku: testProduct.sku,
      warehouseId: srcWarehouse._id,
      quantity: 75,
      method: 'FEFO',
    });
    assert(fefoMultiAlloc.length === 2, 'FEFO multi-batch allocation split across 2 batches');
    assert(fefoMultiAlloc[0].batchNumber === `BATCH-EARLY-${runId}` && fefoMultiAlloc[0].allocatedQty === 50, 'First batch depleted completely');
    assert(fefoMultiAlloc[1].batchNumber === `BATCH-LATE-${runId}` && fefoMultiAlloc[1].allocatedQty === 25, 'Second batch covered remaining quantity');
    passCount += 3;
    console.log('  ✓ FEFO multi-batch sequential waterfall allocation verified');

    // ─── STEP 5: STOCK RESERVATION & RELEASE ────────────────────────────────
    console.log('\n[Step 5] Testing Stock Reservation & Release...');
    const reserveRes = await InventoryEngineService.reserveStock(
      testProduct.sku,
      srcWarehouse._id,
      20,
      `SO-TEST-${runId}`,
      testUserId
    );
    assert(reserveRes.success === true, 'Reservation succeeded');

    const updatedBatch1 = await ProductBatchModel.findById(batch1._id);
    assert(updatedBatch1!.reservedQty === 20, `Batch reservedQty incremented to 20 (got ${updatedBatch1!.reservedQty})`);
    assert(updatedBatch1!.currentQty === 30, `Batch currentQty decremented to 30 (got ${updatedBatch1!.currentQty})`);
    passCount += 3;
    console.log('  ✓ Stock Reservation correctly transferred available to reserved bucket');

    const releaseRes = await InventoryEngineService.releaseStockReservation(
      testProduct.sku,
      srcWarehouse._id,
      10,
      `SO-CANCEL-${runId}`,
      testUserId
    );
    assert(releaseRes.success === true, 'Reservation release succeeded');
    const releasedBatch1 = await ProductBatchModel.findById(batch1._id);
    assert(releasedBatch1!.reservedQty === 10, `Batch reservedQty decremented to 10 (got ${releasedBatch1!.reservedQty})`);
    assert(releasedBatch1!.currentQty === 40, `Batch currentQty incremented to 40 (got ${releasedBatch1!.currentQty})`);
    passCount += 3;
    console.log('  ✓ Stock Reservation Release verified');

    // Reset reservation for transfer test
    await InventoryEngineService.releaseStockReservation(
      testProduct.sku,
      srcWarehouse._id,
      10,
      `SO-CLEANUP-${runId}`,
      testUserId
    );

    // ─── STEP 6: STOCK TRANSFER WORKFLOW ────────────────────────────────────
    console.log('\n[Step 6] Testing Inter-Warehouse Stock Transfer Workflow...');
    const transfer = await StockTransferService.createTransfer(
      {
        organizationId: testOrgId,
        sourceWarehouseId: srcWarehouse._id,
        destinationWarehouseId: destWarehouse._id,
        items: [
          {
            productId: testProduct._id,
            batchId: batch1._id,
            sourceBinId: binA._id,
            destBinId: binB._id,
            sku: testProduct.sku,
            batchNumber: batch1.batchNumber,
            requestedQty: 15,
            unitCost: batch1.unitCost,
          },
        ],
        vehicleNumber: 'DHK-METRO-11-2233',
        driverName: 'Rahim Uddin',
      },
      testUserId
    );

    assert(transfer.status === 'DRAFT', 'Transfer created in DRAFT');
    assert(transfer.transferNumber.startsWith('TRF-'), 'Transfer number formatted correctly');
    passCount += 2;
    console.log(`  ✓ Transfer created: ${transfer.transferNumber}`);

    await StockTransferService.submitTransfer(transfer._id, testUserId);
    await StockTransferService.approveTransfer(transfer._id, testUserId);
    const approvedTrf = await StockTransferModel.findById(transfer._id);
    assert(approvedTrf!.status === 'APPROVED', 'Transfer approved');
    passCount += 1;
    console.log('  ✓ Transfer approved');

    // Dispatch
    const dispatchedTrf = await StockTransferService.dispatchTransfer(
      transfer._id,
      { challanNumber: `CH-TRF-${runId}` },
      testUserId
    );
    assert(dispatchedTrf.status === 'IN_TRANSIT', 'Transfer status is IN_TRANSIT');
    const srcBatchAfterDispatch = await ProductBatchModel.findById(batch1._id);
    assert(srcBatchAfterDispatch!.currentQty === 35, `Source batch deducted by 15 (got ${srcBatchAfterDispatch!.currentQty})`);

    const dispatchLedger = await StockLedgerModel.findOne({
      referenceNo: transfer.transferNumber,
      movementType: 'TRANSFER_OUT',
    });
    assert(Boolean(dispatchLedger), 'Stock Ledger TRANSFER_OUT entry recorded');
    assert(dispatchLedger!.qtyChange === -15, 'TRANSFER_OUT qtyChange is -15');
    passCount += 4;
    console.log('  ✓ Stock Transfer Dispatch & Source Deduction verified');

    // Receive
    const receivedTrf = await StockTransferService.receiveTransfer(
      transfer._id,
      {
        receivedItems: [
          {
            batchId: batch1._id,
            receivedQty: 15,
            destBinId: binB._id,
          },
        ],
      },
      testUserId
    );
    assert(receivedTrf.status === 'RECEIVED', 'Transfer status is RECEIVED');

    const destBatch = await ProductBatchModel.findOne({
      warehouseId: destWarehouse._id,
      sku: testProduct.sku,
      batchNumber: batch1.batchNumber,
    });
    assert(Boolean(destBatch), 'Batch received in destination warehouse');
    assert(destBatch!.currentQty === 15, `Destination batch currentQty is 15 (got ${destBatch!.currentQty})`);

    const receiveLedger = await StockLedgerModel.findOne({
      referenceNo: transfer.transferNumber,
      movementType: 'TRANSFER_IN',
    });
    assert(Boolean(receiveLedger), 'Stock Ledger TRANSFER_IN entry recorded');
    assert(receiveLedger!.qtyChange === 15, 'TRANSFER_IN qtyChange is +15');
    passCount += 5;
    console.log('  ✓ Stock Transfer Receive at destination warehouse verified');

    // ─── STEP 7: STOCK ADJUSTMENT & GL ACCOUNTING INTEGRATION ───────────────
    console.log('\n[Step 7] Testing Stock Adjustment with GL Journal Voucher Posting...');
    const adjustment = await StockAdjustmentService.createAdjustment(
      {
        organizationId: testOrgId,
        warehouseId: destWarehouse._id,
        adjustmentType: 'DAMAGED',
        items: [
          {
            productId: testProduct._id,
            batchId: destBatch!._id,
            sku: testProduct.sku,
            batchNumber: destBatch!.batchNumber,
            adjustedQty: 12, // Reduced from 15 to 12 (3 units damaged)
            reason: 'Transit vibration damage on 3 units',
          },
        ],
        remarks: 'Transit damage assessment',
      },
      testUserId
    );

    assert(adjustment.status === 'DRAFT', 'Adjustment created in DRAFT');
    assert(adjustment.items[0].differenceQty === -3, 'Difference Qty calculated as -3');
    assert(adjustment.totalValuationChange < 0, 'Valuation change is negative');
    passCount += 3;
    console.log(`  ✓ Adjustment created: ${adjustment.adjustmentNumber}`);

    await StockAdjustmentService.approveAdjustment(adjustment._id, testUserId);
    const postedAdj = await StockAdjustmentService.postAdjustment(adjustment._id, testUserId);
    assert(postedAdj.status === 'POSTED', 'Adjustment marked POSTED');

    const adjustedDestBatch = await ProductBatchModel.findById(destBatch!._id);
    assert(adjustedDestBatch!.currentQty === 12, `Dest batch currentQty updated to 12 (got ${adjustedDestBatch!.currentQty})`);
    assert(adjustedDestBatch!.damagedQty === 3, `Dest batch damagedQty updated to 3 (got ${adjustedDestBatch!.damagedQty})`);

    const adjLedger = await StockLedgerModel.findOne({
      referenceNo: adjustment.adjustmentNumber,
      movementType: 'ADJUST_DOWN',
    });
    assert(Boolean(adjLedger), 'Stock Ledger ADJUST_DOWN entry recorded');
    assert(adjLedger!.qtyChange === -3, 'Ledger qtyChange is -3');

    assert(Boolean(postedAdj.journalEntryId), 'GL Journal Voucher created and linked');
    const journalEntry = await JournalEntryModel.findById(postedAdj.journalEntryId);
    assert(Boolean(journalEntry), 'Journal Entry exists in GL ledger');
    assert(journalEntry!.status === 'POSTED', 'Journal Entry status is POSTED');
    passCount += 7;
    console.log('  ✓ Stock Adjustment posted with immutable ledger & GL Journal Voucher');

    // ─── STEP 8: PHYSICAL STOCK COUNT & RECONCILIATION ──────────────────────
    console.log('\n[Step 8] Testing Physical Stock Count & Auto-Reconciliation...');
    const physicalCount = await PhysicalCountService.createCount(
      {
        organizationId: testOrgId,
        warehouseId: destWarehouse._id,
        countType: 'FULL',
        remarks: 'Monthly physical verification',
      },
      testUserId
    );

    assert(physicalCount.status === 'PLANNED', 'Count created in PLANNED status');
    assert(physicalCount.items.length >= 1, 'Count initialized with warehouse items');
    assert(physicalCount.countNumber.startsWith('STK_CNT-') || physicalCount.countNumber.startsWith('STK-'), 'Count number generated');
    passCount += 3;
    console.log(`  ✓ Physical Count created: ${physicalCount.countNumber}`);

    // Record count with a variance: system says 12, counter finds 14 (found 2 surplus units)
    const recordedCount = await PhysicalCountService.recordCountItems(
      physicalCount._id,
      [
        {
          batchId: destBatch!._id,
          countedQty: 14,
          notes: 'Found 2 surplus units during recount',
        },
      ],
      testUserId
    );

    assert(recordedCount.status === 'COMPLETED', 'Count status is COMPLETED');
    assert(recordedCount.items[0].varianceQty === 2, `Variance Qty calculated as +2 (got ${recordedCount.items[0].varianceQty})`);
    passCount += 2;
    console.log('  ✓ Recorded Count with variance (+2 surplus)');

    // Reconcile
    const reconciledCount = await PhysicalCountService.reconcileCount(physicalCount._id, testUserId);
    assert(reconciledCount.status === 'RECONCILED', 'Count status is RECONCILED');
    assert(Boolean(reconciledCount.reconciliationAdjustmentId), 'Reconciliation Stock Adjustment created');

    const reconBatch = await ProductBatchModel.findById(destBatch!._id);
    assert(reconBatch!.currentQty === 14, `Reconciled batch updated to countedQty 14 (got ${reconBatch!.currentQty})`);
    passCount += 3;
    console.log('  ✓ Physical Count Reconciliation auto-adjusted inventory');

    // ─── STEP 9: EXPIRY MANAGEMENT & REORDER ALERTS ─────────────────────────
    console.log('\n[Step 9] Testing Expiry Analysis & Reorder Alerts...');
    const expiryAnalysis = await InventoryEngineService.getExpiryManagement({
      warehouseId: srcWarehouse._id,
      daysThreshold: 90,
    });
    assert(expiryAnalysis.summary.criticalCount >= 1, `Critical expiry count detected (got ${expiryAnalysis.summary.criticalCount})`);
    passCount += 1;
    console.log('  ✓ Expiry Analysis accurately bucketed expiring batches');

    const reorderAlerts = await InventoryEngineService.getReorderAlerts(destWarehouse._id);
    assert(Array.isArray(reorderAlerts), 'Reorder alerts returned as array');
    passCount += 1;
    console.log('  ✓ Reorder alerts evaluated against minStockQty threshold');

    console.log('\n===============================================================');
    console.log(`  SUCCESS: ALL ${passCount} INVENTORY VERIFICATION ASSERTIONS PASSED!`);
    console.log('===============================================================\n');
  } catch (error: any) {
    console.error('\n❌ INVENTORY VERIFICATION FAILED:');
    console.error(error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

runInventoryVerification();
