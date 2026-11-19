import { Schema, model, Document, Types } from 'mongoose';

export interface IHrSettings extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  workingDaysPerMonth: number;
  dailyWorkingHours: number;
  overtimeRateMultiplier: number; // e.g. 1.5 or 2.0
  defaultShiftId?: Types.ObjectId;
  lateGraceMinutes: number;
  probationPeriodMonths: number;
  companyPrefix: string;
  payrollPostingAccounts: {
    salaryExpenseCode: number;
    commissionsExpenseCode: number;
    salaryPayableCode: number;
    loanRecoveryCode: number;
    cashOrBankCode: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const HrSettingsSchema = new Schema<IHrSettings>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
    },
    workingDaysPerMonth: {
      type: Number,
      default: 26,
      min: 1,
      max: 31,
    },
    dailyWorkingHours: {
      type: Number,
      default: 8,
      min: 1,
      max: 24,
    },
    overtimeRateMultiplier: {
      type: Number,
      default: 1.5,
      min: 1,
    },
    defaultShiftId: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
    },
    lateGraceMinutes: {
      type: Number,
      default: 15,
      min: 0,
    },
    probationPeriodMonths: {
      type: Number,
      default: 6,
      min: 1,
    },
    companyPrefix: {
      type: String,
      default: 'SBC-EMP',
      trim: true,
    },
    payrollPostingAccounts: {
      salaryExpenseCode: { type: Number, default: 6110 },
      commissionsExpenseCode: { type: Number, default: 6120 },
      salaryPayableCode: { type: Number, default: 2100 },
      loanRecoveryCode: { type: Number, default: 1420 },
      cashOrBankCode: { type: Number, default: 1010 },
    },
  },
  {
    timestamps: true,
  }
);

export const HrSettingsModel = model<IHrSettings>('HrSettings', HrSettingsSchema);
