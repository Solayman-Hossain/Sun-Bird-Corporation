import { GoogleGenAI } from '@google/genai';
import env from '../config/env';
import logger from '../config/logger';

export type MarketingAiTask =
  | 'BANNER_COPY'
  | 'BANNER_SUBTITLE'
  | 'CAMPAIGN_IDEAS'
  | 'PROMO_DESCRIPTION'
  | 'SOCIAL_CAPTION'
  | 'HASHTAGS'
  | 'SEO_METADATA'
  | 'LANDING_PAGE_COPY'
  | 'CMS_CONTENT'
  | 'REWRITE_CONTENT'
  | 'SUGGEST_CTA';

export interface MarketingAiInput {
  task: MarketingAiTask;
  productName?: string;
  categoryName?: string;
  brandName?: string;
  targetAudience?: string;
  discountPercentage?: number;
  existingText?: string;
  tone?: 'PROFESSIONAL' | 'FESTIVE' | 'URGENT_DISCOUNT' | 'CLINICAL' | 'CORPORATE' | 'FRIENDLY';
  language?: 'bn' | 'en';
}

export interface MarketingAiOutput {
  title?: string;
  subtitle?: string;
  body?: string;
  ctaText?: string;
  hashtags?: string[];
  seoTitle?: string;
  metaDescription?: string;
  suggestions: string[];
  generatedBy: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK';
}

export class MarketingAiService {
  /**
   * Generates AI-assisted marketing copy, campaign concepts, social posts,
   * SEO tags, and content optimization using Google Gemini 1.5 Pro.
   */
  public static async generateMarketingSuggestions(input: MarketingAiInput): Promise<MarketingAiOutput> {
    const {
      task,
      productName = 'মেডিকেল ইকুইপমেন্ট',
      categoryName = 'আইসিইউ ও হসপিটাল কেয়ার',
      brandName = 'Sun Bird Corporation',
      tone = 'PROFESSIONAL',
      language = 'bn',
      discountPercentage,
      existingText,
    } = input;

    // Attempt Gemini call if API key is provided
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
      try {
        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const prompt = this.buildPrompt({
          task,
          productName,
          categoryName,
          brandName,
          tone,
          language,
          discountPercentage,
          existingText,
        });

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-pro',
          contents: prompt,
        });

        const text = response.text || '';
        const lines = text
          .split('\n')
          .map((l) => l.replace(/^[-*•0-9.)\s]+/, '').trim())
          .filter((l) => l.length > 5);

        if (lines.length > 0) {
          return {
            title: lines[0] || '',
            subtitle: lines[1] || '',
            ctaText: language === 'bn' ? 'অর্ডার করুন' : 'Order Now',
            suggestions: lines.slice(0, 5),
            generatedBy: 'GEMINI_AI',
          };
        }
      } catch (err: any) {
        logger.warn(`[MarketingAiService] Gemini API call failed, using deterministic templates: ${err.message}`);
      }
    }

    // Deterministic fallback covering all tasks
    return this.getFallbackOutput(input);
  }

  private static buildPrompt(params: any): string {
    return `You are a medical & healthcare marketing strategist and copywriter for Sun Bird Corporation (an authorized importer and supplier of DGDA-approved medical, ICU, surgical, and diagnostic equipment in Bangladesh).

Context:
- Company: Sun Bird Corporation (সান বার্ড কর্পোরেশন)
- Product: ${params.productName}
- Category: ${params.categoryName}
- Brand: ${params.brandName}
- Tone: ${params.tone}
- Language: ${params.language === 'bn' ? 'Bengali (বাংলা)' : 'English'}
${params.discountPercentage ? `- Offer: ${params.discountPercentage}% Discount` : ''}
${params.existingText ? `- Existing Text to Rewrite: "${params.existingText}"` : ''}

Task: ${params.task}
Requirements:
1. Output 3 to 5 compelling, persuasive, and strictly compliant medical equipment marketing suggestions.
2. Emphasize DGDA approval, 1-3 years official warranty, NBR Mushak-6.3 VAT invoices, and 24/7 biomedical engineering support.
3. Keep the output clean, without preamble. Output bullet points.`;
  }

  private static getFallbackOutput(input: MarketingAiInput): MarketingAiOutput {
    const p = input.productName || 'মেডিকেল ইকুইপমেন্ট';
    const lang = input.language || 'bn';

    if (lang === 'bn') {
      switch (input.task) {
        case 'BANNER_COPY':
          return {
            title: `সর্বাধুনিক ${p} — আন্তর্জাতিক মান ও ডিজিডিএ অনুমোদিত নিশ্চয়তা`,
            subtitle: `সান বার্ড কর্পোরেশন দিচ্ছে ১-৩ বছরের অফিসিয়াল ওয়ারেন্টি ও ২৪/৭ বায়োমেডিকেল সাপোর্ট।`,
            ctaText: 'দাম জানুন ও অর্ডার করুন',
            suggestions: [
              `সর্বাধুনিক ${p} — আন্তর্জাতিক মান ও ডিজিডিএ অনুমোদিত নিশ্চয়তা`,
              `রোগীর সর্বোচ্চ সুরক্ষায় নির্ভরযোগ্য ${p} — তেজগাঁও সেন্ট্রাল ডিপো থেকে দ্রুত ডেলিভারি`,
              `বিশেষ অফার! সান বার্ড কর্পোরেশনের জেনুইন ${p} সংগ্রহ করুন আকর্ষণীয় মূল্যে ও সহজ কিস্তিতে`,
            ],
            generatedBy: 'DETERMINISTIC_FALLBACK',
          };

        case 'CAMPAIGN_IDEAS':
          return {
            title: `মেডিকেল ইকুইপমেন্ট এক্সক্লুসিভ হাসপাতাল উৎসব ২০২৬`,
            subtitle: `আইসিইউ, ওটি ও ডায়াগনস্টিক পণ্যে আকর্ষণীয় প্যাকেজ ছাড়।`,
            suggestions: [
              `আইসিইউ ও হসপিটাল আধুনিকায়ন প্যাকেজ — ১০% থেকে ১৫% করপোরেট ছাড়`,
              `ডায়াগনস্টিক ও ক্লিনিক সেটআপ স্পেশাল অফার — ইনস্টলেশন ও ইঞ্জিনিয়ারিং সাপোর্ট ফ্রি`,
              `জরুরি রেসপিরেটরি ও অক্সিজেন ইকুইপমেন্ট ড্রাইভ — হাসপাতাল ও হোম কেয়ার সলিউশন`,
            ],
            generatedBy: 'DETERMINISTIC_FALLBACK',
          };

        case 'SOCIAL_CAPTION':
          return {
            title: `${p} নিউ অ্যারাইভাল`,
            body: `হাসপাতাল ও ক্লিনিকের জন্য মানসম্মত ${p} নিশ্চিত করুন। সান বার্ড কর্পোরেশন দিচ্ছে আন্তর্জাতিক মানের নিশ্চয়তা, ডিজিডিএ অনুমোদন এবং সার্বক্ষণিক বায়োমেডিকেল ইঞ্জিনিয়ার ব্যাকআপ। এনবিআর মূসক-৬.৩ চালানসহ সমগ্র বাংলাদেশে ডেলিভারি। আজই ইনবক্স করুন বা কল করুন!`,
            hashtags: ['#SunBirdCorporation', '#MedicalEquipment', '#ICUCare', '#HealthcareBangladesh', '#DGDAApproved'],
            suggestions: [
              `হাসপাতাল ও ক্লিনিকের জন্য মানসম্মত ${p} নিশ্চিত করুন। সান বার্ড কর্পোরেশন দিচ্ছে আন্তর্জাতিক মানের নিশ্চয়তা ও সার্বক্ষণিক বায়োমেডিকেল ব্যাকআপ।`,
              `নির্ভরযোগ্য চিকিৎসায় সেরা ডায়াগনস্টিক সমাধান — আমাদের প্রিমিয়াম ${p}। ৬৪ জেলায় দ্রুততম ডেলিভারি।`,
              `আইসিইউ ও অপারেশন থিয়েটারের আধুনিক ইকুইপমেন্ট কালেকশন। আজই অফিসিয়াল কোটেশন পেতে যোগাযোগ করুন।`,
            ],
            generatedBy: 'DETERMINISTIC_FALLBACK',
          };

        case 'SEO_METADATA':
          return {
            seoTitle: `কিনুন জেনুইন ${p} বাংলাদেশে সেরা মূল্যে | সান বার্ড কর্পোরেশন`,
            metaDescription: `সান বার্ড কর্পোরেশন থেকে কিনুন ডিজিডিএ অনুমোদিত জেনুইন ${p}। ১-৩ বছরের অফিশিয়াল ওয়ারেন্টি, মূসক-৬.৩ চালান ও সার্বক্ষণিক বায়োমেডিকেল সার্ভিস।`,
            suggestions: [
              `কিনুন জেনুইন ${p} বাংলাদেশে সেরা মূল্যে | সান বার্ড কর্পোরেশন`,
              `${p} এর দাম, ফিচার ও স্পেসিফিকেশন — সান বার্ড কর্পোরেশন`,
              `বাংলাদেশে সেরা মেডিকেল ইকুইপমেন্ট ও ${p} সরবরাহকারী প্রতিষ্ঠান`,
            ],
            generatedBy: 'DETERMINISTIC_FALLBACK',
          };

        case 'LANDING_PAGE_COPY':
          return {
            title: `সম্পূর্ণ আইসিইউ ও হসপিটাল ইকুইপমেন্ট সলিউশন`,
            subtitle: `উচ্চমানের আন্তর্জাতিক ডিভাইস, যা রোগীর সুরক্ষায় শতভাগ নির্ভরযোগ্য।`,
            body: `সান বার্ড কর্পোরেশন দেশের শীর্ষস্থানীয় সরকারি ও বেসরকারি হাসপাতাল, ক্লিনিক এবং ডায়াগনস্টিক সেন্টারে সফলতার সাথে আধুনিক মেডিকেল যন্ত্রপাতি সরবরাহ করে আসছে। আমাদের প্রতিটি পণ্য ডিজিডিএ (DGDA) নিবন্ধিত।`,
            suggestions: [
              `সম্পূর্ণ আইসিইউ ও হসপিটাল ইকুইপমেন্ট সলিউশন`,
              `নির্ভুল ডায়াগনস্টিক ও লাইফ সাপোর্ট ইকুইপমেন্ট পার্টনার`,
              `২৪/৭ বায়োমেডিকেল ইঞ্জিনিয়ার সেবা ও জেনুইন স্পেয়ার পার্টস`,
            ],
            generatedBy: 'DETERMINISTIC_FALLBACK',
          };

        case 'CMS_CONTENT':
        case 'REWRITE_CONTENT':
          return {
            title: `আমাদের সম্পর্কে — সান বার্ড কর্পোরেশন`,
            body: `সান বার্ড কর্পোরেশন বাংলাদেশে আন্তর্জাতিক মানের মেডিকেল, আইসিইউ, সার্জিক্যাল ও ডায়াগনস্টিক ইকুইপমেন্টের শীর্ষস্থানীয় আমদানিকারক ও পরিবেশক। অভিজ্ঞ বায়োমেডিকেল ইঞ্জিনিয়ার টিমের মাধ্যমে আমরা বিক্রয়োত্তর সেবা ও ওয়ারেন্টি সেবা প্রদান করে থাকি।`,
            suggestions: [
              `সান বার্ড কর্পোরেশন — বাংলাদেশে নির্ভরযোগ্য মেডিকেল ও হসপিটাল ইকুইপমেন্ট পার্টনার।`,
              `আন্তর্জাতিক মানসম্পন্ন যন্ত্রপাতি ও সার্বক্ষণিক টেকনিক্যাল সাপোর্ট।`,
              `রোগীর জীবন রক্ষায় আধুনিক প্রযুক্তির সর্বোত্তম সমন্বয়।`,
            ],
            generatedBy: 'DETERMINISTIC_FALLBACK',
          };

        case 'SUGGEST_CTA':
        default:
          return {
            ctaText: 'অর্ডার করুন ও দাম জানুন',
            suggestions: ['অর্ডার করুন', 'বিস্তারিত দেখুন', 'কোটেশন রিকোয়েস্ট', 'দাম জানুন ও কিনুন', 'আমাদের সাথে কথা বলুন'],
            generatedBy: 'DETERMINISTIC_FALLBACK',
          };
      }
    } else {
      return {
        title: `Premium Medical Grade ${p} — DGDA Approved in Bangladesh`,
        subtitle: `Backed by 1–3 years official warranty and 24/7 biomedical engineering support.`,
        ctaText: 'Request Quotation',
        suggestions: [
          `Premium Medical Grade ${p} — DGDA Approved in Bangladesh`,
          `Equip Your Hospital with Authentic ${p} from Sun Bird Corporation`,
          `High-Precision Diagnostics & Critical Care Solutions`,
        ],
        generatedBy: 'DETERMINISTIC_FALLBACK',
      };
    }
  }
}

export default MarketingAiService;
