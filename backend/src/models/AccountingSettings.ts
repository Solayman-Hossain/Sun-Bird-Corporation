import { Schema, model, Document, Types } from 'mongoose';

export interface IAccountingSettings extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  salesRevenueAccountCode: number;
  accountsReceivableAccountCode: number;
  accountsPayableAccountCode: number;
  inventoryAccountCode: number;
  cogsAccountCode: number;
  taxPayableAccountCode: number;
  cashAccountCode: number;
  bankAccountCode: number;
  discountAccountCode: number;
  purchaseExpenseAccountCode: number;
  partnerCapitalAccountCode: number;
  partnerProfitPayableAccountCode: number;
  retainedEarningsAccountCode: number;
  loanAccountCode: number;
  interestExpenseAccountCode: number;
  autoPostVouchers: boolean;
  lockAccountingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const AccountingSettingsSchema = new Schema<IAccountingSettings>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    salesRevenueAccountCode: { type: Number, default: 4010, required: true },
    accountsReceivableAccountCode: { type: Number, default: 1020, required: true },
    accountsPayableAccountCode: { type: Number, default: 2010, required: true },
    inventoryAccountCode: { type: Number, default: 1050, required: true },
    cogsAccountCode: { type: Number, default: 5010, required: true },
    taxPayableAccountCode: { type: Number, default: 2050, required: true },
    cashAccountCode: { type: Number, default: 1005, required: true },
    bankAccountCode: { type: Number, default: 1010, required: true },
    discountAccountCode: { type: Number, default: 4020, required: true },
    purchaseExpenseAccountCode: { type: Number, default: 5020, required: true },
    partnerCapitalAccountCode: { type: Number, default: 3001, required: true },
    partnerProfitPayableAccountCode: { type: Number, default: 2040, required: true },
    retainedEarningsAccountCode: { type: Number, default: 3010, required: true },
    loanAccountCode: { type: Number, default: 2020, required: true },
    interestExpenseAccountCode: { type: Number, default: 6010, required: true },
    autoPostVouchers: { type: Boolean, default: true },
    lockAccountingDate: { type: Date },
  },
  { timestamps: true }
);

export const AccountingSettingsModel = model<IAccountingSettings>(
  'AccountingSettings',
  AccountingSettingsSchema
);
export default AccountingSettingsModel;
