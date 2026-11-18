import { Schema, model, Document, Types } from 'mongoose';

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface IChartOfAccounts extends Document {
  organizationId?: Types.ObjectId;
  accountCode: number;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  parentCode?: number;
  isControl: boolean;
  isActive: boolean;
  description?: string;
  openingBalance?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ChartOfAccountsSchema = new Schema<IChartOfAccounts>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    accountCode: {
      type: Number,
      required: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'],
      required: true,
    },
    normalBalance: {
      type: String,
      enum: ['DEBIT', 'CREDIT'],
      required: true,
    },
    parentCode: {
      type: Number,
    },
    isControl: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ChartOfAccountsSchema.index({ accountCode: 1 }, { unique: true });
ChartOfAccountsSchema.index({ accountType: 1 });

export const ChartOfAccountsModel = model<IChartOfAccounts>(
  'ChartOfAccounts',
  ChartOfAccountsSchema
);

export default ChartOfAccountsModel;
