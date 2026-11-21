import { Types, ClientSession } from 'mongoose';
import {
  ImportShipmentModel,
  IImportShipment,
} from '../models/ImportShipment';
import { ImportLCModel } from '../models/ImportLC';
import { CustomsClearanceModel, ICustomsClearance } from '../models/CustomsClearance';
import { ImportRiskAlertModel } from '../models/ImportRiskAlert';
import { CounterService } from './CounterService';
import { AuditLogService } from './AuditLogService';
import { ImportAiService } from './ImportAiService';
import { NotFoundError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export interface CreateShipmentDTO {
  lcId: string | Types.ObjectId;
  organizationId: string | Types.ObjectId;
  supplierId: string | Types.ObjectId;
  purchaseOrderId?: string | Types.ObjectId;
  shipmentNumber?: number;
  shipmentMode: 'SEA' | 'AIR' | 'ROAD';
  vesselName?: string;
  voyageNumber?: string;
  flightNumber?: string;
  containerNumbers?: string[];
  blOrAwbNumber: string;
  blOrAwbDate?: Date | string;
  freightForwarder?: string;
  shippingLine?: string;
  portOfLoading: string;
  portOfDischarge: string;
  etd: Date | string;
  eta: Date | string;
  shipmentQuantity: number;
  shipmentValueFC: number;
  currency?: string;
  remarks?: string;
  commercialInvoice?: {
    invoiceNumber: string;
    invoiceDate: Date | string;
    totalAmountFC: number;
    currency: string;
    fileUrl?: string;
  };
  packingList?: {
    packingListNumber: string;
    totalPackages: number;
    grossWeightKg: number;
    netWeightKg: number;
    measurementCbm?: number;
    fileUrl?: string;
  };
}

export interface AddTrackingEventDTO {
  shipmentId: string | Types.ObjectId;
  location: string;
  status: string;
  description: string;
  source?: string;
  timestamp?: Date | string;
}

export interface CreateCustomsClearanceDTO {
  billOfEntryNumber: string;
  billOfEntryDate: Date | string;
  organizationId: string | Types.ObjectId;
  lcId: string | Types.ObjectId;
  shipmentId?: string | Types.ObjectId;
  customsHouse?: string;
  cfAgentName?: string;
  cfAgentPhone?: string;
  hsCodes?: string[];
  assessableValueBDT: number;
  customsDutyBDT?: number;
  regulatoryDutyBDT?: number;
  supplementaryDutyBDT?: number;
  vatBDT?: number;
  advanceTaxBDT?: number;
  advanceIncomeTaxBDT?: number;
  otherGovtChargesBDT?: number;
  portChargesBDT?: number;
  cfAgentChargesBDT?: number;
  demurrageChargesBDT?: number;
  detentionChargesBDT?: number;
  notes?: string;
}

export class ImportShipmentService {
  /**
   * Registers a new Import Shipment against an LC.
   */
  public static async createShipment(
    dto: CreateShipmentDTO,
    actorId?: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<IImportShipment> {
    const lc = await ImportLCModel.findById(dto.lcId).session(session || null);
    if (!lc) {
      throw new NotFoundError('ImportLC', dto.lcId.toString());
    }

    const year = new Date().getFullYear();
    const seq = await CounterService.getNextSequence(`SHP_${year}`, session);
    const shipmentReference = `SHP-${year}-${seq.toString().padStart(4, '0')}`;

    // AI Delay Risk Analysis on creation
    const { prediction } = await ImportAiService.predictShipmentDelay({
      shipmentMode: dto.shipmentMode,
      shippingLine: dto.shippingLine,
      portOfLoading: dto.portOfLoading,
      portOfDischarge: dto.portOfDischarge,
      etd: dto.etd,
      eta: dto.eta,
      status: 'SHIPPED',
      freeDays: lc.portFreeDays || 4,
    });

    const shipmentDocs = await ImportShipmentModel.create(
      [
        {
          shipmentReference,
          shipmentNumber: dto.shipmentNumber || 1,
          lcId: lc._id,
          lcNumber: lc.lcNumber,
          organizationId: new Types.ObjectId(dto.organizationId),
          supplierId: new Types.ObjectId(dto.supplierId),
          purchaseOrderId: dto.purchaseOrderId ? new Types.ObjectId(dto.purchaseOrderId) : lc.purchaseOrderId,
          shipmentMode: dto.shipmentMode,
          vesselName: dto.vesselName,
          voyageNumber: dto.voyageNumber,
          flightNumber: dto.flightNumber,
          containerNumbers: dto.containerNumbers || [],
          blOrAwbNumber: dto.blOrAwbNumber.trim().toUpperCase(),
          blOrAwbDate: dto.blOrAwbDate ? new Date(dto.blOrAwbDate) : undefined,
          freightForwarder: dto.freightForwarder,
          shippingLine: dto.shippingLine,
          portOfLoading: dto.portOfLoading,
          portOfDischarge: dto.portOfDischarge,
          etd: new Date(dto.etd),
          eta: new Date(dto.eta),
          shipmentQuantity: dto.shipmentQuantity,
          shipmentValueFC: dto.shipmentValueFC,
          currency: dto.currency || lc.foreignCurrency,
          shipmentStatus: 'SHIPPED',
          commercialInvoice: dto.commercialInvoice
            ? {
                ...dto.commercialInvoice,
                invoiceDate: new Date(dto.commercialInvoice.invoiceDate),
              }
            : undefined,
          packingList: dto.packingList,
          trackingEvents: [
            {
              timestamp: new Date(),
              location: dto.portOfLoading,
              status: 'CARGO_LOADED',
              description: `Vessel departed from ${dto.portOfLoading} to ${dto.portOfDischarge}`,
              source: 'BILL_OF_LADING',
            },
          ],
          aiDelayRiskLevel: prediction.delayRiskLevel,
          aiDelayPredictionDays: prediction.predictedDelayDays,
          aiAnalysisNotes: prediction.explanation,
          remarks: dto.remarks,
        },
      ],
      { session }
    );

    const shipment = shipmentDocs[0];

    // Transition LC status to IN_TRANSIT if currently LC_OPENED
    if (lc.status === 'LC_OPENED' || lc.status === 'DRAFT') {
      lc.status = 'IN_TRANSIT';
      await lc.save({ session });
    }

    // Trigger AI Risk Alert if risk level is HIGH or CRITICAL
    if (prediction.delayRiskLevel === 'HIGH' || prediction.delayRiskLevel === 'CRITICAL') {
      await ImportRiskAlertModel.create(
        [
          {
            organizationId: shipment.organizationId,
            riskCategory: 'SHIPMENT_DELAY',
            riskLevel: prediction.delayRiskLevel,
            title: `Shipment ${shipment.shipmentReference} Delay Risk Alert`,
            explanation: prediction.explanation,
            lcId: lc._id,
            lcNumber: lc.lcNumber,
            shipmentId: shipment._id,
            shipmentReference: shipment.shipmentReference,
            supportingData: { eta: dto.eta, delayDays: prediction.predictedDelayDays },
            recommendedAction: prediction.recommendations.join(' | '),
          },
        ],
        { session }
      );
    }

    if (actorId) {
      await AuditLogService.record({
        action: 'CREATE',
        targetCollection: 'ImportShipment',
        targetId: shipment._id,
        actorId: new Types.ObjectId(actorId),
        organizationId: shipment.organizationId,
        diff: { shipmentReference: shipment.shipmentReference, lcNumber: lc.lcNumber },
        module: 'procurement',
      });
    }

    logger.info(`Import Shipment created: ${shipment.shipmentReference} (BL/AWB: ${shipment.blOrAwbNumber})`);
    return shipment;
  }

  /**
   * Adds an operational tracking checkpoint event.
   */
  public static async addTrackingEvent(
    dto: AddTrackingEventDTO,
    actorId?: string | Types.ObjectId
  ): Promise<IImportShipment> {
    const shipment = await ImportShipmentModel.findById(dto.shipmentId);
    if (!shipment) {
      throw new NotFoundError('ImportShipment', dto.shipmentId.toString());
    }

    shipment.trackingEvents.push({
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      location: dto.location,
      status: dto.status,
      description: dto.description,
      source: dto.source || 'PORT_AUTHORITY',
    });

    if (dto.status === 'ARRIVED_AT_PORT') {
      shipment.shipmentStatus = 'ARRIVED_AT_PORT';
      shipment.actualArrivalDate = new Date();
    } else if (dto.status === 'CUSTOMS_CLEARED') {
      shipment.shipmentStatus = 'CUSTOMS_CLEARED';
    } else if (dto.status === 'DELIVERED_TO_DEPOT') {
      shipment.shipmentStatus = 'DELIVERED';
    }

    await shipment.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'UPDATE',
        targetCollection: 'ImportShipment',
        targetId: shipment._id,
        actorId: new Types.ObjectId(actorId),
        organizationId: shipment.organizationId,
        diff: { event: dto.status, location: dto.location },
        module: 'procurement',
      });
    }

    return shipment;
  }

  /**
   * Records a Bill of Entry and Port Customs Clearance.
   */
  public static async recordCustomsClearance(
    dto: CreateCustomsClearanceDTO,
    actorId?: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<ICustomsClearance> {
    const lc = await ImportLCModel.findById(dto.lcId).session(session || null);
    if (!lc) {
      throw new NotFoundError('ImportLC', dto.lcId.toString());
    }

    const cd = dto.customsDutyBDT || 0;
    const rd = dto.regulatoryDutyBDT || 0;
    const sd = dto.supplementaryDutyBDT || 0;
    const vat = dto.vatBDT || 0;
    const at = dto.advanceTaxBDT || 0;
    const ait = dto.advanceIncomeTaxBDT || 0;
    const otherGovt = dto.otherGovtChargesBDT || 0;
    const totalDutyAndTaxesBDT = cd + rd + sd + vat + at + ait + otherGovt;

    const port = dto.portChargesBDT || 0;
    const cf = dto.cfAgentChargesBDT || 0;
    const demurrage = dto.demurrageChargesBDT || 0;
    const detention = dto.detentionChargesBDT || 0;
    const totalClearanceCostBDT = totalDutyAndTaxesBDT + port + cf + demurrage + detention;

    const clearanceDocs = await CustomsClearanceModel.create(
      [
        {
          billOfEntryNumber: dto.billOfEntryNumber.trim().toUpperCase(),
          billOfEntryDate: new Date(dto.billOfEntryDate),
          organizationId: new Types.ObjectId(dto.organizationId),
          lcId: lc._id,
          lcNumber: lc.lcNumber,
          shipmentId: dto.shipmentId ? new Types.ObjectId(dto.shipmentId) : undefined,
          customsHouse: dto.customsHouse || 'Chittagong Custom House',
          cfAgentName: dto.cfAgentName,
          cfAgentPhone: dto.cfAgentPhone,
          hsCodes: dto.hsCodes || [],
          assessableValueBDT: dto.assessableValueBDT,
          customsDutyBDT: cd,
          regulatoryDutyBDT: rd,
          supplementaryDutyBDT: sd,
          vatBDT: vat,
          advanceTaxBDT: at,
          advanceIncomeTaxBDT: ait,
          otherGovtChargesBDT: otherGovt,
          totalDutyAndTaxesBDT,
          portChargesBDT: port,
          cfAgentChargesBDT: cf,
          demurrageChargesBDT: demurrage,
          detentionChargesBDT: detention,
          totalClearanceCostBDT,
          clearanceStatus: 'ASSESSMENT_COMPLETED',
          notes: dto.notes,
        },
      ],
      { session }
    );

    const clearance = clearanceDocs[0];

    // Update LC status to CUSTOMS_ASSESSED if currently IN_TRANSIT or PORT_ARRIVED
    if (lc.status === 'IN_TRANSIT' || lc.status === 'PORT_ARRIVED' || lc.status === 'LC_OPENED') {
      lc.status = 'CUSTOMS_ASSESSED';
      await lc.save({ session });
    }

    if (actorId) {
      await AuditLogService.record({
        action: 'CREATE',
        targetCollection: 'CustomsClearance',
        targetId: clearance._id,
        actorId: new Types.ObjectId(actorId),
        organizationId: clearance.organizationId,
        diff: { billOfEntryNumber: clearance.billOfEntryNumber, totalClearanceCostBDT },
        module: 'procurement',
      });
    }

    logger.info(`Customs Clearance recorded: B/E ${clearance.billOfEntryNumber} (Total Cost: ৳${totalClearanceCostBDT})`);
    return clearance;
  }
}
