import { ValidationError } from '../errors/AppError';
import { AmountInWordsService } from './AmountInWordsService';

export interface CalculationLineItem {
  quantity: number;
  unitPrice: number;
  discount?: number; // Fixed amount or percent if isPercent is true
  isDiscountPercent?: boolean;
  taxRate?: number; // Percent (e.g. 15 for 15%)
  [key: string]: any;
}

export interface CalculationResultLine {
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  netLineTotal: number;
  [key: string]: any;
}

export interface DocumentCalculationResult {
  lines: CalculationResultLine[];
  subtotal: number;
  totalDiscount: number;
  taxableSubtotal: number;
  totalTax: number;
  shippingCharge: number;
  otherCharges: number;
  grandTotal: number;
  amountInWordsEn: string;
  amountInWordsBn: string;
}

export class DocumentCalculationService {
  /**
   * Recalculates all line items and document headers with precision
   */
  public static calculateDocument(params: {
    items: CalculationLineItem[];
    documentDiscount?: number;
    shippingCharge?: number;
    otherCharges?: number;
    currency?: string;
  }): DocumentCalculationResult {
    if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
      throw new ValidationError('Document must have at least one line item to calculate');
    }

    let subtotal = 0;
    let totalLineDiscount = 0;
    let totalTax = 0;

    const calculatedLines: CalculationResultLine[] = params.items.map((item, idx) => {
      const qty = Number(item.quantity);
      const rate = Number(item.unitPrice);

      if (isNaN(qty) || qty <= 0) {
        throw new ValidationError(`Line ${idx + 1}: Invalid quantity (${item.quantity})`);
      }
      if (isNaN(rate) || rate < 0) {
        throw new ValidationError(`Line ${idx + 1}: Invalid unit price (${item.unitPrice})`);
      }

      const gross = Number((qty * rate).toFixed(2));

      // Calculate line discount
      let discountAmount = 0;
      if (item.discount && item.discount > 0) {
        if (item.isDiscountPercent) {
          discountAmount = Number(((gross * item.discount) / 100).toFixed(2));
        } else {
          discountAmount = Number(item.discount.toFixed(2));
        }
      }

      if (discountAmount > gross) {
        discountAmount = gross;
      }

      const taxable = Number((gross - discountAmount).toFixed(2));

      // Calculate tax
      let taxAmount = 0;
      if (item.taxRate && item.taxRate > 0) {
        taxAmount = Number(((taxable * item.taxRate) / 100).toFixed(2));
      }

      const netLineTotal = Number((taxable + taxAmount).toFixed(2));

      subtotal += gross;
      totalLineDiscount += discountAmount;
      totalTax += taxAmount;

      return {
        ...item,
        quantity: qty,
        unitPrice: rate,
        grossAmount: gross,
        discountAmount,
        taxableAmount: taxable,
        taxAmount,
        netLineTotal,
      };
    });

    const docDiscount = Math.max(0, Number(params.documentDiscount) || 0);
    const shipping = Math.max(0, Number(params.shippingCharge) || 0);
    const other = Math.max(0, Number(params.otherCharges) || 0);

    const totalDiscount = Number((totalLineDiscount + docDiscount).toFixed(2));
    const subtotalFixed = Number(subtotal.toFixed(2));
    const totalTaxFixed = Number(totalTax.toFixed(2));
    const taxableSubtotal = Math.max(0, Number((subtotalFixed - totalDiscount).toFixed(2)));

    const grandTotal = Number((taxableSubtotal + totalTaxFixed + shipping + other).toFixed(2));

    const currencyName = params.currency === 'USD' ? 'Dollars' : params.currency === 'EUR' ? 'Euros' : 'Taka';

    const amountInWordsEn = AmountInWordsService.toEnglishWords(grandTotal, currencyName);
    const amountInWordsBn = AmountInWordsService.toBanglaWords(
      grandTotal,
      params.currency === 'USD' ? 'ডলার' : params.currency === 'EUR' ? 'ইউরো' : 'টাকা'
    );

    return {
      lines: calculatedLines,
      subtotal: subtotalFixed,
      totalDiscount,
      taxableSubtotal,
      totalTax: totalTaxFixed,
      shippingCharge: shipping,
      otherCharges: other,
      grandTotal,
      amountInWordsEn,
      amountInWordsBn,
    };
  }
}

export default DocumentCalculationService;
