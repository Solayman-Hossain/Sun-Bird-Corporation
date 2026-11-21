import { Types } from 'mongoose';
import {
  CentralAiService,
  AiRequestContext,
  AiTextResponse,
  AiStructuredResponse,
  AiQueryAnswer,
} from './CentralAiService';
import { AiSecurityService } from './AiSecurityService';
import { AiToolRegistry } from './AiToolRegistry';
import logger from '../config/logger';

/**
 * Provider-agnostic AI Service for SUN BIRD ERP.
 * Standardizes AI text generation, structured extraction, and tool-assisted business querying.
 */
export class AiService {
  /**
   * Extract structured JSON data matching a JSON Schema from a document, image, or text string.
   * Enforces redaction, token auditing, and human-in-the-loop validation markers.
   */
  public async extractStructured<T = any>(
    fileOrText: string | Buffer,
    jsonSchema: any,
    context?: Partial<AiRequestContext>
  ): Promise<AiStructuredResponse<T>> {
    const fullContext: AiRequestContext = {
      organizationId: context?.organizationId || '600000000000000000000001',
      userId: context?.userId,
      userRole: context?.userRole || 'staff',
      module: context?.module || 'GLOBAL',
      featureCode: context?.featureCode || 'EXTRACT_STRUCTURED',
      language: context?.language || 'auto',
      allowedTools: context?.allowedTools || [],
    };

    const textContent = typeof fileOrText === 'string' ? fileOrText : fileOrText.toString('utf-8');
    return CentralAiService.extractStructured<T>(textContent, jsonSchema, fullContext);
  }

  /**
   * Generate text response given a prompt and context.
   * Automatically scrubs sensitive PII (salaries, card numbers, passwords) prior to invoking provider.
   */
  public async generateText(
    prompt: string,
    context?: Partial<AiRequestContext> | Record<string, any>
  ): Promise<AiTextResponse> {
    const fullContext: AiRequestContext = {
      organizationId: (context as any)?.organizationId || '600000000000000000000001',
      userId: (context as any)?.userId,
      userRole: (context as any)?.userRole || 'staff',
      module: (context as any)?.module || 'GLOBAL',
      featureCode: (context as any)?.featureCode || 'GENERATE_TEXT',
      language: (context as any)?.language || 'auto',
      allowedTools: (context as any)?.allowedTools || [],
    };

    return CentralAiService.generateText(prompt, fullContext);
  }

  /**
   * Answer natural language business query using safe, read-only allowed tools.
   * Tools are executed within organization isolation boundaries.
   */
  public async answerQuery(
    question: string,
    allowedTools?: string[] | Partial<AiRequestContext>,
    context?: Partial<AiRequestContext>
  ): Promise<AiQueryAnswer> {
    let resolvedTools: string[] = [];
    let fullContext: AiRequestContext;

    if (Array.isArray(allowedTools)) {
      resolvedTools = allowedTools;
      fullContext = {
        organizationId: context?.organizationId || '600000000000000000000001',
        userId: context?.userId,
        userRole: context?.userRole || 'staff',
        module: context?.module || 'GLOBAL',
        featureCode: context?.featureCode || 'ANSWER_QUERY',
        language: context?.language || 'auto',
        allowedTools: resolvedTools,
      };
    } else {
      const merged = { ...allowedTools, ...context };
      resolvedTools = merged?.allowedTools || [];
      fullContext = {
        organizationId: merged?.organizationId || '600000000000000000000001',
        userId: merged?.userId,
        userRole: merged?.userRole || 'staff',
        module: merged?.module || 'GLOBAL',
        featureCode: merged?.featureCode || 'ANSWER_QUERY',
        language: merged?.language || 'auto',
        allowedTools: resolvedTools,
      };
    }

    return CentralAiService.answerQuery(question, fullContext);
  }

  /**
   * Returns list of allowed read-only tools for business queries.
   */
  public getAvailableTools(): string[] {
    return [
      'getSalesSummary',
      'getInventoryFefoStatus',
      'getFinancialSnapshot',
      'getPendingApprovals',
      'getImportLcStatus',
      'getTopSellingProducts',
    ];
  }
}

export const aiService = new AiService();
export default aiService;
