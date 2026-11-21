import { Schema, model, Document, Types } from 'mongoose';

export type PhysicalCondition =
  | 'LIKE_NEW'
  | 'LIGHT_SCRATCHES'
  | 'DAMAGED_BOX'
  | 'SEVERELY_DAMAGED'
  | 'BROKEN';

export type FunctionalStatus =
  | 'WORKING_NORMAL'
  | 'INTERMITTENT_FAULT'
  | 'DEAD_ON_ARRIVAL'
  | 'NOT_WORKING';

export type DefectCategory =
  | 'MANUFACTURING_DEFECT'
  | 'USER_DAMAGE'
  | 'TRANSIT_DAMAGE'
  | 'SOFTWARE_ISSUE'
  | 'NO_FAULT_FOUND';

export type StockDisposition =
  | 'RESTOCK_AS_NEW'
  | 'REFURBISH_RESALE'
  | 'RETURN_TO_VENDOR'
  | 'SPARE_PARTS'
  | 'SCRAP_DISPOSAL';

export interface IInspectionItem {
  productId: Types.ObjectId;
  productName: string;
  serialNumber?: string;
  physicalCondition: PhysicalCondition;
  functionalStatus: FunctionalStatus;
  defectCategory: DefectCategory;
  disposition: StockDisposition;
  passedInspection: boolean;
  notes?: string;
  destinationWarehouseId?: Types.ObjectId;
}

export interface IReturnInspection extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  inspectionNumber: string; // INSP-2026-0001
  rmaId: Types.ObjectId;
  inspectorId: Types.ObjectId;
  inspectorName: string;
  inspectionDate: Date;
  items: IInspectionItem[];
  overallOutcome: 'ACCEPT_RETURN' | 'REJECT_RETURN' | 'CONDITIONAL_ACCEPT';
  restockApproved: boolean;
  photos: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnInspectionSchema = new Schema<IReturnInspection>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    inspectionNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    rmaId: { type: Schema.Types.ObjectId, ref: 'RmaRequest', required: true, index: true },
    inspectorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inspectorName: { type: String, required: true, trim: true },
    inspectionDate: { type: Date, default: Date.now },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        serialNumber: { type: String },
        physicalCondition: {
          type: String,
          enum: ['LIKE_NEW', 'LIGHT_SCRATCHES', 'DAMAGED_BOX', 'SEVERELY_DAMAGED', 'BROKEN'],
          required: true,
        },
        functionalStatus: {
          type: String,
          enum: ['WORKING_NORMAL', 'INTERMITTENT_FAULT', 'DEAD_ON_ARRIVAL', 'NOT_WORKING'],
          required: true,
        },
        defectCategory: {
          type: String,
          enum: ['MANUFACTURING_DEFECT', 'USER_DAMAGE', 'TRANSIT_DAMAGE', 'SOFTWARE_ISSUE', 'NO_FAULT_FOUND'],
          required: true,
        },
        disposition: {
          type: String,
          enum: ['RESTOCK_AS_NEW', 'REFURBISH_RESALE', 'RETURN_TO_VENDOR', 'SPARE_PARTS', 'SCRAP_DISPOSAL'],
          required: true,
        },
        passedInspection: { type: Boolean, required: true },
        notes: { type: String },
        destinationWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
      },
    ],
    overallOutcome: {
      type: String,
      enum: ['ACCEPT_RETURN', 'REJECT_RETURN', 'CONDITIONAL_ACCEPT'],
      default: 'ACCEPT_RETURN',
    },
    restockApproved: { type: Boolean, default: false },
    photos: [{ type: String }],
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

ReturnInspectionSchema.index({ organizationId: 1, rmaId: 1 });

export const ReturnInspection = model<IReturnInspection>('ReturnInspection', ReturnInspectionSchema);
