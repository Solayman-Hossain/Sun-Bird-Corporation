import { Schema, model, Document, Types } from 'mongoose';

export interface IEmployeeProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  employeeCode: string;
  department: string;
  designation: string;
  joiningDate: Date;
  basicSalary: number;
  houseRentAllowance: number;
  houseRent?: number; // Alias for houseRentAllowance
  medicalAllowance: number;
  conveyanceAllowance: number;
  grossSalary: number;
  salesCommissionRate: number; // 0 to 100 percentage (e.g. 1.5 - 3.0%)
  salesRepCommissionRate?: number; // Alias
  assignedWarehouseId?: Types.ObjectId;
  loanOutstanding: number;
  casualLeaveBalance: number;
  sickLeaveBalance: number;
  earnedLeaveBalance: number;
  officeLatLng?: {
    lat?: number;
    lng?: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const EmployeeProfileSchema = new Schema<IEmployeeProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for employee profile'],
    },
    employeeCode: {
      type: String,
      required: [true, 'Employee code is required'],
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      uppercase: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    basicSalary: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: [0, 'Basic salary cannot be negative'],
    },
    houseRentAllowance: {
      type: Number,
      default: 0,
      min: [0, 'House rent allowance cannot be negative'],
    },
    medicalAllowance: {
      type: Number,
      default: 0,
      min: [0, 'Medical allowance cannot be negative'],
    },
    conveyanceAllowance: {
      type: Number,
      default: 0,
      min: [0, 'Conveyance allowance cannot be negative'],
    },
    grossSalary: {
      type: Number,
      required: [true, 'Gross salary is required'],
      min: [0, 'Gross salary cannot be negative'],
    },
    salesCommissionRate: {
      type: Number,
      default: 0,
      min: [0, 'Sales commission rate cannot be negative'],
      max: [100, 'Sales commission rate cannot exceed 100%'],
    },
    assignedWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    loanOutstanding: {
      type: Number,
      default: 0,
      min: [0, 'Loan outstanding cannot be negative'],
    },
    casualLeaveBalance: {
      type: Number,
      default: 15,
      min: 0,
    },
    sickLeaveBalance: {
      type: Number,
      default: 10,
      min: 0,
    },
    earnedLeaveBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    officeLatLng: {
      lat: { type: Number },
      lng: { type: Number },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for compatibility across schemas
EmployeeProfileSchema.virtual('houseRent')
  .get(function (this: IEmployeeProfile) {
    return this.houseRentAllowance;
  })
  .set(function (this: IEmployeeProfile, val: number) {
    this.houseRentAllowance = val;
  });

EmployeeProfileSchema.virtual('salesRepCommissionRate')
  .get(function (this: IEmployeeProfile) {
    return this.salesCommissionRate;
  })
  .set(function (this: IEmployeeProfile, val: number) {
    this.salesCommissionRate = val;
  });

// Pre-save hook: ensure grossSalary = basic + houseRent + medical + conveyance
EmployeeProfileSchema.pre('validate', function (next) {
  const basic = this.basicSalary || 0;
  const houseRent = this.houseRentAllowance || 0;
  const medical = this.medicalAllowance || 0;
  const conveyance = this.conveyanceAllowance || 0;
  
  if (this.grossSalary === undefined || this.grossSalary === null || this.isModified('basicSalary') || this.isModified('houseRentAllowance') || this.isModified('medicalAllowance') || this.isModified('conveyanceAllowance')) {
    this.grossSalary = basic + houseRent + medical + conveyance;
  }
  next();
});

// Explicit Indexes per Database-Schema.md §6.1 & Prompt 38
EmployeeProfileSchema.index({ employeeCode: 1 }, { unique: true });
EmployeeProfileSchema.index({ userId: 1 }, { unique: true });
EmployeeProfileSchema.index({ department: 1 });
EmployeeProfileSchema.index({ isActive: 1 });

export const EmployeeProfileModel = model<IEmployeeProfile>('EmployeeProfile', EmployeeProfileSchema);
