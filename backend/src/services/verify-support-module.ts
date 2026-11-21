import mongoose, { Types } from 'mongoose';
import env from '../config/env';
import { OrganizationModel } from '../models/Organization';
import { UserModel } from '../models/User';
import { ProductModel } from '../models/Product';
import { SupportTicket } from '../models/SupportTicket';
import { SupportMessage } from '../models/SupportMessage';
import { RmaRequest } from '../models/RmaRequest';
import { ReturnInspection } from '../models/ReturnInspection';
import { WarrantyRecord } from '../models/WarrantyRecord';
import { WarrantyClaim } from '../models/WarrantyClaim';
import { RepairJobCard } from '../models/RepairJobCard';
import { SupportKnowledgeBase } from '../models/SupportKnowledgeBase';
import { CustomerFeedback } from '../models/CustomerFeedback';
import { SupportSettings } from '../models/SupportSettings';
import { SupportTicketService } from './SupportTicketService';
import { RmaReturnService } from './RmaReturnService';
import { WarrantyServiceCenterService } from './WarrantyServiceCenterService';
import { SupportAnalyticsService } from './SupportAnalyticsService';
import { SupportAiService } from './SupportAiService';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${testName}${detail ? ` - ${detail}` : ''}`);
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runSupportModuleVerification() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  MODULE 13: RMA & SUPPORT DESK TEST SUITE');
  console.log('  Customer Service, Return, Warranty & Repair AI Management System');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  await mongoose.connect(env.MONGODB_URI);

  try {
    // 0. Test Fixtures
    let org = await OrganizationModel.findOne();
    if (!org) {
      org = await OrganizationModel.create({
        legalName: 'Sun Bird Corporation Ltd.',
        displayName: 'Sun Bird Corporation Ltd.',
        organizationCode: 'SBC-MAIN',
        organizationType: 'PARENT',
        isActive: true,
      });
    }
    const orgId = org._id.toString();

    let user = await UserModel.findOne({ organizationId: org._id });
    if (!user) {
      user = await UserModel.create({
        organizationId: org._id,
        fullName: 'Support Engineer',
        email: 'support.lead@sunbird.com.bd',
        mobile: '01700000000',
        passwordHash: 'dummyhash',
        userType: 'STAFF',
        isActive: true,
      });
    }
    const userId = user._id.toString();

    let product = await ProductModel.findOne();
    if (!product) {
      product = await ProductModel.create({
        organizationId: org._id,
        nameEn: 'Mindray Patient Monitor ePM 10M',
        sku: 'MIN-EPM10M',
        hsCode: '9018.19.00',
        baseUom: 'PCS',
        productType: 'STANDARD',
        costPrice: 85000,
        sellingPrice: 125000,
        currentStock: 10,
        status: 'PUBLISHED',
      });
    }
    const productId = product._id.toString();
    const productName = product.nameEn || 'Mindray Patient Monitor ePM 10M';
    const userName = user.fullName || 'Support Engineer';

    console.log(`[INIT] Organization: ${org.displayName} (${orgId})`);
    console.log(`[INIT] Agent User: ${userName} (${userId})`);
    console.log(`[INIT] Product: ${productName} (${productId})\n`);

    // ─────────────────────────────────────────────────────────────
    // TEST 1-8: SUPPORT TICKETS & COMPLAINTS
    // ─────────────────────────────────────────────────────────────
    console.log('--- 1. TICKETS & COMPLAINTS WORKFLOW ---');

    const ticket = await SupportTicketService.createTicket({
      organizationId: orgId,
      subject: 'Critical: Ventilator display flickering intermittently in ICU',
      description: 'The front TFT display of the ventilator unit is flickering and shutting off intermittently. Urgent patient care affected.',
      customerName: 'Dhaka Medical College Hospital',
      customerPhone: '01811223344',
      customerEmail: 'biomedical@dmch.gov.bd',
      productId,
      productName,
      productSku: product.sku,
      serialNumber: 'SN-VENT-99214',
      createdByUserId: userId,
      createdByName: userName,
    });

    assert(Boolean(ticket._id), 'Ticket Created', ticket.ticketNumber);
    assert(ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH', 'AI Priority Classification', ticket.priority);
    assert(ticket.slaHours <= 12, 'SLA Hours Scheduled', `${ticket.slaHours} hours (due ${ticket.slaDueAt.toISOString()})`);
    assert(ticket.aiSentiment === 'VERY_NEGATIVE' || ticket.aiSentiment === 'NEGATIVE', 'AI Sentiment Analysis', ticket.aiSentiment);

    // List tickets
    const ticketList = await SupportTicketService.getTickets(orgId, { search: 'flickering' });
    assert(ticketList.total >= 1, 'Filter and Search Tickets by Query', `Found ${ticketList.total} tickets`);

    // Assign ticket
    const assigned = await SupportTicketService.assignTicket(orgId, ticket._id.toString(), userId, userName, userId);
    assert(assigned?.status === 'ASSIGNED', 'Assign Ticket to Specialist', `Assigned to ${assigned?.assignedToName}`);

    // Add customer and agent messages
    const replyMsg = await SupportTicketService.addMessage(orgId, ticket._id.toString(), {
      senderType: 'AGENT',
      senderId: userId,
      senderName: userName,
      messageType: 'MESSAGE',
      body: 'We have dispatched senior field biomedical engineer Engr. Tariq to inspect the power supply unit on-site within 2 hours.',
      isInternalOnly: false,
    });
    assert(Boolean(replyMsg._id), 'Add Agent Reply Message in Thread');

    // Escalate ticket
    const escalated = await SupportTicketService.escalateTicket(orgId, ticket._id.toString(), {
      reason: 'ICU Critical Ward Equipment requires Directorate notification',
      actorId: userId,
      actorName: userName,
    });
    assert(escalated?.status === 'ESCALATED', 'Ticket Escalation Workflow', `Level ${escalated?.escalationLevel}`);

    // Resolve ticket
    const resolved = await SupportTicketService.resolveTicket(orgId, ticket._id.toString(), {
      resolutionNotes: 'Replaced SMPS inverter harness and verified uninterrupted 24hr load test. Calibrated successfully.',
      actorId: userId,
      actorName: userName,
    });
    assert(resolved?.status === 'RESOLVED', 'Ticket Resolution and Closure', resolved?.resolutionNotes);

    // ─────────────────────────────────────────────────────────────
    // TEST 9-15: RMA & RETURN MANAGEMENT
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. RMA & RETURN MANAGEMENT ---');

    const rma = await RmaReturnService.createRmaRequest({
      organizationId: orgId,
      ticketId: ticket._id.toString(),
      customerName: 'Apollo Hospital Dhaka',
      customerPhone: '01799887766',
      customerEmail: 'procurement@evercarebd.com',
      returnType: 'RETURN_FOR_REPLACEMENT',
      items: [
        {
          productId: new Types.ObjectId(productId),
          productName,
          productSku: product.sku,
          serialNumber: 'SN-EPM-77281',
          quantity: 1,
          unitPrice: 125000,
          reason: 'DEFECTIVE',
          reasonDetails: 'Sensor board dead on arrival',
          requestedAction: 'REPLACEMENT',
        },
      ],
      shippingMethod: 'COURIER_PICKUP',
      pickupAddress: 'Plot 81, Block E, Bashundhara R/A, Dhaka',
      actorId: userId,
    });

    assert(Boolean(rma._id), 'RMA Request Created', rma.rmaNumber);
    assert(Boolean(rma.aiEligibilityAssessment), 'AI Return Policy Eligibility Evaluated', `Eligible: ${rma.aiEligibilityAssessment?.isEligible}`);

    // RMA Approval
    const approvedRma = await RmaReturnService.approveOrRejectRma(orgId, rma._id.toString(), 'APPROVED', undefined, userId);
    assert(approvedRma?.status === 'APPROVED', 'RMA Human-in-the-Loop Approval', approvedRma?.approvalStatus);

    // Update Shipping & Pickup
    const shippedRma = await RmaReturnService.updateShipping(orgId, rma._id.toString(), {
      courierName: 'Steadfast Courier',
      courierTrackingNumber: 'ST-RMA-8849102',
      pickupScheduledDate: new Date(),
    });
    assert(shippedRma?.status === 'SHIPPING_REQUESTED', 'RMA Shipping and Pickup Scheduled', shippedRma?.courierTrackingNumber);

    // Return Inspection
    const inspection = await RmaReturnService.createInspection(orgId, rma._id.toString(), {
      inspectorId: userId,
      inspectorName: userName,
      items: [
        {
          productId: new Types.ObjectId(productId),
          productName,
          serialNumber: 'SN-EPM-77281',
          physicalCondition: 'LIKE_NEW',
          functionalStatus: 'DEAD_ON_ARRIVAL',
          defectCategory: 'MANUFACTURING_DEFECT',
          disposition: 'RETURN_TO_VENDOR',
          passedInspection: true,
          notes: 'Factory board failure confirmed, eligible for OEM warranty claim.',
        },
      ],
      overallOutcome: 'ACCEPT_RETURN',
      restockApproved: false,
      notes: 'Passed initial triage, intake accepted.',
    });
    assert(Boolean(inspection._id), 'Return Physical & Defect Inspection Created', inspection.inspectionNumber);

    // Complete Replacement
    const replaced = await RmaReturnService.completeReplacement(orgId, rma._id.toString(), {
      replacementOrderNumber: 'ORD-2026-REP-001',
      actorId: userId,
    });
    assert(replaced?.status === 'COMPLETED', 'RMA Replacement Order Finalized', replaced?.replacementOrderNumber);

    // RMA Refund Flow
    const refundRma = await RmaReturnService.createRmaRequest({
      organizationId: orgId,
      customerName: 'Popular Diagnostic Center',
      customerPhone: '01711224466',
      returnType: 'RETURN_FOR_REFUND',
      items: [
        {
          productId: new Types.ObjectId(productId),
          productName,
          productSku: product.sku,
          quantity: 1,
          unitPrice: 50000,
          reason: 'CUSTOMER_CHANGE_MIND',
          requestedAction: 'REFUND',
        },
      ],
      actorId: userId,
    });
    const refunded = await RmaReturnService.processRefund(orgId, refundRma._id.toString(), {
      refundVoucherNumber: 'JV-2026-REF-001',
      actorId: userId,
    });
    assert(refunded?.refundStatus === 'REFUNDED', 'RMA Refund Voucher Processed', refunded?.refundVoucherNumber);

    // ─────────────────────────────────────────────────────────────
    // TEST 16-22: WARRANTY & REPAIR SERVICE CENTER
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. WARRANTY & SERVICE CENTER ---');

    const warranty = await WarrantyServiceCenterService.registerWarranty({
      organizationId: orgId,
      productId,
      productName,
      productSku: product.sku,
      serialNumber: 'SN-EPM-WAR-12345',
      customerName: 'Square Hospitals Ltd.',
      customerPhone: '01755667788',
      purchaseDate: new Date(),
      warrantyPeriodMonths: 24,
      policyType: 'COMPREHENSIVE',
      actorId: userId,
    });

    assert(Boolean(warranty._id), 'Warranty Registered', warranty.warrantyNumber);
    assert(warranty.status === 'ACTIVE', 'Warranty Active Status Verified', `Valid till ${warranty.endDate.toISOString().split('T')[0]}`);

    // Verify warranty by serial number
    const verification = await WarrantyServiceCenterService.verifyWarrantyBySerial(
      orgId,
      'SN-EPM-WAR-12345',
      'ECG sensor connector pin loose'
    );
    assert(verification.isCovered, 'AI Warranty Verification Result', `Days Remaining: ${verification.daysRemaining}`);

    // Create Warranty Claim
    const claim = await WarrantyServiceCenterService.createWarrantyClaim({
      organizationId: orgId,
      warrantyId: warranty._id.toString(),
      serialNumber: 'SN-EPM-WAR-12345',
      customerName: 'Square Hospitals Ltd.',
      problemDescription: 'ECG connector pin loose causing intermittent lead off warning',
      reportedDefects: ['ECG connector pin damaged'],
      actorId: userId,
    });
    assert(Boolean(claim._id), 'Warranty Claim Registered & Verified', claim.claimNumber);

    // Check Expiring Warranties
    const expiring = await WarrantyServiceCenterService.getExpiringWarranties(orgId, 365 * 3);
    assert(Array.isArray(expiring), 'Warranty Expiry Alerts Queried', `${expiring.length} warranties monitored`);

    // Create Repair Job Card
    const job = await WarrantyServiceCenterService.createRepairJobCard({
      organizationId: orgId,
      warrantyClaimId: claim._id.toString(),
      productId,
      productName,
      serialNumber: 'SN-EPM-WAR-12345',
      customerName: 'Square Hospitals Ltd.',
      customerPhone: '01755667788',
      technicianId: userId,
      technicianName: userName,
      faultDescription: 'Intermittent ECG lead signal due to connector fatigue',
      actorId: userId,
    });
    assert(Boolean(job._id), 'Repair Job Card Created', job.jobNumber);

    // Update Repair Job Card with spare parts and labor
    const updatedJob = await WarrantyServiceCenterService.updateRepairJobCard(orgId, job._id.toString(), {
      diagnosisNotes: 'Connector port desoldered; replacement OEM gold-plated port installed.',
      sparePartsUsed: [
        {
          partName: 'Mindray 6-Pin ECG Connector Port',
          partCode: 'PRT-ECG-06',
          quantity: 1,
          unitCost: 3500,
          totalCost: 3500,
        },
      ],
      laborHours: 2,
      laborRatePerHour: 750,
      warrantyCoveredCost: 5000,
      status: 'TESTING_QC',
      qcPassed: true,
      qcNotes: 'Passes all 12-lead signal continuity tests. Safe for patient monitoring.',
      actorId: userId,
    });
    assert(updatedJob?.grandTotalCost === 5000, 'Repair Job Cost Computation', `Parts: BDT 3500, Labor: BDT 1500, Total: BDT ${updatedJob?.grandTotalCost}`);
    assert(updatedJob?.customerPayableAmount === 0, 'Warranty Covered Customer Zero-Billing', `Payable: BDT ${updatedJob?.customerPayableAmount}`);

    // Complete Job Card
    const completedJob = await WarrantyServiceCenterService.updateRepairJobCard(orgId, job._id.toString(), {
      status: 'COMPLETED',
      actorId: userId,
    });
    assert(completedJob?.status === 'COMPLETED', 'Repair Job Completed & Certified', completedJob?.jobNumber);

    // ─────────────────────────────────────────────────────────────
    // TEST 23-27: AI CO-PILOT SERVICES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. AI CO-PILOT SERVICES ---');

    const aiComplaint = await SupportAiService.analyzeComplaint(
      'Blood Gas Analyzer error code E-14 cal fluid sensor',
      'The machine keeps failing the auto-cal cycle before blood gas test with error E-14.'
    );
    assert(Boolean(aiComplaint.category), 'AI Complaint Triage & Root Cause', `${aiComplaint.category} (Priority: ${aiComplaint.priority})`);

    const aiReply = await SupportAiService.draftCustomerReply(
      {
        ticketNumber: ticket.ticketNumber,
        customerName: 'Dhaka Medical College Hospital',
        subject: ticket.subject,
        description: ticket.description,
        status: 'IN_PROGRESS',
        productName,
      },
      'Engineer dispatched with spare power supply board'
    );
    assert(aiReply.draftedMessage.includes('Dhaka Medical College Hospital'), 'AI Customer Response Drafted Courteously');

    const aiEligibility = SupportAiService.assessReturnEligibility(
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      'DEFECTIVE',
      14
    );
    assert(aiEligibility.isEligible, 'AI Return Policy Assessment', `Risk: ${aiEligibility.riskLevel}`);

    const aiTrouble = await SupportAiService.generateTroubleshooting(
      'Hematology Analyzer BC-5000',
      'Aspiration needle blockage alert'
    );
    assert(aiTrouble.steps.length > 0, 'AI Biomedical Troubleshooting Generator', `${aiTrouble.steps.length} diagnostic steps generated`);

    const aiBot = await SupportAiService.askAiSupportAssistant('What is the return window for defective medical equipment?');
    assert(aiBot.confidenceScore >= 80, 'AI Support Chatbot Query', `Confidence: ${aiBot.confidenceScore}%`);

    // ─────────────────────────────────────────────────────────────
    // TEST 28-33: FEEDBACK, KB, SETTINGS, DASHBOARD & MIS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. FEEDBACK, SETTINGS, DASHBOARD & MIS ---');

    const feedback = await SupportAnalyticsService.submitCustomerFeedback({
      organizationId: orgId,
      ticketId: ticket._id.toString(),
      customerName: 'Dhaka Medical College Hospital',
      rating: 5,
      feedback: 'Excellent swift response by Sun Bird engineering team for ICU ventilator.',
    });
    assert(feedback.rating === 5, 'Customer CSAT Feedback Recorded', `${feedback.csatCategory} (${feedback.rating} stars)`);

    const kb = await SupportAnalyticsService.createKnowledgeBaseArticle({
      organizationId: orgId,
      category: 'Patient Monitors',
      title: 'Routine Cleaning & Sensor Decontamination Guide',
      content: 'Wipe all transducer cables with hospital-grade disinfectant wipes. Avoid autoclaving optical sensors.',
      symptoms: ['Sensor degraded signal', 'Surface contamination'],
      troubleshootingSteps: ['Disconnect transducer', 'Clean with 70% IPA wipe', 'Dry for 5 minutes'],
    });
    assert(Boolean(kb._id), 'Support Knowledge Base Article Published', kb.title);

    const settings = await SupportAnalyticsService.updateSettings(
      orgId,
      {
        returnWindowDays: 14,
        allowAutomatedAiDrafts: true,
        defaultServiceCenter: 'Central Biomedical Service & Repair Lab - Tejgaon',
      },
      userId
    );
    assert(settings.returnWindowDays === 14, 'Support SLA & Return Settings Configured', settings.defaultServiceCenter);

    const kpis = await SupportAnalyticsService.getDashboardKpis(orgId);
    assert(kpis.totalTickets >= 1, 'Dashboard 16 KPIs - Total Tickets', `${kpis.totalTickets}`);
    assert(kpis.activeWarrantiesCount >= 1, 'Dashboard 16 KPIs - Active Warranties', `${kpis.activeWarrantiesCount}`);
    assert(kpis.slaComplianceRate >= 0 && kpis.slaComplianceRate <= 100, 'Dashboard 16 KPIs - SLA Compliance', `${kpis.slaComplianceRate}%`);
    assert(kpis.csatAverageScore >= 1, 'Dashboard 16 KPIs - CSAT Score', `${kpis.csatAverageScore}/5.0 (${kpis.csatSatisfactionPercent}%)`);

    const mis = await SupportAnalyticsService.getMisAnalytics(orgId);
    assert(Array.isArray(mis.ticketsByCategory), 'Support MIS Category Analytics', `${mis.ticketsByCategory.length} categories`);
    assert(Array.isArray(mis.defectBreakdown), 'Support MIS Defect Breakdown Analytics', `${mis.defectBreakdown.length} defect types`);

    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log(`  MODULE 13 VERIFICATION SUCCESSFUL: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
    console.log('═══════════════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Module 13 Verification Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runSupportModuleVerification();
