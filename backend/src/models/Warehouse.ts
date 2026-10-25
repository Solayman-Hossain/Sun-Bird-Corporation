import { Schema, model, Document, Types } from 'mongoose';

export type WarehouseType = 'CENTRAL' | 'BRANCH' | 'OUTLET';

export interface IWarehouse extends Document {
  _id: Types.ObjectId;
  warehouseCode: string;
  name: string;
  type: WarehouseType;
  address: string;
  district: string;
  isCentralHub: boolean;
  contactPerson?: string;
  mobile?: string;
  capacityCbf?: number;
  binCount?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  gpsLatitude?: number;
  gpsLongitude?: number;
  geofenceRadiusMeters?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const WarehouseSchema = new Schema<IWarehouse>(
  {
    warehouseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['CENTRAL', 'BRANCH', 'OUTLET'],
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    isCentralHub: {
      type: Boolean,
      default: false,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    capacityCbf: {
      type: Number,
      min: 0,
    },
    binCount: {
      type: Number,
      min: 0,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    gpsLatitude: {
      type: Number,
    },
    gpsLongitude: {
      type: Number,
    },
    geofenceRadiusMeters: {
      type: Number,
      default: 50,
      min: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook: sync location coordinates and gpsLatitude / gpsLongitude
WarehouseSchema.pre('validate', function (next) {
  if (this.gpsLatitude !== undefined && this.gpsLongitude !== undefined) {
    if (!this.location || !this.location.coordinates || this.location.coordinates.length < 2) {
      this.location = {
        type: 'Point',
        coordinates: [this.gpsLongitude, this.gpsLatitude],
      };
    }
  } else if (this.location && Array.isArray(this.location.coordinates) && this.location.coordinates.length >= 2) {
    if (this.gpsLongitude === undefined) this.gpsLongitude = this.location.coordinates[0];
    if (this.gpsLatitude === undefined) this.gpsLatitude = this.location.coordinates[1];
  }
  next();
});

// Explicit Indexes matching Database-Schema.md §7.2 and Prompt 43
WarehouseSchema.index({ warehouseCode: 1 }, { unique: true });
WarehouseSchema.index({ type: 1, isActive: 1 });
WarehouseSchema.index({ district: 1 });

export const WarehouseModel = model<IWarehouse>('Warehouse', WarehouseSchema);
export default WarehouseModel;
