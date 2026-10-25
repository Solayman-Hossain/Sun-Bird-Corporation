import http from 'http';
import https from 'https';
import logger from '../config/logger';

export interface SmsSendOptions {
  mobile: string;
  message: string;
}

export interface SmsDispatchResult {
  success: boolean;
  provider: 'BulkSMSBD' | 'Greenweb' | 'MOCK';
  messageId?: string;
  rawResponse?: string;
}

/**
 * Normalizes Bangladeshi mobile numbers into international format (8801XXXXXXXXX)
 * and local 11-digit format (01XXXXXXXXX).
 */
export function normalizeMobileNumber(raw: string): { international: string; local: string } {
  let cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+88')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '88' + cleaned;
  } else if (!cleaned.startsWith('88') && cleaned.length === 11) {
    cleaned = '88' + cleaned;
  }

  const local = cleaned.startsWith('88') ? cleaned.substring(2) : cleaned;
  return {
    international: cleaned,
    local,
  };
}

/**
 * HTTP helper for dispatching GET/POST queries to SMS gateway endpoints.
 */
function sendHttpRequest(urlStr: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.get(urlStr, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('SMS gateway request timed out after 8000ms'));
    });
  });
}

/**
 * Resilient Multi-Provider SMS Gateway for Bangladesh.
 * Primary: BulkSMSBD API
 * Secondary Fallback: Greenweb API
 * Development: Mock simulation logger
 */
export class SmsGateway {
  private static bulksmsbdApiKey = process.env.BULKSMSBD_API_KEY || '';
  private static bulksmsbdSenderId = process.env.BULKSMSBD_SENDER_ID || 'SunBird';
  private static greenwebToken = process.env.GREENWEB_TOKEN || '';

  /**
   * Primary Provider: Dispatches SMS via BulkSMSBD API.
   */
  private static async sendViaBulkSMSBD(mobile: string, message: string): Promise<SmsDispatchResult> {
    if (!this.bulksmsbdApiKey) {
      throw new Error('BulkSMSBD API key is not configured');
    }

    const { international } = normalizeMobileNumber(mobile);
    const encodedMessage = encodeURIComponent(message);
    const url = `http://bulksmsbd.net/api/smsapi?api_key=${this.bulksmsbdApiKey}&type=text&number=${international}&senderid=${this.bulksmsbdSenderId}&message=${encodedMessage}`;

    const response = await sendHttpRequest(url);

    // BulkSMSBD standard success contains response_code: 202 or success message
    if (response.includes('202') || response.toLowerCase().includes('success') || response.includes('response_code')) {
      logger.info(`SMS successfully dispatched via BulkSMSBD to ${mobile}`);
      return {
        success: true,
        provider: 'BulkSMSBD',
        rawResponse: response,
      };
    }

    throw new Error(`BulkSMSBD rejected dispatch: ${response}`);
  }

  /**
   * Fallback Provider: Dispatches SMS via Greenweb API.
   */
  private static async sendViaGreenweb(mobile: string, message: string): Promise<SmsDispatchResult> {
    if (!this.greenwebToken) {
      throw new Error('Greenweb API token is not configured');
    }

    const { international } = normalizeMobileNumber(mobile);
    const encodedMessage = encodeURIComponent(message);
    const url = `http://api.greenweb.com.bd/api.php?token=${this.greenwebToken}&to=${international}&message=${encodedMessage}`;

    const response = await sendHttpRequest(url);

    if (response.toLowerCase().includes('ok') || response.includes('100') || !response.toLowerCase().includes('error')) {
      logger.info(`SMS successfully dispatched via Greenweb fallback to ${mobile}`);
      return {
        success: true,
        provider: 'Greenweb',
        rawResponse: response,
      };
    }

    throw new Error(`Greenweb rejected dispatch: ${response}`);
  }

  /**
   * Main Dispatch Method: Sends SMS with automatic failover fallback.
   *
   * @param options Mobile number and message text
   * @returns Dispatch result metadata
   */
  public static async sendSms(options: SmsSendOptions): Promise<SmsDispatchResult> {
    const { mobile, message } = options;

    // In local development or testing without live gateway credentials, use Mock dispatch
    const isMock =
      process.env.NODE_ENV === 'test' ||
      (!this.bulksmsbdApiKey && !this.greenwebToken) ||
      process.env.SMS_MOCK === 'true';

    if (isMock) {
      logger.info(`[SMS MOCK DISPATCH] To: ${mobile} | Message: "${message}"`);
      return {
        success: true,
        provider: 'MOCK',
        messageId: 'mock-sms-' + Date.now(),
      };
    }

    // 1. Try Primary Gateway: BulkSMSBD
    try {
      return await this.sendViaBulkSMSBD(mobile, message);
    } catch (primaryError: unknown) {
      const errMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
      logger.warn(`Primary SMS provider (BulkSMSBD) failed: ${errMessage}. Attempting fallback to Greenweb...`);

      // 2. Fallback to Secondary Gateway: Greenweb
      try {
        return await this.sendViaGreenweb(mobile, message);
      } catch (fallbackError: unknown) {
        const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        logger.error(`Both SMS providers failed to dispatch SMS to ${mobile}`, {
          primaryError: errMessage,
          fallbackError: fallbackMsg,
        });
        throw new Error(`All SMS gateways failed: ${errMessage} | ${fallbackMsg}`);
      }
    }
  }
}

export default SmsGateway;
