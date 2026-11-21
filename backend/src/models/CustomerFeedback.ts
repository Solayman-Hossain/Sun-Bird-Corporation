import { Schema, model, Document, Types } from 'mongoose';

export type CsatCategory =
  | 'VERY_SATISFIED'
  | 'SATISFIED'
  | 'NEUTRAL'
  | 'DISSATISFIED'
  | 'VERY_DISSATISFIED';

export interface ICustomerFeedback extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  ticketId: Types.ObjectId;
  customerId?: Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  rating: number; // 1 to 5
  csatCategory: CsatCategory;
  feedback?: string;
  agentRating?: number;
  resolutionSpeedRating?: number;
  productQualityRating?: number;
  aiSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  createdAt: Date;
  updatedAt: Date;
}

const CustomerFeedbackSchema = new Schema<ICustomerFeedback>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    csatCategory: {
      type: String,
      enum: ['VERY_SATISFIED', 'SATISFIED', 'NEUTRAL', 'DISSATISFIED', 'VERY_DISSATISFIED'],
      required: true,
    },
    feedback: { type: String },
    agentRating: { type: Number, min: 1, max: 5 },
    resolutionSpeedRating: { type: Number, min: 1, max: 5 },
    productQualityRating: { type: Number, min: 1, max: 5 },
    aiSentiment: {
      type: String,
      enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'],
      default: 'NEUTRAL',
    },
  },
  {
    timestamps: true,
  }
);

CustomerFeedbackSchema.index({ organizationId: 1, rating: 1 });

export const CustomerFeedback = model<ICustomerFeedback>('CustomerFeedback', CustomerFeedbackSchema);
