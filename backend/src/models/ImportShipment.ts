import { Schema, model, Document, Types } from 'mongoose';

export interface IShipmentEvent {
  timestamp: Date;
  location: string;
  status: string;
  description: string;
  source: string;
}

export interface ICommercialInvoiceRef {
  invoiceNumber: string;
  invoiceDate: Date;
  totalAmountFC: number;
  currency: string;
  fileUrl?: string;
}

export interface IPackingListRef {
  packingListNumber: string;
  totalPackages: number;
  grossWeightKg: number;
  netWeightKg: number;
  measurementCbm?: number;
  fileUrl?: string;
}

export interface IImportShipment extends Document {
  _id: Types.ObjectId;
  shipmentReference: string;
  shipmentNumber: number;
  lcId: Types.ObjectId;
  lcNumber: string;
  organizationId: Types.ObjectId;
  supplierId: Types.ObjectId;
  purchaseOrderId?: Types.ObjectId;
  shipmentMode: 'SEA' | 'AIR' | 'ROAD';
  vesselName?: string;
  voyageNumber?: string;
  flightNumber?: string;
  containerNumbers: string[];
  blOrAwbNumber: string;
  blOrAwbDate?: Date;
  freightForwarder?: string;
  shippingLine?: string;
  portOfLoading: string;
  portOfDischarge: string;
  etd: Date;
  eta: Date;
  actualDepartureDate?: Date;
  actualArrivalDate?: Date;
  transshipmentPort?: string;
  shipmentQuantity: number;
  shipmentValueFC: number;
  currency: string;
  shipmentStatus:
    | 'PLANNED'
    | 'BOOKING_CONFIRMED'
    | 'CARGO_READY'
    | 'SHIPPED'
    | 'IN_TRANSIT'
    | 'TRANSSHIPMENT'
    | 'ARRIVED_AT_PORT'
    | 'CUSTOMS_PENDING'
    | 'CUSTOMS_CLEARED'
    | 'RELEASED'
    | 'DELIVERED'
    | 'PARTIALLY_RECEIVED'
    | 'FULLY_RECEIVED'
    | 'DELAYED'
    | 'CANCELLED';
  commercialInvoice?: ICommercialInvoiceRef;
  packingList?: IPackingListRef;
  certificateOfOriginNumber?: string;
  insurancePolicyNumber?: string;
  inspectionCertificateNumber?: string;
  trackingEvents: IShipmentEvent[];
  aiDelayRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  aiDelayPredictionDays?: number;
  aiAnalysisNotes?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentEventSchema = new Schema<IShipmentEvent>(
  {
    timestamp: { type: Date, default: Date.now },
    location: { type: String, required: true, trim: true },
    status: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    source: { type: String, default: 'MANUAL_ENTRY', trim: true },
  },
  { _id: false }
);

export const ImportShipmentSchema = new Schema<IImportShipment>(
  {
    shipmentReference: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    shipmentNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    lcId: {
      type: Schema.Types.ObjectId,
      ref: 'ImportLC',
      required: true,
      index: true,
    },
    lcNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    shipmentMode: {
      type: String,
      enum: ['SEA', 'AIR', 'ROAD'],
      default: 'SEA',
    },
    vesselName: { type: String, trim: true },
    voyageNumber: { type: String, trim: true },
    flightNumber: { type: String, trim: true },
    containerNumbers: [{ type: String, trim: true, uppercase: true }],
    blOrAwbNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    blOrAwbDate: { type: Date },
    freightForwarder: { type: String, trim: true },
    shippingLine: { type: String, trim: true },
    portOfLoading: { type: String, required: true, trim: true },
    portOfDischarge: { type: String, required: true, trim: true },
    etd: { type: Date, required: true },
    eta: { type: Date, required: true, index: true },
    actualDepartureDate: { type: Date },
    actualArrivalDate: { type: Date },
    transshipmentPort: { type: String, trim: true },
    shipmentQuantity: { type: Number, required: true, min: 0 },
    shipmentValueFC: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', trim: true },
    shipmentStatus: {
      type: String,
      enum: [
        'PLANNED',
        'BOOKING_CONFIRMED',
        'CARGO_READY',
        'SHIPPED',
        'IN_TRANSIT',
        'TRANSSHIPMENT',
        'ARRIVED_AT_PORT',
        'CUSTOMS_PENDING',
        'CUSTOMS_CLEARED',
        'RELEASED',
        'DELIVERED',
        'PARTIALLY_RECEIVED',
        'FULLY_RECEIVED',
        'DELAYED',
        'CANCELLED',
      ],
      default: 'PLANNED',
      index: true,
    },
    commercialInvoice: {
      invoiceNumber: { type: String, trim: true },
      invoiceDate: { type: Date },
      totalAmountFC: { type: Number },
      currency: { type: String },
      fileUrl: { type: String },
    },
    packingList: {
      packingListNumber: { type: String, trim: true },
      totalPackages: { type: Number },
      grossWeightKg: { type: Number },
      netWeightKg: { type: Number },
      measurementCbm: { type: Number },
      fileUrl: { type: String },
    },
    certificateOfOriginNumber: { type: String, trim: true },
    insurancePolicyNumber: { type: String, trim: true },
    inspectionCertificateNumber: { type: String, trim: true },
    trackingEvents: [ShipmentEventSchema],
    aiDelayRiskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    aiDelayPredictionDays: { type: Number, default: 0 },
    aiAnalysisNotes: { type: String },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

ImportShipmentSchema.index({ organizationId: 1, shipmentReference: 1 }, { unique: true });

export const ImportShipmentModel = model<IImportShipment>('ImportShipment', ImportShipmentSchema);
