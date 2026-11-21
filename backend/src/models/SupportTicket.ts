import { Schema, model, Document, Types } from 'mongoose';

export type TicketType =
  | 'COMPLAINT'
  | 'INQUIRY'
  | 'SUPPORT_TICKET'
  | 'RETURN_REQUEST'
  | 'WARRANTY_CLAIM'
  | 'TECHNICAL_ASSISTANCE'
  | 'FEEDBACK';

export type TicketCategory =
  | 'DEFECTIVE_PRODUCT'
  | 'BILLING'
  | 'DELIVERY_DELAY'
  | 'DAMAGED_PARCEL'
  | 'WARRANTY_ISSUE'
  | 'INSTALLATION'
  | 'GENERAL_INQUIRY'
  | 'OTHER';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'URGENT';
export type TicketSeverity = 'MINOR' | 'MODERATE' | 'MAJOR' | 'BLOCKER';

export type TicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CUSTOMER'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type TicketChannel =
  | 'WEB'
  | 'PORTAL'
  | 'PHONE'
  | 'EMAIL'
  | 'LIVE_CHAT'
  | 'WHATSAPP'
  | 'IN_PERSON';

export interface ISupportTicket extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  ticketNumber: string; // TKT-2026-0001
  type: TicketType;
  subject: string;
  description: string;
  customerId?: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderId?: Types.ObjectId;
  orderNumber?: string;
  productId?: Types.ObjectId;
  productName?: string;
  productSku?: string;
  serialNumber?: string;
  category: TicketCategory;
  priority: TicketPriority;
  severity: TicketSeverity;
  status: TicketStatus;
  channel: TicketChannel;
  assignedTo?: Types.ObjectId;
  assignedToName?: string;
  assignedAt?: Date;
  slaHours: number;
  slaDueAt: Date;
  isSlaBreached: boolean;
  escalatedTo?: Types.ObjectId;
  escalationLevel: number;
  escalationReason?: string;
  aiSentiment: 'VERY_NEGATIVE' | 'NEGATIVE' | 'NEUTRAL' | 'POSITIVE' | 'VERY_POSITIVE';
  aiSentimentScore: number; // -1 to 1
  aiSuggestedPriority?: string;
  aiSuggestedCategory?: string;
  aiSuggestedResponse?: string;
  aiDiagnosticSummary?: string;
  resolutionNotes?: string;
  resolvedAt?: Date;
  closedAt?: Date;
  tags: string[];
  attachments: Array<{
    name: string;
    url: string;
    size?: number;
    type?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    ticketNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: {
      type: String,
      enum: ['COMPLAINT', 'INQUIRY', 'SUPPORT_TICKET', 'RETURN_REQUEST', 'WARRANTY_CLAIM', 'TECHNICAL_ASSISTANCE', 'FEEDBACK'],
      default: 'SUPPORT_TICKET',
      index: true,
    },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, lowercase: true, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    orderNumber: { type: String, trim: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, trim: true },
    productSku: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    category: {
      type: String,
      enum: ['DEFECTIVE_PRODUCT', 'BILLING', 'DELIVERY_DELAY', 'DAMAGED_PARCEL', 'WARRANTY_ISSUE', 'INSTALLATION', 'GENERAL_INQUIRY', 'OTHER'],
      default: 'GENERAL_INQUIRY',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    severity: {
      type: String,
      enum: ['MINOR', 'MODERATE', 'MAJOR', 'BLOCKER'],
      default: 'MODERATE',
    },
    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED', 'CANCELLED'],
      default: 'OPEN',
      index: true,
    },
    channel: {
      type: String,
      enum: ['WEB', 'PORTAL', 'PHONE', 'EMAIL', 'LIVE_CHAT', 'WHATSAPP', 'IN_PERSON'],
      default: 'PORTAL',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedToName: { type: String, trim: true },
    assignedAt: { type: Date },
    slaHours: { type: Number, default: 24 },
    slaDueAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
    isSlaBreached: { type: Boolean, default: false },
    escalatedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    escalationLevel: { type: Number, default: 0 },
    escalationReason: { type: String },
    aiSentiment: {
      type: String,
      enum: ['VERY_NEGATIVE', 'NEGATIVE', 'NEUTRAL', 'POSITIVE', 'VERY_POSITIVE'],
      default: 'NEUTRAL',
    },
    aiSentimentScore: { type: Number, default: 0 },
    aiSuggestedPriority: { type: String },
    aiSuggestedCategory: { type: String },
    aiSuggestedResponse: { type: String },
    aiDiagnosticSummary: { type: String },
    resolutionNotes: { type: String },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    tags: [{ type: String, trim: true }],
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number },
        type: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

SupportTicketSchema.index({ organizationId: 1, status: 1, priority: 1 });
SupportTicketSchema.index({ organizationId: 1, customerPhone: 1 });
SupportTicketSchema.index({ organizationId: 1, slaDueAt: 1 });

export const SupportTicket = model<ISupportTicket>('SupportTicket', SupportTicketSchema);
