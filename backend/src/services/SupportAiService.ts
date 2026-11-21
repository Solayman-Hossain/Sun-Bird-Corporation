import { GoogleGenAI } from '@google/genai';
import env from '../config/env';
import logger from '../config/logger';

export interface ComplaintAiAnalysis {
  category: 'DEFECTIVE_PRODUCT' | 'BILLING' | 'DELIVERY_DELAY' | 'DAMAGED_PARCEL' | 'WARRANTY_ISSUE' | 'INSTALLATION' | 'GENERAL_INQUIRY' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'URGENT';
  sentiment: 'VERY_NEGATIVE' | 'NEGATIVE' | 'NEUTRAL' | 'POSITIVE' | 'VERY_POSITIVE';
  sentimentScore: number; // -1.0 to 1.0
  rootCauseDiagnosis: string;
  recommendedAction: string;
  recommendedSlaHours: number;
}

export interface ReturnEligibilityAiResult {
  isEligible: boolean;
  confidenceScore: number;
  policyViolations: string[];
  recommendedAction: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export interface WarrantyAiVerification {
  isCovered: boolean;
  warrantyStatus: 'ACTIVE' | 'EXPIRED' | 'VOIDED' | 'EXTENDED';
  coveredParts: string[];
  excludedReasons: string[];
  recommendedAction: string;
  explanation: string;
}

export interface TroubleshootingAdvice {
  productName: string;
  primaryDiagnosis: string;
  steps: string[];
  safetyWarnings: string[];
  requiresServiceCenter: boolean;
  suggestedSpareParts: string[];
}

export interface SupportAiAssistantResponse {
  answer: string;
  confidenceScore: number;
  suggestedActions: string[];
  generatedBy: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK';
}

export class SupportAiService {
  /**
   * Helper to execute Gemini 1.5 Pro prompt or trigger deterministic fallback
   */
  private static async executeGeminiPrompt(
    prompt: string,
    fallbackGenerator: () => any
  ): Promise<{ result: any; generatedBy: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK' }> {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
      try {
        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-pro',
          contents: prompt,
        });

        const text = response?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return { result: parsed, generatedBy: 'GEMINI_AI' };
        } else if (text.trim().length > 0) {
          return { result: { answer: text.trim() }, generatedBy: 'GEMINI_AI' };
        }
      } catch (err: any) {
        logger.warn(`SupportAiService Gemini API failed: ${err.message}. Engaging medical support deterministic fallback.`);
      }
    }
    return { result: fallbackGenerator(), generatedBy: 'DETERMINISTIC_FALLBACK' };
  }

  /**
   * 1. Analyze and classify incoming customer complaints
   */
  public static async analyzeComplaint(
    subject: string,
    description: string
  ): Promise<ComplaintAiAnalysis> {
    const combined = `${subject} ${description}`.toLowerCase();

    const fallback = (): ComplaintAiAnalysis => {
      let category: ComplaintAiAnalysis['category'] = 'GENERAL_INQUIRY';
      let priority: ComplaintAiAnalysis['priority'] = 'MEDIUM';
      let sentiment: ComplaintAiAnalysis['sentiment'] = 'NEUTRAL';
      let score = 0.0;
      let recommendedSla = 24;

      if (combined.includes('broken') || combined.includes('not working') || combined.includes('dead') || combined.includes('faulty') || combined.includes('defect')) {
        category = 'DEFECTIVE_PRODUCT';
        priority = 'HIGH';
        sentiment = 'NEGATIVE';
        score = -0.6;
        recommendedSla = 12;
      } else if (combined.includes('delay') || combined.includes('not received') || combined.includes('late') || combined.includes('tracking')) {
        category = 'DELIVERY_DELAY';
        priority = 'MEDIUM';
        sentiment = 'NEGATIVE';
        score = -0.4;
        recommendedSla = 12;
      } else if (combined.includes('warranty') || combined.includes('claim') || combined.includes('guarantee')) {
        category = 'WARRANTY_ISSUE';
        priority = 'HIGH';
        sentiment = 'NEUTRAL';
        score = -0.1;
        recommendedSla = 16;
      } else if (combined.includes('billing') || combined.includes('refund') || combined.includes('charged') || combined.includes('overcharge')) {
        category = 'BILLING';
        priority = 'HIGH';
        sentiment = 'NEGATIVE';
        score = -0.5;
        recommendedSla = 8;
      }

      if (combined.includes('urgent') || combined.includes('critical') || combined.includes('emergency') || combined.includes('hospital') || combined.includes('patient') || combined.includes('danger')) {
        priority = 'CRITICAL';
        sentiment = 'VERY_NEGATIVE';
        score = -0.9;
        recommendedSla = 4;
      }

      return {
        category,
        priority,
        sentiment,
        sentimentScore: score,
        rootCauseDiagnosis: `Preliminary automated triage identified issue relating to ${category.toLowerCase().replace(/_/g, ' ')}. Requires verification by support engineer.`,
        recommendedAction: priority === 'CRITICAL'
          ? 'Immediate dispatch to Senior Technical Support / Service Lead within 4 hours.'
          : 'Standard triage: Review warranty status and dispatch customer acknowledgment message.',
        recommendedSlaHours: recommendedSla,
      };
    };

    const prompt = `You are the Senior Technical Support AI for SUN BIRD Corporation (Medical Devices & Healthcare ERP).
Analyze this customer complaint/inquiry:
Subject: "${subject}"
Description: "${description}"

Respond in valid JSON only with keys:
{
  "category": "DEFECTIVE_PRODUCT" | "BILLING" | "DELIVERY_DELAY" | "DAMAGED_PARCEL" | "WARRANTY_ISSUE" | "INSTALLATION" | "GENERAL_INQUIRY" | "OTHER",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "URGENT",
  "sentiment": "VERY_NEGATIVE" | "NEGATIVE" | "NEUTRAL" | "POSITIVE" | "VERY_POSITIVE",
  "sentimentScore": <float between -1.0 and 1.0>,
  "rootCauseDiagnosis": "<brief technical diagnosis>",
  "recommendedAction": "<immediate next step recommendation>",
  "recommendedSlaHours": <number of hours, e.g. 4, 8, 12, 24>
}`;

    const res = await this.executeGeminiPrompt(prompt, fallback);
    return res.result;
  }

  /**
   * 2. Draft Polite, Medical-Grade Customer Support Responses
   */
  public static async draftCustomerReply(
    ticket: {
      ticketNumber: string;
      customerName: string;
      subject: string;
      description: string;
      status: string;
      productName?: string;
    },
    agentNotes?: string
  ): Promise<{ draftedMessage: string; tone: string; suggestedNextStep: string }> {
    const fallback = () => {
      const greeting = `Dear ${ticket.customerName || 'Valued Customer'},`;
      const ref = `Thank you for contacting SUN BIRD Corporation Support regarding ticket #${ticket.ticketNumber} ("${ticket.subject}").`;
      let body = `We understand how crucial prompt assistance is, especially concerning our medical and healthcare equipment. `;
      if (ticket.productName) {
        body += `Our technical service team is actively reviewing the reported issue with your ${ticket.productName}. `;
      } else {
        body += `Our specialized customer support desk has received your details and is actively investigating your request. `;
      }
      if (agentNotes) {
        body += `\n\nUpdate from Technical Team: ${agentNotes}\n\n`;
      }
      body += `A certified service engineer will follow up with you directly if further diagnostic steps are required. Please feel free to reply to this message should you have additional details.`;
      const closing = `\n\nWarm regards,\nCustomer Care & Technical Services Team\nSUN BIRD Corporation`;

      return {
        draftedMessage: `${greeting}\n\n${ref}\n\n${body}${closing}`,
        tone: 'Courteous, Professional & Healthcare-focused',
        suggestedNextStep: 'Send draft to customer or schedule technician call if hardware diagnosis is needed.',
      };
    };

    const prompt = `You are a Customer Service AI Copilot for SUN BIRD Corporation, a leading medical device, diagnostic equipment, and surgical supplies distributor in Bangladesh.
Draft a professional, reassuring, and empathetic customer email/message reply.

Ticket:
Ticket Number: ${ticket.ticketNumber}
Customer: ${ticket.customerName}
Subject: ${ticket.subject}
Description: ${ticket.description}
Status: ${ticket.status}
Product: ${ticket.productName || 'N/A'}
Internal Agent Notes: ${agentNotes || 'None'}

Return valid JSON with:
{
  "draftedMessage": "<Full email response text in courteous, empathetic, professional English>",
  "tone": "<e.g., Empathetic, Courteous, Technical>",
  "suggestedNextStep": "<next step for the agent>"
}`;

    const res = await this.executeGeminiPrompt(prompt, fallback);
    return res.result;
  }

  /**
   * 3. Evaluate RMA / Return Eligibility against Organization Return Policy
   */
  public static assessReturnEligibility(
    purchaseDate: Date | string,
    reason: string,
    returnWindowDays: number = 14,
    condition?: string
  ): ReturnEligibilityAiResult {
    const pDate = new Date(purchaseDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - pDate.getTime()) / (1000 * 3600 * 24));
    const violations: string[] = [];
    let isEligible = true;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let confidenceScore = 95;

    if (diffDays > returnWindowDays) {
      violations.push(`Purchase date was ${diffDays} days ago, exceeding the standard ${returnWindowDays}-day return window.`);
      isEligible = false;
      riskLevel = 'HIGH';
    }

    if (reason === 'CUSTOMER_CHANGE_MIND' && condition !== 'LIKE_NEW') {
      violations.push('Discretionary returns (change of mind) require unblemished packaging and like-new condition.');
      isEligible = false;
      riskLevel = 'MEDIUM';
    }

    if (reason === 'EXPIRED') {
      violations.push('Expired lot return requires Batch / Quality Assurance verification.');
      riskLevel = 'HIGH';
    }

    let recommendedAction = 'Accept for physical warehouse inspection and replacement/refund authorization.';
    if (!isEligible) {
      recommendedAction = diffDays > returnWindowDays
        ? 'Decline return for refund; offer warranty repair service or out-of-warranty refurbishment instead.'
        : 'Requires supervisor manual exception approval.';
    }

    return {
      isEligible,
      confidenceScore,
      policyViolations: violations,
      recommendedAction,
      riskLevel,
      explanation: isEligible
        ? `Request is within the ${returnWindowDays}-day window (${diffDays} days elapsed). Qualifies for RMA intake inspection.`
        : `Request violates return policy: ${violations.join(' ')}`,
    };
  }

  /**
   * 4. Verify Warranty Coverage
   */
  public static verifyWarrantyAi(
    serialNumber: string,
    defectDescription: string,
    warrantyRecord?: {
      status: string;
      startDate: Date;
      endDate: Date;
      productName: string;
      policyType: string;
    } | null
  ): WarrantyAiVerification {
    if (!warrantyRecord) {
      return {
        isCovered: false,
        warrantyStatus: 'VOIDED',
        coveredParts: [],
        excludedReasons: [`Serial number ${serialNumber} not found in verified warranty database.`],
        recommendedAction: 'Direct customer to register product invoice or request proof of purchase.',
        explanation: 'Unregistered product serial number. Cannot validate warranty eligibility without authentic invoice.',
      };
    }

    const now = new Date();
    const isExpired = new Date(warrantyRecord.endDate) < now;
    const isVoided = warrantyRecord.status === 'VOIDED';

    const defLower = defectDescription.toLowerCase();
    const isAccidentalOrLiquid = defLower.includes('water') || defLower.includes('liquid') || defLower.includes('dropped') || defLower.includes('cracked screen') || defLower.includes('physical damage');

    const excludedReasons: string[] = [];
    let isCovered = true;

    if (isExpired) {
      isCovered = false;
      excludedReasons.push(`Warranty expired on ${new Date(warrantyRecord.endDate).toLocaleDateString()}.`);
    }

    if (isVoided) {
      isCovered = false;
      excludedReasons.push('Warranty was previously voided due to unauthorized tampering or policy violation.');
    }

    if (isAccidentalOrLiquid && warrantyRecord.policyType !== 'COMPREHENSIVE') {
      isCovered = false;
      excludedReasons.push('Accidental/Liquid damage is excluded under standard manufacturer warranty policy.');
    }

    return {
      isCovered,
      warrantyStatus: isCovered ? 'ACTIVE' : (isExpired ? 'EXPIRED' : (isVoided ? 'VOIDED' : 'ACTIVE')),
      coveredParts: ['Motherboard', 'Internal Power Supply', 'Sensors', 'Display Module', 'Pumping Assembly'],
      excludedReasons,
      recommendedAction: isCovered
        ? 'Generate Repair Job Card under warranty (Zero parts charge for covered components).'
        : 'Generate Out-of-Warranty estimate for customer approval before dispatching technician.',
      explanation: isCovered
        ? `Valid ${warrantyRecord.policyType} warranty active until ${new Date(warrantyRecord.endDate).toLocaleDateString()}. Defects are covered under standard service terms.`
        : `Warranty claim excluded: ${excludedReasons.join(' ')}`,
    };
  }

  /**
   * 5. Generate Technical Troubleshooting Advice & Spare Part Suggestions
   */
  public static async generateTroubleshooting(
    productName: string,
    faultDescription: string
  ): Promise<TroubleshootingAdvice> {
    const fallback = (): TroubleshootingAdvice => {
      const lower = faultDescription.toLowerCase();
      const steps = [
        'Ensure the device power cable is firmly connected to a surge-protected grounding socket.',
        'Perform a power cycle: switch off device, disconnect AC power for 60 seconds, and reconnect.',
        'Check indicator LEDs and error codes displayed on the front panel.',
        'Inspect calibration seals and ensure fluid/air conduits are free of blockages.',
      ];
      const suggestedParts: string[] = [];

      if (lower.includes('power') || lower.includes('dead') || lower.includes('no display')) {
        steps.push('Check external fuse and test input voltage (should be 220V ± 10% AC).');
        suggestedParts.push('SMPS Power Supply Board', 'Input Glass Fuse 5A', 'Main Power Switch');
      } else if (lower.includes('sensor') || lower.includes('reading') || lower.includes('inaccurate')) {
        steps.push('Clean optical/electrochemical sensor heads using isopropyl alcohol wipes.');
        steps.push('Run device self-calibration routine per maintenance manual Section 4.');
        suggestedParts.push('Replacement Calibration Sensor', 'Sensor Probe Assembly');
      } else {
        suggestedParts.push('Service Seal Kit', 'Backup Battery');
      }

      return {
        productName,
        primaryDiagnosis: `Diagnostic review for "${faultDescription}". Hardware triage required.`,
        steps,
        safetyWarnings: [
          'High voltage internal components: Disconnect main AC supply before opening chassis.',
          'Medical hygiene protocol: Disinfect all external surfaces before technician handling.',
        ],
        requiresServiceCenter: lower.includes('motor') || lower.includes('leak') || lower.includes('burnt') || lower.includes('spark'),
        suggestedSpareParts: suggestedParts,
      };
    };

    const prompt = `You are a Senior Biomedical & Electronics Field Engineer for SUN BIRD Corporation.
Generate technical troubleshooting steps for this device issue:
Product: ${productName}
Fault Description: ${faultDescription}

Return valid JSON with:
{
  "productName": "${productName}",
  "primaryDiagnosis": "<clinical/technical diagnosis>",
  "steps": ["Step 1...", "Step 2...", "Step 3..."],
  "safetyWarnings": ["Warning 1..."],
  "requiresServiceCenter": <boolean>,
  "suggestedSpareParts": ["Part 1", "Part 2"]
}`;

    const res = await this.executeGeminiPrompt(prompt, fallback);
    return res.result;
  }

  /**
   * 6. AI Interactive Support Assistant Chatbot Query
   */
  public static async askAiSupportAssistant(
    query: string,
    context?: { customerName?: string; ticketCount?: number; openTickets?: any[] }
  ): Promise<SupportAiAssistantResponse> {
    const fallback = (): SupportAiAssistantResponse => {
      const qLower = query.toLowerCase();
      let answer = 'Welcome to the SUN BIRD Support AI Co-Pilot. I can assist with ticket triaging, SLA risk prediction, return policy checks, and warranty claim validation.';

      if (qLower.includes('return') || qLower.includes('rma') || qLower.includes('refund')) {
        answer = 'Our standard RMA return window is 14 days from purchase. Returned items require intake inspection at Central Warehouse before a replacement or accounting credit voucher can be authorized.';
      } else if (qLower.includes('warranty') || qLower.includes('claim')) {
        answer = 'Standard medical devices carry 12 to 24 months manufacturer warranty. Serial numbers must be verified against sales invoice records to confirm coverage of internal electronic boards and sensors.';
      } else if (qLower.includes('sla') || qLower.includes('breach')) {
        answer = 'SLA targets are: Critical (4 hours), High (12 hours), Medium (24 hours), Low (48 hours). Any critical ticket within 1 hour of breach triggers automated supervisor escalation.';
      }

      return {
        answer,
        confidenceScore: 92,
        suggestedActions: [
          'Review open complaints',
          'Check warranty by serial number',
          'Evaluate return eligibility',
          'Draft customer reply',
        ],
        generatedBy: 'DETERMINISTIC_FALLBACK',
      };
    };

    const prompt = `You are the Sun Bird ERP Support Assistant AI for RMA, Tickets, Warranty and Returns.
User Query: "${query}"
Context: ${JSON.stringify(context || {})}

Return valid JSON with:
{
  "answer": "<Helpful, clear answer tailored to medical device customer support and RMA>",
  "confidenceScore": <integer 80-99>,
  "suggestedActions": ["Action 1", "Action 2", "Action 3"]
}`;

    const res = await this.executeGeminiPrompt(prompt, fallback);
    return {
      answer: res.result.answer || fallback().answer,
      confidenceScore: res.result.confidenceScore || 90,
      suggestedActions: res.result.suggestedActions || ['View open tickets', 'Check RMA status'],
      generatedBy: res.generatedBy,
    };
  }
}
