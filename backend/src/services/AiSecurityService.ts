/**
 * AiSecurityService - Redaction of sensitive fields and prompt injection mitigation
 */
export class AiSecurityService {
  private static SENSITIVE_PATTERNS = [
    // Bank accounts, IBANs, Credit Cards
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, // Card numbers
    /\b(A\/C|Account\s*(?:No|Number)?|Bank\s*Acc)[\s:]*([0-9]{8,18})\b/gi,
    // Passwords, Secrets, API Keys
    /\b(?:password|passwd|secret|apikey|api_key|token)[\s:=]+([^\s,;]+)/gi,
    // National ID (NID), SSN
    /\b(?:NID|National\s*ID)[\s:=]*([0-9]{10,17})\b/gi,
  ];

  /**
   * Redacts sensitive financial / personal data unless user is admin and explicit bypass is given
   */
  public static redactSensitiveData(text: string, isAdmin: boolean = false): { redactedText: string; isRedacted: boolean } {
    if (!text || typeof text !== 'string') {
      return { redactedText: '', isRedacted: false };
    }

    let modified = text;
    let didRedact = false;

    // 1. Regex redaction for account numbers and secrets
    for (const pattern of this.SENSITIVE_PATTERNS) {
      if (pattern.test(modified)) {
        didRedact = true;
        modified = modified.replace(pattern, (match, p1, p2) => {
          if (p2) return `${p1}: [REDACTED_CONFIDENTIAL]`;
          return '[REDACTED_CONFIDENTIAL]';
        });
      }
    }

    // 2. Redact employee base salaries if present in raw string
    if (!isAdmin) {
      const salaryPattern = /\b(?:basicSalary|baseSalary|grossSalary|salary)[\s:=]*([0-9]+(?:\.[0-9]+)?)\b/gi;
      if (salaryPattern.test(modified)) {
        didRedact = true;
        modified = modified.replace(salaryPattern, 'salary: [REDACTED_RESTRICTED_CONFIDENTIAL]');
      }
    }

    return { redactedText: modified, isRedacted: didRedact };
  }

  /**
   * Sanitizes user input against prompt injection attempts
   */
  public static sanitizePromptInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    // Strip out attempts to override system role or delimiters
    let sanitized = input
      .replace(/<\|im_start\|>/gi, '')
      .replace(/<\|im_end\|>/gi, '')
      .replace(/\[SYSTEM_PROMPT_OVERRIDE\]/gi, '')
      .replace(/IGNORE\s+ALL\s+PREVIOUS\s+INSTRUCTIONS/gi, '[INSTRUCTION_FILTERED]');

    return sanitized.trim();
  }

  /**
   * Masks secrets like API keys
   */
  public static maskApiKey(apiKey: string): string {
    if (!apiKey) return '';
    if (apiKey.length <= 8) return '********';
    return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
  }
}
