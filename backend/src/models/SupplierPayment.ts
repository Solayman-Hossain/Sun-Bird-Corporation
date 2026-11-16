import { Schema, model, Document, Types } from 'mongoose';

export type SupplierPaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CHEQUE'
  | 'MOBILE_BANKING'
  | 'OTHER';

export type SupplierPaymentStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'CANCELLED';

export interface IPaymentAllocation {
  invoiceId: Types.ObjectId;
  allocatedAmount: number;
}

export interface ISupplierPayment extends Document {
  _id: Types.ObjectId;
  paymentNumber: string;
  organizationId: Types.ObjectId;
  supplierId: Types.ObjectId;
  paymentDate: Date;
  paymentMethod: SupplierPaymentMethod;
  bankAccountId?: Types.ObjectId;
  chequeNumber?: string;
  paymentAmount: number;
  currency: string;
  exchangeRate: number;
  allocations: IPaymentAllocation[];
  notes?: string;
  attachments: string[];
  status: SupplierPaymentStatus;
  journalEntryId?: Types.ObjectId;
  postedAt?: Date;
  reversedAt?: Date;
  reversalReason?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentAllocationSchema = new Schema<IPaymentAllocation>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'PurchaseInvoice', required: true },
    allocatedAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

export const SupplierPaymentSchema = new Schema<ISupplierPayment>(
  {
    paymentNumber: { type: String, required: true, trim: true, uppercase: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOBILE_BANKING', 'OTHER'],
      default: 'BANK_TRANSFER',
      required: true,
    },
    bankAccountId: { type: Schema.Types.ObjectId },
    chequeNumber: { type: String, trim: true },
    paymentAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BDT', trim: true },
    exchangeRate: { type: Number, default: 1, min: 0 },
    allocations: { type: [PaymentAllocationSchema], required: true, default: [] },
    notes: { type: String, trim: true },
    attachments: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['DRAFT', 'POSTED', 'REVERSED', 'CANCELLED'],
      default: 'DRAFT',
      required: true,
    },
    journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
    postedAt: { type: Date },
    reversedAt: { type: Date },
    reversalReason: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'supplier_payments' }
);

SupplierPaymentSchema.index({ paymentNumber: 1 }, { unique: true });
SupplierPaymentSchema.index({ organizationId: 1, status: 1 });
SupplierPaymentSchema.index({ supplierId: 1 });
SupplierPaymentSchema.index({ paymentDate: -1 });

export const SupplierPaymentModel = model<ISupplierPayment>(
  'SupplierPayment',
  SupplierPaymentSchema
);
