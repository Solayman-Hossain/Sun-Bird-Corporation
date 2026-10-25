import { GoogleGenAI } from '@google/genai';
import env from '../config/env';
import logger from '../config/logger';

export interface AnonymizedBidSummary {
  vendorAlias: string; // e.g. "Bidder A (Chison Medical)", "Bidder B (Mindray)"
  unitPrice: number;
  currency: string;
  leadTimeDays: number;
  paymentTerms?: string;
  priceScore: number;
  leadScore: number;
  termsScore: number;
  vendorScore: number;
  totalScore: number;
  isRecommended: boolean;
}

export interface CSAdvisorInput {
  csNumber: string;
  sku: string;
  productName: string;
  bids: AnonymizedBidSummary[];
}

export class GeminiAdvisor {
  /**
   * Generates an AI-assisted executive procurement summary and risk advisory
   * narrative for a 100-point Comparative Statement (CS).
   *
   * Formulates an anonymized bid matrix and prompts Google Gemini 1.5 Pro.
   * If Gemini API key is unconfigured or call fails, gracefully falls back
   * to a deterministic analytical recommendation.
   *
   * @param input Comparative Statement tender details and bid scores
   * @returns Generated executive recommendation narrative
   */
  public static async generateCsSummary(input: CSAdvisorInput): Promise<string> {
    const { csNumber, sku, productName, bids } = input;

    if (!bids || bids.length === 0) {
      return 'No supplier bids available for comparative analysis.';
    }

    // Sort bids by totalScore descending
    const sortedBids = [...bids].sort((a, b) => b.totalScore - a.totalScore);
    const recommendedBid = sortedBids[0];

    // Formulate structured prompt
    const prompt = this.buildPrompt(csNumber, sku, productName, sortedBids, recommendedBid);

    // 1. Attempt Google Gemini API if key is configured
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
      try {
        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-pro',
          contents: prompt,
        });

        const narrative = response.text?.trim();
        if (narrative) {
          logger.info(`Gemini AI CS Advisor generated narrative for ${csNumber}`);
          return narrative;
        }
      } catch (err: any) {
        logger.warn(
          `Gemini API call failed for ${csNumber}, falling back to analytical engine: ${err.message}`
        );
      }
    }

    // 2. Deterministic Structured Analytical Fallback (PRD §7.17 / Architecture §1.1)
    return this.buildDeterministicSummary(productName, sku, sortedBids, recommendedBid);
  }

  /**
   * Builds prompt with anonymized bid matrix for Gemini 1.5 Pro.
   */
  private static buildPrompt(
    csNumber: string,
    sku: string,
    productName: string,
    bids: AnonymizedBidSummary[],
    recommended: AnonymizedBidSummary
  ): string {
    const bidRows = bids
      .map(
        (b, i) =>
          `Bidder ${i + 1} (${b.vendorAlias}): Price: ${b.unitPrice} ${b.currency}, Lead Time: ${b.leadTimeDays} days, Payment Terms: "${b.paymentTerms || 'Standard'}", Total Score: ${b.totalScore}/100 (Price: ${b.priceScore}, Lead Time: ${b.leadScore}, Terms: ${b.termsScore}, Vendor Rating: ${b.vendorScore})`
      )
      .join('\n');

    return `
You are the Chief Procurement Advisory AI (Gemini Pillar 1) for Sun Bird Corporation, a Bangladesh-based medical equipment & diagnostic technology importer.

Review the following 100-Point Comparative Statement (CS) evaluation matrix:
Tender Reference: ${csNumber}
Product: ${productName} (SKU: ${sku})

COMPETITIVE BID EVALUATION MATRIX:
${bidRows}

Highest Scored Recommendation: ${recommended.vendorAlias} with ${recommended.totalScore}/100.

Provide a concise, professional executive procurement narrative (max 3-4 sentences):
1. Identify the recommended vendor and highlight their price variance and lead-time advantage.
2. Highlight any payment terms benefits (e.g. LC vs advance) or potential risk considerations.
3. Conclude with a clear, definitive recommendation for the Purchase Committee.
`;
  }

  /**
   * Generates a deterministic analytical summary when Gemini API key is absent.
   */
  private static buildDeterministicSummary(
    productName: string,
    sku: string,
    sortedBids: AnonymizedBidSummary[],
    topBid: AnonymizedBidSummary
  ): string {
    if (sortedBids.length === 1) {
      return `${topBid.vendorAlias} is the sole bidder for ${productName} (${sku}) at ${topBid.unitPrice} ${topBid.currency} with ${topBid.leadTimeDays} days lead time. Recommended for single-source procurement under ${topBid.paymentTerms || 'agreed terms'} (Composite Score: ${topBid.totalScore}/100).`;
    }

    const lowestPrice = Math.min(...sortedBids.map((b) => b.unitPrice));
    const highestPrice = Math.max(...sortedBids.map((b) => b.unitPrice));
    const shortestLead = Math.min(...sortedBids.map((b) => b.leadTimeDays));

    const priceSavingsPercent =
      highestPrice > lowestPrice
        ? (((highestPrice - topBid.unitPrice) / highestPrice) * 100).toFixed(1)
        : '0.0';

    const leadAdvantage =
      topBid.leadTimeDays === shortestLead
        ? 'with the shortest delivery lead time'
        : `with an acceptable ${topBid.leadTimeDays}-day delivery window`;

    const termsNotice = topBid.paymentTerms
      ? `under favorable ${topBid.paymentTerms} terms`
      : 'under standard commercial terms';

    return `${topBid.vendorAlias} achieved the highest composite score (${topBid.totalScore}/100) for ${productName} (${sku}), delivering a competitive unit price of ${topBid.unitPrice} ${topBid.currency} (${priceSavingsPercent}% below highest quote) ${leadAdvantage}. Given strong vendor reliability and commercial alignment ${termsNotice}, the AI Procurement Advisor recommends awarding the Purchase Order to ${topBid.vendorAlias}.`;
  }
}

export default GeminiAdvisor;
