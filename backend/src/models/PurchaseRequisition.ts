import { Schema, model, Document, Types } from 'mongoose';

export type PRPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type PRStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED'
  | 'PARTIALLY_CONVERTED'
  | 'FULLY_CONVERTED'
  | 'CANCELLED';

export interface IPRItem {
  productId: Types.ObjectId;
  sku: string;
  productName: string;
  variantId?: Types.ObjectId;
  requestedQty: number;
  uom: string;
  estimatedUnitPrice: number;
  estimatedTotal: number;
  reason?: string;
  convertedQty: number;
}

export interface IPurchaseRequisition extends Document {
  _id: Types.ObjectId;
  requisitionNumber: string;
  organizationId: Types.ObjectId;
  department: string;
  requestedBy: Types.ObjectId;
  requisitionDate: Date;
  requiredDeliveryDate?: Date;
  warehouseId?: Types.ObjectId;
  priority: PRPriority;
  items: IPRItem[];
  attachments: string[];
  notes?: string;
  status: PRStatus;
  approvalRequestId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PRItemSchema = new Schema<IPRItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    productName: { type: String, required: true, trim: true },
    variantId: { type: Schema.Types.ObjectId, ref: 'Product' },
    requestedQty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    estimatedUnitPrice: { type: Number, required: true, min: 0, default: 0 },
    estimatedTotal: { type: Number, required: true, min: 0, default: 0 },
    reason: { type: String, trim: true },
    convertedQty: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

export const PurchaseRequisitionSchema = new Schema<IPurchaseRequisition>(
  {
    requisitionNumber: { type: String, required: true, trim: true, uppercase: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    department: { type: String, required: true, trim: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requisitionDate: { type: Date, required: true, default: Date.now },
    requiredDeliveryDate: { type: Date },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
      required: true,
    },
    items: { type: [PRItemSchema], required: true, default: [] },
    attachments: { type: [String], default: [] },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'PENDING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'RETURNED',
        'PARTIALLY_CONVERTED',
        'FULLY_CONVERTED',
        'CANCELLED',
      ],
      default: 'DRAFT',
      required: true,
    },
    approvalRequestId: { type: Schema.Types.ObjectId, ref: 'ApprovalRequest' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'purchase_requisitions' }
);

PurchaseRequisitionSchema.index({ requisitionNumber: 1 }, { unique: true });
PurchaseRequisitionSchema.index({ organizationId: 1, status: 1 });
PurchaseRequisitionSchema.index({ requestedBy: 1 });

export const PurchaseRequisitionModel = model<IPurchaseRequisition>(
  'PurchaseRequisition',
  PurchaseRequisitionSchema
);
