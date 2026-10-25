import { Schema, model, Document, Types } from 'mongoose';

export type AssetStatus = 'ACTIVE' | 'UNDER_MAINTENANCE' | 'DISPOSED' | 'SOLD';
export type DepreciationMethod = 'SLM' | 'WDV';

export interface IFixedAsset extends Document {
  _id: Types.ObjectId;
  assetCode: string;
  assetName: string;
  category: string;
  serialTagNo?: string;
  purchaseDate: Date;
  purchaseCost: number;
  residualValue: number;
  usefulLifeYears: number;
  usefulLifeMonths?: number;
  depreciationMethod: DepreciationMethod;
  monthlyDepreciation?: number;
  accumulatedDepreciation: number;
  netBookValue?: number;
  currentBookValue?: number; // Alias for netBookValue per prompt spec
  custodian?: Types.ObjectId;
  warehouseId?: Types.ObjectId;
  warrantyExpiry?: Date;
  status: AssetStatus;
  disposalDate?: Date;
  disposalValue?: number;
  journalRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const FixedAssetSchema = new Schema<IFixedAsset>(
  {
    assetCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    assetName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    serialTagNo: {
      type: String,
      trim: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    purchaseCost: {
      type: Number,
      required: true,
      min: 0,
    },
    residualValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    usefulLifeYears: {
      type: Number,
      required: true,
      min: 0.05,
    },
    usefulLifeMonths: {
      type: Number,
      min: 1,
    },
    depreciationMethod: {
      type: String,
      enum: ['SLM', 'WDV'],
      default: 'SLM',
      required: true,
    },
    monthlyDepreciation: {
      type: Number,
      min: 0,
    },
    accumulatedDepreciation: {
      type: Number,
      default: 0,
      min: 0,
    },
    netBookValue: {
      type: Number,
      min: 0,
    },
    currentBookValue: {
      type: Number,
      min: 0,
    },
    custodian: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    warrantyExpiry: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'UNDER_MAINTENANCE', 'DISPOSED', 'SOLD'],
      default: 'ACTIVE',
      required: true,
    },
    disposalDate: {
      type: Date,
    },
    disposalValue: {
      type: Number,
      min: 0,
    },
    journalRef: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Auto-compute monthly depreciation and netBookValue before validate
FixedAssetSchema.pre('validate', function () {
  if (this.usefulLifeMonths && !this.usefulLifeYears) {
    this.usefulLifeYears = Number((this.usefulLifeMonths / 12).toFixed(2));
  } else if (this.usefulLifeYears && !this.usefulLifeMonths) {
    this.usefulLifeMonths = Math.round(this.usefulLifeYears * 12);
  }

  if (this.purchaseCost !== undefined) {
    const accDep = this.accumulatedDepreciation || 0;
    this.netBookValue = Math.max(0, Number((this.purchaseCost - accDep).toFixed(2)));
    this.currentBookValue = this.netBookValue;

    if (this.usefulLifeMonths && this.usefulLifeMonths > 0 && !this.monthlyDepreciation) {
      if (this.depreciationMethod === 'SLM') {
        const depreciableAmount = Math.max(0, this.purchaseCost - (this.residualValue || 0));
        this.monthlyDepreciation = Number((depreciableAmount / this.usefulLifeMonths).toFixed(2));
      }
    }
  }
});

// Explicit Indexes per Database-Schema.md §5.3 & prompt.md §31.3
FixedAssetSchema.index({ assetCode: 1 }, { unique: true });
FixedAssetSchema.index({ status: 1 });
FixedAssetSchema.index({ category: 1 });
FixedAssetSchema.index({ warehouseId: 1 });

export const FixedAssetModel = model<IFixedAsset>('FixedAsset', FixedAssetSchema);
export default FixedAssetModel;
