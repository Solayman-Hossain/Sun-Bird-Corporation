import { Schema, model, Document, Types } from 'mongoose';

export type CrmActivityType =
  | 'LEAD'
  | 'ENQUIRY'
  | 'VISIT_LOG'
  | 'COMPLAINT'
  | 'QUOTATION_FOLLOWUP';

export type CrmActivityStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ICrmActivity extends Document {
  _id: Types.ObjectId;
  activityNumber: string;
  activityType: CrmActivityType;
  customerId?: Types.ObjectId;
  leadName?: string;
  contactMobile: string;
  assignedStaffId?: Types.ObjectId;
  notes: string;
  followUpDate?: Date;
  status: CrmActivityStatus;
  outcome?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CrmActivitySchema = new Schema<ICrmActivity>(
  {
    activityNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    activityType: {
      type: String,
      enum: {
        values: ['LEAD', 'ENQUIRY', 'VISIT_LOG', 'COMPLAINT', 'QUOTATION_FOLLOWUP'],
        message: 'Invalid CRM activity type',
      },
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    leadName: {
      type: String,
      trim: true,
    },
    contactMobile: {
      type: String,
      required: true,
      trim: true,
    },
    assignedStaffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      required: true,
      trim: true,
    },
    followUpDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    outcome: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Explicit Indexes matching Database-Schema.md §7.3 and Prompt 43
CrmActivitySchema.index({ activityNumber: 1 }, { unique: true });
CrmActivitySchema.index({ contactMobile: 1 });
CrmActivitySchema.index({ assignedStaffId: 1, status: 1 });
CrmActivitySchema.index({ followUpDate: 1 });
CrmActivitySchema.index({ customerId: 1 });
CrmActivitySchema.index({ activityType: 1, status: 1 });

export const CrmActivityModel = model<ICrmActivity>('CrmActivity', CrmActivitySchema);
export default CrmActivityModel;
