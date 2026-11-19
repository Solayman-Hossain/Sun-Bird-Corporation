import { Schema, model, Document, Types } from 'mongoose';

export interface IEmployeeEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  altPhone?: string;
  address?: string;
  isPrimary?: boolean;
}

export interface IEmployeeDocument {
  docType: string;
  title: string;
  docUrl: string;
  expiryDate?: Date;
  verified?: boolean;
}

export interface IEmployeeProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;
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
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    bloodGroup?: string;
    nidNumber?: string;
    passportNumber?: string;
    maritalStatus?: string;
    religion?: string;
    nationality?: string;
    photoUrl?: string;
    signatureUrl?: string;
  };
  contactInfo?: {
    personalEmail?: string;
    officialEmail?: string;
    personalPhone?: string;
    officialPhone?: string;
    presentAddress?: string;
    permanentAddress?: string;
  };
  emergencyContacts?: IEmployeeEmergencyContact[];
  employmentDetails?: {
    departmentId?: Types.ObjectId;
    designationId?: Types.ObjectId;
    jobGradeId?: Types.ObjectId;
    employmentTypeId?: Types.ObjectId;
    reportingToId?: Types.ObjectId;
    shiftId?: Types.ObjectId;
    employmentType?: string;
    status?: 'PROBATION' | 'CONFIRMED' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED' | 'RETIRED';
    probationEndDate?: Date;
    confirmationDate?: Date;
    resignationDate?: Date;
    lastWorkingDate?: Date;
    offboardingNotes?: string;
    offboardingClearance?: {
      itClearance: boolean;
      accountsClearance: boolean;
      adminClearance: boolean;
      hrClearance: boolean;
    };
    onboardingChecklist?: Array<{ task: string; completed: boolean; completedAt?: Date }>;
  };
  bankDetails?: {
    bankName?: string;
    branchName?: string;
    accountName?: string;
    accountNo?: string;
    routingNo?: string;
    paymentMethod?: 'BANK' | 'CASH' | 'MFS' | 'CHEQUE';
  };
  documents?: IEmployeeDocument[];
  salaryStructureId?: Types.ObjectId;
  isActive: boolean;
  // Extended Desktop Employee Details Sheet Fields
  againstId?: string; // কার পরিবর্তে যোগদান করছে তার আইডি
  againstName?: string; // কার পরিবর্তে যোগদান করছে তার নাম
  fatherOrHusbandName?: string;
  motherName?: string;
  age?: number;
  qualification?: string;
  highQualification?: string;
  jobGrade?: string;
  joiningSalary?: number;
  currentSalary?: number;
  allowance?: number;
  overtime?: number;
  dateOfModify?: Date;
  jobDuration?: string;
  jobDescriptionCategory?: string;
  jobDescriptionIndividual?: string;
  responsibilitiesIndividual?: string;
  cityDistrict?: string;
  depSl?: number;
  salSl?: number;
  idCardGiven?: boolean;
  idCardGivenDate?: Date;
  isResigned?: boolean;
  terminationOrResignedDate?: Date;
  leaveReport?: {
    cl?: number;
    sl?: number;
    wp?: number;
    ml?: number;
    el?: number;
    gh?: number;
  };
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
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    personalInfo: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      dateOfBirth: { type: Date },
      gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
      bloodGroup: { type: String, trim: true },
      nidNumber: { type: String, trim: true },
      passportNumber: { type: String, trim: true },
      maritalStatus: { type: String, trim: true },
      religion: { type: String, trim: true },
      nationality: { type: String, trim: true, default: 'Bangladeshi' },
      photoUrl: { type: String, trim: true },
      signatureUrl: { type: String, trim: true },
    },
    contactInfo: {
      personalEmail: { type: String, trim: true, lowercase: true },
      officialEmail: { type: String, trim: true, lowercase: true },
      personalPhone: { type: String, trim: true },
      officialPhone: { type: String, trim: true },
      presentAddress: { type: String, trim: true },
      permanentAddress: { type: String, trim: true },
    },
    emergencyContacts: [
      {
        name: { type: String, required: true },
        relationship: { type: String, required: true },
        phone: { type: String, required: true },
        altPhone: { type: String },
        address: { type: String },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    employmentDetails: {
      departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
      designationId: { type: Schema.Types.ObjectId, ref: 'Designation' },
      jobGradeId: { type: Schema.Types.ObjectId, ref: 'JobGrade' },
      employmentTypeId: { type: Schema.Types.ObjectId, ref: 'EmploymentType' },
      reportingToId: { type: Schema.Types.ObjectId, ref: 'EmployeeProfile' },
      shiftId: { type: Schema.Types.ObjectId, ref: 'Shift' },
      employmentType: { type: String, default: 'PERMANENT' },
      status: {
        type: String,
        enum: ['PROBATION', 'CONFIRMED', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'RETIRED'],
        default: 'PROBATION',
      },
      probationEndDate: { type: Date },
      confirmationDate: { type: Date },
      resignationDate: { type: Date },
      lastWorkingDate: { type: Date },
      offboardingNotes: { type: String },
      offboardingClearance: {
        itClearance: { type: Boolean, default: false },
        accountsClearance: { type: Boolean, default: false },
        adminClearance: { type: Boolean, default: false },
        hrClearance: { type: Boolean, default: false },
      },
      onboardingChecklist: [
        {
          task: { type: String, required: true },
          completed: { type: Boolean, default: false },
          completedAt: { type: Date },
        },
      ],
    },
    bankDetails: {
      bankName: { type: String, trim: true },
      branchName: { type: String, trim: true },
      accountName: { type: String, trim: true },
      accountNo: { type: String, trim: true },
      routingNo: { type: String, trim: true },
      paymentMethod: {
        type: String,
        enum: ['BANK', 'CASH', 'MFS', 'CHEQUE'],
        default: 'BANK',
      },
    },
    documents: [
      {
        docType: { type: String, required: true },
        title: { type: String, required: true },
        docUrl: { type: String, required: true },
        expiryDate: { type: Date },
        verified: { type: Boolean, default: false },
      },
    ],
    salaryStructureId: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryStructure',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Extended Desktop Employee Details Sheet Fields
    againstId: { type: String, trim: true },
    againstName: { type: String, trim: true },
    fatherOrHusbandName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    age: { type: Number },
    qualification: { type: String, trim: true },
    highQualification: { type: String, trim: true },
    jobGrade: { type: String, trim: true },
    joiningSalary: { type: Number, default: 0 },
    currentSalary: { type: Number, default: 0 },
    allowance: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    dateOfModify: { type: Date },
    jobDuration: { type: String, trim: true },
    jobDescriptionCategory: { type: String, trim: true },
    jobDescriptionIndividual: { type: String, trim: true },
    responsibilitiesIndividual: { type: String, trim: true },
    cityDistrict: { type: String, trim: true },
    depSl: { type: Number, default: 0 },
    salSl: { type: Number, default: 0 },
    idCardGiven: { type: Boolean, default: false },
    idCardGivenDate: { type: Date },
    isResigned: { type: Boolean, default: false },
    terminationOrResignedDate: { type: Date },
    leaveReport: {
      cl: { type: Number, default: 0 },
      sl: { type: Number, default: 0 },
      wp: { type: Number, default: 0 },
      ml: { type: Number, default: 0 },
      el: { type: Number, default: 0 },
      gh: { type: Number, default: 0 },
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
