import { z } from 'zod';

export const createTicketSchema = z.object({
  type: z.enum(['COMPLAINT', 'INQUIRY', 'SUPPORT_TICKET', 'RETURN_REQUEST', 'WARRANTY_CLAIM', 'TECHNICAL_ASSISTANCE', 'FEEDBACK']).optional(),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters'),
  customerId: z.string().trim().optional(),
  customerName: z.string().trim().min(2, 'Customer name is required'),
  customerPhone: z.string().trim().min(6, 'Valid customer phone is required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  orderId: z.string().trim().optional(),
  orderNumber: z.string().trim().optional(),
  productId: z.string().trim().optional(),
  productName: z.string().trim().optional(),
  productSku: z.string().trim().optional(),
  serialNumber: z.string().trim().optional(),
  category: z.enum(['DEFECTIVE_PRODUCT', 'BILLING', 'DELIVERY_DELAY', 'DAMAGED_PARCEL', 'WARRANTY_ISSUE', 'INSTALLATION', 'GENERAL_INQUIRY', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT']).optional(),
  severity: z.enum(['MINOR', 'MODERATE', 'MAJOR', 'BLOCKER']).optional(),
  channel: z.enum(['WEB', 'PORTAL', 'PHONE', 'EMAIL', 'LIVE_CHAT', 'WHATSAPP', 'IN_PERSON']).optional(),
  assignedTo: z.string().trim().optional(),
  assignedToName: z.string().trim().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    size: z.number().optional(),
    type: z.string().optional(),
  })).optional(),
});

export const addTicketMessageSchema = z.object({
  senderType: z.enum(['CUSTOMER', 'AGENT', 'SYSTEM', 'AI_ASSISTANT']),
  senderName: z.string().trim().min(1, 'Sender name is required'),
  messageType: z.enum(['MESSAGE', 'INTERNAL_NOTE', 'CALL_LOG', 'EMAIL', 'STATUS_CHANGE']).default('MESSAGE'),
  body: z.string().trim().min(1, 'Message body is required'),
  callDurationSeconds: z.number().min(0).optional(),
  callOutcome: z.enum(['ANSWERED', 'BUSY', 'MISSED', 'VOICEMAIL', 'FOLLOWUP_SCHEDULED']).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    size: z.number().optional(),
  })).optional(),
  isInternalOnly: z.boolean().optional(),
  aiDrafted: z.boolean().optional(),
  updateStatusTo: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED', 'CANCELLED']).optional(),
});

export const assignTicketSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required'),
  userName: z.string().trim().min(1, 'User Name is required'),
});

export const escalateTicketSchema = z.object({
  escalatedToUserId: z.string().trim().optional(),
  reason: z.string().trim().min(3, 'Escalation reason is required'),
});

export const resolveTicketSchema = z.object({
  resolutionNotes: z.string().trim().min(3, 'Resolution notes are required'),
  isClose: z.boolean().optional(),
});

export const createRmaSchema = z.object({
  ticketId: z.string().trim().optional(),
  orderId: z.string().trim().optional(),
  orderNumber: z.string().trim().optional(),
  invoiceNumber: z.string().trim().optional(),
  purchaseDate: z.string().or(z.date()).optional(),
  customerId: z.string().trim().optional(),
  customerName: z.string().trim().min(2, 'Customer name is required'),
  customerPhone: z.string().trim().min(6, 'Valid phone number is required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  returnType: z.enum(['RETURN_FOR_REFUND', 'RETURN_FOR_REPLACEMENT', 'RETURN_FOR_EXCHANGE', 'RETURN_FOR_REPAIR']),
  items: z.array(z.object({
    productId: z.string().trim(),
    productName: z.string().trim(),
    productSku: z.string().trim(),
    serialNumber: z.string().trim().optional(),
    batchNumber: z.string().trim().optional(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0),
    reason: z.enum(['DEFECTIVE', 'TRANSIT_DAMAGE', 'INCORRECT_ITEM', 'NOT_AS_DESCRIBED', 'EXPIRED', 'CUSTOMER_CHANGE_MIND']),
    reasonDetails: z.string().trim().optional(),
    requestedAction: z.enum(['REPLACEMENT', 'REFUND', 'EXCHANGE', 'REPAIR']),
    exchangeProductId: z.string().trim().optional(),
    exchangeProductName: z.string().trim().optional(),
  })).min(1, 'At least one item is required'),
  shippingMethod: z.enum(['CUSTOMER_DROP_OFF', 'COURIER_PICKUP', 'COMPANY_DRIVER']).optional(),
  pickupAddress: z.string().trim().optional(),
  internalNotes: z.string().trim().optional(),
});

export const approveRmaSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().trim().optional(),
});

export const updateShippingSchema = z.object({
  courierName: z.string().trim().optional(),
  courierTrackingNumber: z.string().trim().optional(),
  pickupScheduledDate: z.string().or(z.date()).optional(),
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SHIPPING_REQUESTED', 'RECEIVED', 'INSPECTED', 'COMPLETED', 'CANCELLED']).optional(),
});

export const createInspectionSchema = z.object({
  items: z.array(z.object({
    productId: z.string().trim(),
    productName: z.string().trim(),
    serialNumber: z.string().trim().optional(),
    physicalCondition: z.enum(['LIKE_NEW', 'LIGHT_SCRATCHES', 'DAMAGED_BOX', 'SEVERELY_DAMAGED', 'BROKEN']),
    functionalStatus: z.enum(['WORKING_NORMAL', 'INTERMITTENT_FAULT', 'DEAD_ON_ARRIVAL', 'NOT_WORKING']),
    defectCategory: z.enum(['MANUFACTURING_DEFECT', 'USER_DAMAGE', 'TRANSIT_DAMAGE', 'SOFTWARE_ISSUE', 'NO_FAULT_FOUND']),
    disposition: z.enum(['RESTOCK_AS_NEW', 'REFURBISH_RESALE', 'RETURN_TO_VENDOR', 'SPARE_PARTS', 'SCRAP_DISPOSAL']),
    passedInspection: z.boolean(),
    notes: z.string().trim().optional(),
    destinationWarehouseId: z.string().trim().optional(),
  })).min(1, 'Inspection items required'),
  overallOutcome: z.enum(['ACCEPT_RETURN', 'REJECT_RETURN', 'CONDITIONAL_ACCEPT']),
  restockApproved: z.boolean().default(false),
  photos: z.array(z.string()).optional(),
  notes: z.string().trim().optional(),
});

export const registerWarrantySchema = z.object({
  productId: z.string().trim().min(1, 'Product ID is required'),
  productName: z.string().trim().min(1, 'Product Name is required'),
  productSku: z.string().trim().min(1, 'Product SKU is required'),
  serialNumber: z.string().trim().min(3, 'Serial number is required'),
  customerId: z.string().trim().optional(),
  customerName: z.string().trim().min(2, 'Customer name is required'),
  customerPhone: z.string().trim().min(6, 'Valid phone is required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  invoiceNumber: z.string().trim().optional(),
  salesOrderId: z.string().trim().optional(),
  purchaseDate: z.string().or(z.date()),
  warrantyPeriodMonths: z.number().min(1, 'Warranty period must be at least 1 month'),
  policyType: z.enum(['STANDARD_MANUFACTURER', 'COMPREHENSIVE', 'EXTENDED_WARRANTY', 'LIMITED_PARTS_ONLY']).optional(),
  termsConditions: z.string().trim().optional(),
});

export const createWarrantyClaimSchema = z.object({
  warrantyId: z.string().trim().min(1, 'Warranty ID is required'),
  ticketId: z.string().trim().optional(),
  serialNumber: z.string().trim().min(1, 'Serial number is required'),
  customerId: z.string().trim().optional(),
  customerName: z.string().trim().min(2, 'Customer name is required'),
  problemDescription: z.string().trim().min(5, 'Problem description is required'),
  reportedDefects: z.array(z.string().trim()).optional(),
});

export const createRepairJobCardSchema = z.object({
  ticketId: z.string().trim().optional(),
  warrantyClaimId: z.string().trim().optional(),
  serviceCenterName: z.string().trim().optional(),
  productId: z.string().trim().min(1, 'Product ID is required'),
  productName: z.string().trim().min(1, 'Product Name is required'),
  serialNumber: z.string().trim().optional(),
  customerName: z.string().trim().min(2, 'Customer name is required'),
  customerPhone: z.string().trim().min(6, 'Customer phone is required'),
  technicianId: z.string().trim().optional(),
  technicianName: z.string().trim().optional(),
  faultDescription: z.string().trim().min(3, 'Fault description is required'),
});

export const updateRepairJobCardSchema = z.object({
  technicianId: z.string().trim().optional(),
  technicianName: z.string().trim().optional(),
  diagnosisNotes: z.string().trim().optional(),
  sparePartsUsed: z.array(z.object({
    sparePartId: z.string().trim().optional(),
    partName: z.string().trim(),
    partCode: z.string().trim(),
    quantity: z.number().min(1),
    unitCost: z.number().min(0),
    totalCost: z.number().min(0),
  })).optional(),
  laborHours: z.number().min(0).optional(),
  laborRatePerHour: z.number().min(0).optional(),
  warrantyCoveredCost: z.number().min(0).optional(),
  status: z.enum(['PENDING_ASSIGNMENT', 'IN_DIAGNOSIS', 'AWAITING_PARTS', 'IN_REPAIR', 'TESTING_QC', 'COMPLETED', 'DELIVERED_TO_CUSTOMER', 'CANCELLED']).optional(),
  qcPassed: z.boolean().optional(),
  qcNotes: z.string().trim().optional(),
});

export const submitCustomerFeedbackSchema = z.object({
  ticketId: z.string().trim().min(1, 'Ticket ID is required'),
  customerId: z.string().trim().optional(),
  customerName: z.string().trim().min(2, 'Customer name is required'),
  customerPhone: z.string().trim().optional(),
  rating: z.number().min(1).max(5),
  feedback: z.string().trim().optional(),
  agentRating: z.number().min(1).max(5).optional(),
  resolutionSpeedRating: z.number().min(1).max(5).optional(),
  productQualityRating: z.number().min(1).max(5).optional(),
});

export const updateSupportSettingsSchema = z.object({
  businessHours: z.object({
    startTime: z.string(),
    endTime: z.string(),
    workingDays: z.array(z.string()),
  }).optional(),
  slaTargets: z.object({
    criticalHours: z.number().min(1),
    highHours: z.number().min(1),
    mediumHours: z.number().min(1),
    lowHours: z.number().min(1),
  }).optional(),
  returnWindowDays: z.number().min(1).optional(),
  allowAutomatedAiDrafts: z.boolean().optional(),
  escalationEmail: z.string().email().optional(),
  enableSmsAlerts: z.boolean().optional(),
  warrantyGracePeriodDays: z.number().min(0).optional(),
  defaultServiceCenter: z.string().trim().optional(),
});

export const aiQuerySchema = z.object({
  query: z.string().trim().min(2, 'Query must be at least 2 characters'),
  context: z.any().optional(),
});
