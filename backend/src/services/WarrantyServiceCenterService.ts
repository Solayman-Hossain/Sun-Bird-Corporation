import { Types } from 'mongoose';
import { WarrantyRecord, IWarrantyRecord } from '../models/WarrantyRecord';
import { WarrantyClaim, IWarrantyClaim } from '../models/WarrantyClaim';
import { RepairJobCard, IRepairJobCard, ISparePartUsage, JobCardStatus } from '../models/RepairJobCard';
import { CounterService } from './CounterService';
import { SupportAiService } from './SupportAiService';
import { AuditLogService } from './AuditLogService';
import logger from '../config/logger';

export interface RegisterWarrantyDTO {
  organizationId: string;
  productId: string;
  productName: string;
  productSku: string;
  serialNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  invoiceNumber?: string;
  salesOrderId?: string;
  purchaseDate: Date | string;
  warrantyPeriodMonths: number;
  policyType?: IWarrantyRecord['policyType'];
  termsConditions?: string;
  actorId?: string;
}

export class WarrantyServiceCenterService {
  /**
   * Register a new product warranty
   */
  public static async registerWarranty(dto: RegisterWarrantyDTO): Promise<IWarrantyRecord> {
    let warrantyNumber = '';
    try {
      warrantyNumber = await CounterService.getNextSequence('WAR');
    } catch {
      warrantyNumber = `WAR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const startDate = new Date(dto.purchaseDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (Number(dto.warrantyPeriodMonths) || 12));

    const warranty = new WarrantyRecord({
      organizationId: new Types.ObjectId(dto.organizationId),
      warrantyNumber,
      productId: new Types.ObjectId(dto.productId),
      productName: dto.productName,
      productSku: dto.productSku,
      serialNumber: dto.serialNumber.trim(),
      customerId: dto.customerId ? new Types.ObjectId(dto.customerId) : undefined,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      invoiceNumber: dto.invoiceNumber,
      salesOrderId: dto.salesOrderId ? new Types.ObjectId(dto.salesOrderId) : undefined,
      purchaseDate: startDate,
      warrantyPeriodMonths: Number(dto.warrantyPeriodMonths) || 12,
      startDate,
      endDate,
      status: endDate > new Date() ? 'ACTIVE' : 'EXPIRED',
      policyType: dto.policyType || 'STANDARD_MANUFACTURER',
      termsConditions: dto.termsConditions,
    });

    await warranty.save();

    const safeActorId = Types.ObjectId.isValid(dto.actorId || '') ? new Types.ObjectId(dto.actorId) : new Types.ObjectId('000000000000000000000001');
    await AuditLogService.logAction({
      action: 'WARRANTY_REGISTERED',
      actorId: safeActorId,
      actorRole: 'SUPPORT_AGENT',
      organizationId: dto.organizationId,
      targetCollection: 'warranty_records',
      targetId: warranty._id,
      afterSnapshot: { warrantyNumber, serialNumber: warranty.serialNumber, endDate: warranty.endDate },
    });

    return warranty;
  }

  /**
   * Verify warranty coverage by serial number with AI verification analysis
   */
  public static async verifyWarrantyBySerial(
    organizationId: string,
    serialNumber: string,
    defectDescription?: string
  ): Promise<{
    warranty: IWarrantyRecord | null;
    isCovered: boolean;
    daysRemaining: number;
    aiVerification: any;
    claims: IWarrantyClaim[];
    serviceJobs: IRepairJobCard[];
  }> {
    const warranty = await WarrantyRecord.findOne({
      organizationId: new Types.ObjectId(organizationId),
      serialNumber: serialNumber.trim(),
    });

    const now = new Date();
    let daysRemaining = 0;
    let isCovered = false;

    if (warranty) {
      if (new Date(warranty.endDate) > now && warranty.status === 'ACTIVE') {
        isCovered = true;
        daysRemaining = Math.max(0, Math.ceil((new Date(warranty.endDate).getTime() - now.getTime()) / (1000 * 3600 * 24)));
      } else if (new Date(warranty.endDate) <= now && warranty.status === 'ACTIVE') {
        warranty.status = 'EXPIRED';
        await warranty.save();
      }
    }

    const aiVerification = SupportAiService.verifyWarrantyAi(
      serialNumber,
      defectDescription || 'General diagnostic test',
      warranty
    );

    const [claims, serviceJobs] = await Promise.all([
      WarrantyClaim.find({
        organizationId: new Types.ObjectId(organizationId),
        serialNumber: serialNumber.trim(),
      }).lean(),
      RepairJobCard.find({
        organizationId: new Types.ObjectId(organizationId),
        serialNumber: serialNumber.trim(),
      }).lean(),
    ]);

    return {
      warranty,
      isCovered: isCovered && aiVerification.isCovered,
      daysRemaining,
      aiVerification,
      claims: claims as any,
      serviceJobs: serviceJobs as any,
    };
  }

  /**
   * Create Warranty Claim
   */
  public static async createWarrantyClaim(data: {
    organizationId: string;
    warrantyId: string;
    ticketId?: string;
    serialNumber: string;
    customerId?: string;
    customerName: string;
    problemDescription: string;
    reportedDefects?: string[];
    actorId?: string;
  }): Promise<IWarrantyClaim> {
    let claimNumber = '';
    try {
      claimNumber = await CounterService.getNextSequence('WCL');
    } catch {
      claimNumber = `WCL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const warranty = await WarrantyRecord.findOne({
      _id: new Types.ObjectId(data.warrantyId),
      organizationId: new Types.ObjectId(data.organizationId),
    });

    const aiCheck = SupportAiService.verifyWarrantyAi(
      data.serialNumber,
      data.problemDescription,
      warranty
    );

    const claim = new WarrantyClaim({
      organizationId: new Types.ObjectId(data.organizationId),
      claimNumber,
      warrantyId: new Types.ObjectId(data.warrantyId),
      ticketId: data.ticketId ? new Types.ObjectId(data.ticketId) : undefined,
      serialNumber: data.serialNumber,
      customerId: data.customerId ? new Types.ObjectId(data.customerId) : undefined,
      customerName: data.customerName,
      problemDescription: data.problemDescription,
      reportedDefects: data.reportedDefects || [],
      status: aiCheck.isCovered ? 'VERIFIED' : 'SUBMITTED',
      coveredParts: aiCheck.coveredParts,
      isCovered: aiCheck.isCovered,
      rejectionReason: !aiCheck.isCovered ? aiCheck.excludedReasons.join('; ') : undefined,
    });

    await claim.save();

    if (warranty) {
      warranty.claimCount = (warranty.claimCount || 0) + 1;
      warranty.lastServiceDate = new Date();
      await warranty.save();
    }

    const safeActorId = Types.ObjectId.isValid(data.actorId || '') ? new Types.ObjectId(data.actorId) : new Types.ObjectId('000000000000000000000001');
    await AuditLogService.logAction({
      action: 'WARRANTY_CLAIM_CREATED',
      actorId: safeActorId,
      actorRole: 'SUPPORT_AGENT',
      organizationId: data.organizationId,
      targetCollection: 'warranty_claims',
      targetId: claim._id,
      afterSnapshot: { claimNumber, isCovered: claim.isCovered },
    });

    return claim;
  }

  /**
   * List Warranties & Claims
   */
  public static async getWarranties(
    organizationId: string,
    query: { status?: string; search?: string; page?: number; limit?: number }
  ): Promise<{ warranties: IWarrantyRecord[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = { organizationId: new Types.ObjectId(organizationId) };
    if (query.status && query.status !== 'ALL') filter.status = query.status;

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { warrantyNumber: searchRegex },
        { serialNumber: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { productName: searchRegex },
      ];
    }

    const [warranties, total] = await Promise.all([
      WarrantyRecord.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      WarrantyRecord.countDocuments(filter),
    ]);

    return { warranties: warranties as any, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  public static async getWarrantyClaims(
    organizationId: string,
    query: { status?: string; search?: string; page?: number; limit?: number }
  ): Promise<{ claims: IWarrantyClaim[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = { organizationId: new Types.ObjectId(organizationId) };
    if (query.status && query.status !== 'ALL') filter.status = query.status;

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { claimNumber: searchRegex },
        { serialNumber: searchRegex },
        { customerName: searchRegex },
      ];
    }

    const [claims, total] = await Promise.all([
      WarrantyClaim.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      WarrantyClaim.countDocuments(filter),
    ]);

    return { claims: claims as any, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  /**
   * Create Service / Repair Job Card
   */
  public static async createRepairJobCard(data: {
    organizationId: string;
    ticketId?: string;
    warrantyClaimId?: string;
    serviceCenterName?: string;
    productId: string;
    productName: string;
    serialNumber?: string;
    customerName: string;
    customerPhone: string;
    technicianId?: string;
    technicianName?: string;
    faultDescription: string;
    actorId?: string;
  }): Promise<IRepairJobCard> {
    let jobNumber = '';
    try {
      jobNumber = await CounterService.getNextSequence('JOB');
    } catch {
      jobNumber = `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const job = new RepairJobCard({
      organizationId: new Types.ObjectId(data.organizationId),
      jobNumber,
      ticketId: data.ticketId ? new Types.ObjectId(data.ticketId) : undefined,
      warrantyClaimId: data.warrantyClaimId ? new Types.ObjectId(data.warrantyClaimId) : undefined,
      serviceCenterName: data.serviceCenterName || 'Central Biomedical Service & Repair Lab',
      productId: new Types.ObjectId(data.productId),
      productName: data.productName,
      serialNumber: data.serialNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      technicianId: data.technicianId ? new Types.ObjectId(data.technicianId) : undefined,
      technicianName: data.technicianName,
      faultDescription: data.faultDescription,
      status: data.technicianId ? 'IN_DIAGNOSIS' : 'PENDING_ASSIGNMENT',
      sparePartsUsed: [],
    });

    await job.save();

    const safeActorId = Types.ObjectId.isValid(data.actorId || '') ? new Types.ObjectId(data.actorId) : new Types.ObjectId('000000000000000000000001');
    await AuditLogService.logAction({
      action: 'JOB_CARD_CREATED',
      actorId: safeActorId,
      actorRole: 'TECHNICIAN',
      organizationId: data.organizationId,
      targetCollection: 'repair_job_cards',
      targetId: job._id,
      afterSnapshot: { jobNumber, productName: job.productName, customerName: job.customerName },
    });

    return job;
  }

  /**
   * Update Repair Job Card (Add Spare Parts, Update Labor, Update Status)
   */
  public static async updateRepairJobCard(
    organizationId: string,
    jobId: string,
    data: {
      technicianId?: string;
      technicianName?: string;
      diagnosisNotes?: string;
      sparePartsUsed?: ISparePartUsage[];
      laborHours?: number;
      laborRatePerHour?: number;
      warrantyCoveredCost?: number;
      status?: JobCardStatus;
      qcPassed?: boolean;
      qcNotes?: string;
      actorId?: string;
    }
  ): Promise<IRepairJobCard | null> {
    const job = await RepairJobCard.findOne({
      _id: new Types.ObjectId(jobId),
      organizationId: new Types.ObjectId(organizationId),
    });
    if (!job) return null;

    if (data.technicianId) job.technicianId = new Types.ObjectId(data.technicianId);
    if (data.technicianName) job.technicianName = data.technicianName;
    if (data.diagnosisNotes) job.diagnosisNotes = data.diagnosisNotes;

    if (data.sparePartsUsed) {
      job.sparePartsUsed = data.sparePartsUsed;
      job.totalPartsCost = data.sparePartsUsed.reduce((sum, p) => sum + (p.quantity * (p.unitCost || 0)), 0);
    }

    if (typeof data.laborHours === 'number') {
      job.laborHours = data.laborHours;
    }
    if (typeof data.laborRatePerHour === 'number') {
      job.laborRatePerHour = data.laborRatePerHour;
    }
    job.totalLaborCost = (job.laborHours || 0) * (job.laborRatePerHour || 0);

    job.grandTotalCost = (job.totalPartsCost || 0) + (job.totalLaborCost || 0);

    if (typeof data.warrantyCoveredCost === 'number') {
      job.warrantyCoveredCost = data.warrantyCoveredCost;
    }
    job.customerPayableAmount = Math.max(0, job.grandTotalCost - (job.warrantyCoveredCost || 0));

    if (data.status) job.status = data.status;
    if (typeof data.qcPassed === 'boolean') job.qcPassed = data.qcPassed;
    if (data.qcNotes) job.qcNotes = data.qcNotes;

    if (data.status === 'COMPLETED' && !job.completedAt) {
      job.completedAt = new Date();
    }
    if (data.status === 'DELIVERED_TO_CUSTOMER' && !job.deliveredAt) {
      job.deliveredAt = new Date();
    }

    await job.save();

    const safeActorId = Types.ObjectId.isValid(data.actorId || '') ? new Types.ObjectId(data.actorId) : new Types.ObjectId('000000000000000000000001');
    await AuditLogService.logAction({
      action: 'JOB_CARD_UPDATED',
      actorId: safeActorId,
      actorRole: 'TECHNICIAN',
      organizationId,
      targetCollection: 'repair_job_cards',
      targetId: job._id,
      afterSnapshot: { jobNumber: job.jobNumber, status: job.status, grandTotalCost: job.grandTotalCost },
    });

    return job;
  }

  /**
   * List Repair Job Cards
   */
  public static async getRepairJobCards(
    organizationId: string,
    query: { status?: string; search?: string; technicianId?: string; page?: number; limit?: number }
  ): Promise<{ jobs: IRepairJobCard[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = { organizationId: new Types.ObjectId(organizationId) };
    if (query.status && query.status !== 'ALL') filter.status = query.status;
    if (query.technicianId) filter.technicianId = new Types.ObjectId(query.technicianId);

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { jobNumber: searchRegex },
        { serialNumber: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { productName: searchRegex },
        { technicianName: searchRegex },
      ];
    }

    const [jobs, total] = await Promise.all([
      RepairJobCard.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      RepairJobCard.countDocuments(filter),
    ]);

    return { jobs: jobs as any, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  /**
   * Query Warranty Expiry Alerts
   */
  public static async getExpiringWarranties(
    organizationId: string,
    daysAhead: number = 30
  ): Promise<IWarrantyRecord[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const expiring = await WarrantyRecord.find({
      organizationId: new Types.ObjectId(organizationId),
      status: 'ACTIVE',
      endDate: { $gte: now, $lte: threshold },
    }).sort({ endDate: 1 }).lean();

    return expiring as any;
  }
}
