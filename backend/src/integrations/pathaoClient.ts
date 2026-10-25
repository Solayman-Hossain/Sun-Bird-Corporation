import logger from '../config/logger';
import env from '../config/env';
import { GatewayError } from '../errors/AppError';

export interface PathaoTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

export interface PathaoPricePlanParams {
  store_id?: number | string;
  item_type?: number; // 1: Document, 2: Parcel
  delivery_type?: number; // 48: Standard Delivery, 12: On-demand
  item_weight: number; // in KG
  recipient_city: number | string;
  recipient_zone: number | string;
}

export interface PathaoPricePlanResult {
  price: number;
  plan_id?: number | string;
  rawResponse?: any;
}

export interface PathaoOrderPayload {
  store_id?: number | string;
  merchant_order_id: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city: number | string;
  recipient_zone: number | string;
  recipient_area?: number | string;
  delivery_type?: number; // 48: Standard (default)
  item_type?: number; // 2: Parcel (default), 1: Document
  special_instruction?: string;
  item_quantity?: number;
  item_weight: number; // in KG
  amount_to_collect: number; // Cash on delivery amount
  item_description?: string;
}

export interface PathaoOrderResult {
  consignmentId: string;
  trackingCode: string;
  orderStatus: string;
  deliveryFee: number;
  rawResponse?: any;
}

export type PathaoMockHandler = (
  endpoint: string,
  options: {
    method: string;
    headers: Record<string, string>;
    body?: string;
  }
) => Promise<{ status: number; data: any }>;

export interface PathaoClientConfig {
  baseUrl?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  storeId?: string;
  mockHandler?: PathaoMockHandler;
}

export class PathaoClient {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly username: string;
  private readonly password: string;
  private readonly storeId: string;

  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private mockHandler: PathaoMockHandler | null = null;

  constructor(config: PathaoClientConfig = {}) {
    this.baseUrl = (config.baseUrl || env.PATHAO_BASE_URL || 'https://courier-api-sandbox.pathao.com').replace(/\/+$/, '');
    this.clientId = config.clientId ?? env.PATHAO_CLIENT_ID;
    this.clientSecret = config.clientSecret ?? env.PATHAO_CLIENT_SECRET;
    this.username = config.username ?? env.PATHAO_USERNAME;
    this.password = config.password ?? env.PATHAO_PASSWORD;
    this.storeId = config.storeId ?? env.PATHAO_STORE_ID;
    this.mockHandler = config.mockHandler || null;
  }

  /**
   * Inject or remove a mock transport handler for testing.
   */
  public setMockHandler(handler: PathaoMockHandler | null): void {
    this.mockHandler = handler;
  }

  /**
   * Issues or returns a cached OAuth 2.0 access token for Pathao Merchant API.
   * Path: POST /aladdin/api/v1/issue-token
   */
  public async issueToken(forceRefresh: boolean = false): Promise<string> {
    const now = Date.now();
    if (!forceRefresh && this.cachedToken && this.tokenExpiresAt > now + 60000) {
      return this.cachedToken;
    }

    const endpoint = '/aladdin/api/v1/issue-token';
    const body = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      username: this.username,
      password: this.password,
      grant_type: 'password',
    };

    const response = await this.executeRequest<PathaoTokenResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      skipAuth: true,
    });

    if (!response || !response.access_token) {
      throw new GatewayError('Pathao', 'Failed to retrieve access token: invalid token response', response);
    }

    this.cachedToken = response.access_token;
    const expiresInSec = typeof response.expires_in === 'number' ? response.expires_in : 3600;
    this.tokenExpiresAt = now + expiresInSec * 1000;

    logger.info(`[PathaoClient] OAuth token issued successfully. Expires in ${expiresInSec}s`);
    return this.cachedToken;
  }

  /**
   * Calculates shipping fee based on weight, city, and zone.
   * Path: POST /aladdin/api/v1/merchant/price-plan
   */
  public async calculateShippingFee(params: PathaoPricePlanParams): Promise<PathaoPricePlanResult> {
    const endpoint = '/aladdin/api/v1/merchant/price-plan';
    const payload = {
      store_id: Number(params.store_id || this.storeId || 1),
      item_type: params.item_type ?? 2,
      delivery_type: params.delivery_type ?? 48,
      item_weight: params.item_weight,
      recipient_city: Number(params.recipient_city),
      recipient_zone: Number(params.recipient_zone),
    };

    const response = await this.executeRequest<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const price =
      response?.data?.price !== undefined
        ? Number(response.data.price)
        : response?.price !== undefined
        ? Number(response.price)
        : 0;

    return {
      price,
      plan_id: response?.data?.plan_id || response?.plan_id,
      rawResponse: response,
    };
  }

  /**
   * Creates a parcel delivery order and books consignment in Pathao.
   * Path: POST /aladdin/api/v1/orders
   */
  public async createOrder(payload: PathaoOrderPayload): Promise<PathaoOrderResult> {
    const endpoint = '/aladdin/api/v1/orders';
    const formattedPayload = {
      store_id: Number(payload.store_id || this.storeId || 1),
      merchant_order_id: payload.merchant_order_id,
      recipient_name: payload.recipient_name,
      recipient_phone: payload.recipient_phone,
      recipient_address: payload.recipient_address,
      recipient_city: Number(payload.recipient_city || 1),
      recipient_zone: Number(payload.recipient_zone || 1),
      recipient_area: payload.recipient_area ? Number(payload.recipient_area) : undefined,
      delivery_type: payload.delivery_type ?? 48,
      item_type: payload.item_type ?? 2,
      special_instruction: payload.special_instruction || '',
      item_quantity: payload.item_quantity ?? 1,
      item_weight: payload.item_weight,
      amount_to_collect: payload.amount_to_collect,
      item_description: payload.item_description || '',
    };

    const response = await this.executeRequest<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(formattedPayload),
    });

    const data = response?.data || response;
    const consignmentId = data?.consignment_id || data?.id || `PT-${Date.now()}`;
    const trackingCode = data?.tracking_code || data?.consignment_id || consignmentId;
    const deliveryFee = Number(data?.delivery_fee || data?.price || 0);
    const orderStatus = data?.order_status || 'Pending';

    logger.info(
      `[PathaoClient] Order created for merchantOrder=${payload.merchant_order_id}. ConsignmentId=${consignmentId}, Tracking=${trackingCode}`
    );

    return {
      consignmentId: String(consignmentId),
      trackingCode: String(trackingCode),
      orderStatus,
      deliveryFee,
      rawResponse: response,
    };
  }

  /**
   * Internal HTTP execution helper with authentication, timeouts, and error mappings.
   */
  private async executeRequest<T>(
    endpoint: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: string;
      headers?: Record<string, string>;
      skipAuth?: boolean;
    }
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    if (!options.skipAuth) {
      const token = await this.issueToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (this.mockHandler) {
      const res = await this.mockHandler(endpoint, {
        method: options.method,
        headers,
        body: options.body,
      });

      if (res.status >= 400) {
        throw new GatewayError('Pathao', `Mock carrier returned error HTTP ${res.status}`, res.data);
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
          'Pathao',
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
        throw new GatewayError('Pathao', 'API request timed out after 10000ms');
      }
      throw new GatewayError('Pathao', err.message || 'Unknown network error occurred', err);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const pathaoClient = new PathaoClient();
export default pathaoClient;
