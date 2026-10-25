import { Types } from 'mongoose';
import { UomConversionModel, IUomConversion } from '../models/UomConversion';
import { ProductModel } from '../models/Product';
import { get, set, del } from '../config/redis';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

const UOM_CACHE_TTL_SECONDS = 86400; // 24 hours

export class UomService {
  /**
   * Generates Redis cache key for conversion factor.
   */
  private static getCacheKey(
    productId: string | Types.ObjectId,
    fromUom: string,
    toUom: string
  ): string {
    return `uom:${productId.toString()}:${fromUom.trim().toLowerCase()}:${toUom.trim().toLowerCase()}`;
  }

  /**
   * Resolves the numeric multiplier to convert 1 unit of `fromUom` into `toUom`.
   * Leverages Redis caching, direct rules, inverse rules, and multi-hop graph resolution.
   *
   * @param productId Product ObjectId or string ID
   * @param fromUom Source Unit of Measure (e.g. "Carton")
   * @param toUom Target Unit of Measure (e.g. "Piece")
   * @returns Conversion multiplier (e.g. 200)
   */
  public static async getConversionFactor(
    productId: string | Types.ObjectId,
    fromUom: string,
    toUom: string
  ): Promise<number> {
    const from = fromUom.trim().toLowerCase();
    const to = toUom.trim().toLowerCase();

    // 1. Identity conversion
    if (from === to) {
      return 1;
    }

    const pId = productId.toString();
    const cacheKey = this.getCacheKey(pId, from, to);

    // 2. Check Redis cache
    try {
      const cached = await get<number>(cacheKey);
      if (typeof cached === 'number' && cached > 0) {
        return cached;
      }
    } catch (err) {
      logger.warn(`Redis error fetching UOM cache for ${cacheKey}:`, err);
    }

    // 3. Query all active conversions for this product
    const rules = await UomConversionModel.find({
      productId: new Types.ObjectId(pId),
      isActive: true,
    }).lean();

    if (!rules || rules.length === 0) {
      throw new ValidationError(
        `UOM conversion factor not defined for this SKU: no conversion rules exist for product '${pId}'`
      );
    }

    // 4. Check for direct rule
    const directRule = rules.find(
      (r) =>
        r.fromUom.toLowerCase() === from && r.toUom.toLowerCase() === to
    );
    if (directRule) {
      const factor = directRule.conversionFactor;
      await this.cacheFactor(cacheKey, factor);
      return factor;
    }

    // 5. Check for inverse rule
    const inverseRule = rules.find(
      (r) =>
        r.fromUom.toLowerCase() === to && r.toUom.toLowerCase() === from
    );
    if (inverseRule && inverseRule.conversionFactor > 0) {
      const factor = 1 / inverseRule.conversionFactor;
      await this.cacheFactor(cacheKey, factor);
      return factor;
    }

    // 6. Multi-hop conversion via BFS graph traversal (e.g. Carton -> Box (20) & Box -> Piece (10))
    const factor = this.findMultiHopConversion(rules, from, to);
    if (factor !== null) {
      await this.cacheFactor(cacheKey, factor);
      return factor;
    }

    throw new ValidationError(
      `UOM conversion factor not defined for this SKU: cannot convert '${fromUom}' to '${toUom}'`
    );
  }

  /**
   * Converts a given quantity from `fromUom` into the product's defined `baseUom`.
   */
  public static async convertToBaseUom(
    productId: string | Types.ObjectId,
    fromUom: string,
    quantity: number
  ): Promise<number> {
    const product = await ProductModel.findById(productId).select('baseUom sku').lean();
    if (!product) {
      throw new NotFoundError('Product', productId.toString());
    }

    const factor = await this.getConversionFactor(productId, fromUom, product.baseUom);
    return Math.round(quantity * factor * 10000) / 10000;
  }

  /**
   * Converts a quantity in `baseUom` to the target `toUom`.
   */
  public static async convertFromBaseUom(
    productId: string | Types.ObjectId,
    toUom: string,
    baseQty: number
  ): Promise<number> {
    const product = await ProductModel.findById(productId).select('baseUom sku').lean();
    if (!product) {
      throw new NotFoundError('Product', productId.toString());
    }

    const factor = await this.getConversionFactor(productId, product.baseUom, toUom);
    return Math.round(baseQty * factor * 10000) / 10000;
  }

  /**
   * Clears cached conversion factors for a product when rules are modified.
   */
  public static async invalidateUomCache(
    productId: string | Types.ObjectId
  ): Promise<void> {
    const pId = productId.toString();
    try {
      // Find rules to clear specific keys
      const rules = await UomConversionModel.find({
        productId: new Types.ObjectId(pId),
      }).lean();

      const keysToDel: string[] = [];
      for (const r of rules) {
        keysToDel.push(this.getCacheKey(pId, r.fromUom, r.toUom));
        keysToDel.push(this.getCacheKey(pId, r.toUom, r.fromUom));
      }
      if (keysToDel.length > 0) {
        await del(keysToDel);
      }
    } catch (err) {
      logger.warn(`Failed to invalidate UOM cache for product ${pId}:`, err);
    }
  }

  /**
   * Helper to write factor to Redis cache.
   */
  private static async cacheFactor(key: string, factor: number): Promise<void> {
    try {
      await set(key, factor, UOM_CACHE_TTL_SECONDS);
    } catch (err) {
      logger.warn(`Failed to set Redis UOM cache key ${key}:`, err);
    }
  }

  /**
   * Multi-hop path search using Breadth-First Search (BFS).
   */
  private static findMultiHopConversion(
    rules: Array<{ fromUom: string; toUom: string; conversionFactor: number }>,
    from: string,
    to: string
  ): number | null {
    // Build adjacency list
    const adj = new Map<string, Array<{ neighbor: string; factor: number }>>();

    const addEdge = (u: string, v: string, weight: number) => {
      if (!adj.has(u)) adj.set(u, []);
      adj.get(u)!.push({ neighbor: v, factor: weight });
    };

    for (const r of rules) {
      const u = r.fromUom.toLowerCase();
      const v = r.toUom.toLowerCase();
      addEdge(u, v, r.conversionFactor);
      if (r.conversionFactor > 0) {
        addEdge(v, u, 1 / r.conversionFactor);
      }
    }

    // BFS queue: [currentUom, accumulatedMultiplier]
    const queue: Array<{ uom: string; mult: number }> = [{ uom: from, mult: 1 }];
    const visited = new Set<string>([from]);

    while (queue.length > 0) {
      const { uom, mult } = queue.shift()!;

      if (uom === to) {
        return mult;
      }

      const neighbors = adj.get(uom) || [];
      for (const edge of neighbors) {
        if (!visited.has(edge.neighbor)) {
          visited.add(edge.neighbor);
          queue.push({
            uom: edge.neighbor,
            mult: mult * edge.factor,
          });
        }
      }
    }

    return null;
  }
}

export default UomService;
