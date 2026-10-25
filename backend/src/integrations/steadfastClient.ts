import logger from '../config/logger';
import env from '../config/env';
import { GatewayError } from '../errors/AppError';

export interface SteadfastOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

export interface SteadfastOrderResult {
  consignmentId: string;
  trackingCode: string;
  status: string;
  deliveryFee: number;
  rawResponse?: any;
}

export interface SteadfastTrackResult {
  status: number;
  deliveryStatus: string;
  rawResponse?: any;
}

export type SteadfastMockHandler = (
  endpoint: string,
  options: {
    method: string;
    headers: Record<string, string>;
    body?: string;
  }
) => Promise<{ status: number; data: any }>;

export interface SteadfastClientConfig {
  baseUrl?: string;
  apiKey?: string;
  secretKey?: string;
  mockHandler?: SteadfastMockHandler;
}

export class SteadfastClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly secretKey: string;
  private mockHandler: SteadfastMockHandler | null = null;

  constructor(config: SteadfastClientConfig = {}) {
    this.baseUrl = (config.baseUrl || env.STEADFAST_BASE_URL || 'https://portal.steadfast.com.bd/api/v1').replace(/\/+$/, '');
    this.apiKey = config.apiKey ?? env.STEADFAST_API_KEY;
    this.secretKey = config.secretKey ?? env.STEADFAST_SECRET_KEY;
    this.mockHandler = config.mockHandler || null;
  }

  /**
   * Inject or remove a mock transport handler for testing.
   */
  public setMockHandler(handler: SteadfastMockHandler | null): void {
    this.mockHandler = handler;
  }

  /**
   * Creates a delivery consignment order in Steadfast Courier.
   * Path: POST /create_order
   */
  public async createOrder(payload: SteadfastOrderPayload): Promise<SteadfastOrderResult> {
    const endpoint = '/create_order';
    const body = {
      invoice: payload.invoice,
      recipient_name: payload.recipient_name,
      recipient_phone: payload.recipient_phone,
      recipient_address: payload.recipient_address,
      cod_amount: payload.cod_amount,
      note: payload.note || '',
    };

    const response = await this.executeRequest<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const consignment = response?.consignment || response?.data || response;
    const consignmentId = consignment?.consignment_id || consignment?.id || `ST-${Date.now()}`;
    const trackingCode = consignment?.tracking_code || `ST-TRK-${consignmentId}`;
    const status = consignment?.status || response?.delivery_status || 'in_review';
    const deliveryFee = Number(consignment?.delivery_fee || response?.delivery_fee || 0);

    logger.info(
      `[SteadfastClient] Order created for invoice=${payload.invoice}. ConsignmentId=${consignmentId}, Tracking=${trackingCode}`
    );

    return {
      consignmentId: String(consignmentId),
      trackingCode: String(trackingCode),
      status,
      deliveryFee,
      rawResponse: response,
    };
  }

  /**
   * Fetches real-time status for a Steadfast consignment.
   * Path: GET /status_by_trackingcode/:code or GET /status_by_cid/:id
   */
  public async trackStatus(trackingCodeOrConsignmentId: string): Promise<SteadfastTrackResult> {
    const isNumeric = /^\d+$/.test(trackingCodeOrConsignmentId.trim());
    const endpoint = isNumeric
      ? `/status_by_cid/${encodeURIComponent(trackingCodeOrConsignmentId.trim())}`
      : `/status_by_trackingcode/${encodeURIComponent(trackingCodeOrConsignmentId.trim())}`;

    const response = await this.executeRequest<any>(endpoint, {
      method: 'GET',
    });

    const deliveryStatus = response?.delivery_status || response?.status || 'unknown';
    const status = typeof response?.status === 'number' ? response.status : 200;

    return {
      status,
      deliveryStatus,
      rawResponse: response,
    };
  }

  /**
   * Internal HTTP execution helper with API key headers and error mappings.
   */
  private async executeRequest<T>(
    endpoint: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: string;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Api-Key': this.apiKey,
      'Secret-Key': this.secretKey,
      ...(options.headers || {}),
    };

    if (this.mockHandler) {
      const res = await this.mockHandler(endpoint, {
        method: options.method,
        headers,
        body: options.body,
      });

      if (res.status >= 400) {
        throw new GatewayError('Steadfast', `Mock carrier returned error HTTP ${res.status}`, res.data);
      }
      return res.data as T;
    }

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body,
        signal: controller.signal,
      });

      const responseText = await response.text();
      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        parsedData = { raw: responseText };
      }

      if (!response.ok) {
        throw new GatewayError(
          'Steadfast',
          `HTTP ${response.status} ${response.statusText}: ${parsedData?.message || responseText}`,
          parsedData
        );
      }

      return parsedData as T;
    } catch (err: any) {
      if (err instanceof GatewayError) {
        throw err;
      }
      if (err.name === 'AbortError') {
        throw new GatewayError('Steadfast', 'API request timed out after 10000ms');
      }
      throw new GatewayError('Steadfast', err.message || 'Unknown network error occurred', err);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const steadfastClient = new SteadfastClient();
export default steadfastClient;
