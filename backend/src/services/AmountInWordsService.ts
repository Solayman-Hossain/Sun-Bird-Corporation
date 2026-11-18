export class AmountInWordsService {
  private static readonly ONES_EN = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  private static readonly TENS_EN = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  private static readonly ONES_BN: Record<number, string> = {
    0: 'শূন্য', 1: 'এক', 2: 'দুই', 3: 'তিন', 4: 'চার', 5: 'পাঁচ', 6: 'ছয়', 7: 'সাত', 8: 'আট', 9: 'নয়',
    10: 'দশ', 11: 'এগারো', 12: 'বারো', 13: 'তেরো', 14: 'চৌদ্দ', 15: 'পনেরো', 16: 'ষোল',
    17: 'সতেরো', 18: 'আঠারো', 19: 'উনিশ', 20: 'বিশ', 21: 'একুশ', 22: 'বাইশ', 23: 'তেইশ',
    24: 'চব্বিশ', 25: 'পঁচিশ', 26: 'ছাব্বিশ', 27: 'সাতাশ', 28: 'আঠাশ', 29: 'উনত্রিশ',
    30: 'ত্রিশ', 31: 'একত্রিশ', 32: 'বত্রিশ', 33: 'তেত্রিশ', 34: 'চৌত্রিশ', 35: 'পঁয়ত্রিশ',
    36: 'ছত্রিশ', 37: 'সাঁইত্রিশ', 38: 'আটত্রিশ', 39: 'উনচল্লিশ', 40: 'চল্লিশ', 41: 'একচল্লিশ',
    42: 'বিয়াল্লিশ', 43: 'তেতাল্লিশ', 44: 'চুয়াল্লিশ', 45: 'পঁয়তাল্লিশ', 46: 'ছেচল্লিশ',
    47: 'সাতচল্লিশ', 48: 'আটচল্লিশ', 49: 'উনপঞ্চাশ', 50: 'পঞ্চাশ', 51: 'একান্ন', 52: 'বায়ান্ন',
    53: 'তিপ্পান্ন', 54: 'চুয়ান্ন', 55: 'পঞ্চান্ন', 56: 'ছাপ্পান্ন', 57: 'সাতান্ন', 58: 'আটান্ন',
    59: 'উনষাট', 60: 'ষাট', 61: 'একষট্টি', 62: 'বাষট্টি', 63: 'তেষট্টি', 64: 'চৌষট্টি',
    65: 'পঁয়ষট্টি', 66: 'ছেষট্টি', 67: 'সাতষট্টি', 68: 'আটষট্টি', 69: 'উনসত্তর', 70: 'সত্তর',
    71: 'একাত্তর', 72: 'বাহাত্তর', 73: 'তিয়াত্তর', 74: 'চুয়াত্তর', 75: 'পঁচাত্তর', 76: 'ছিয়াত্তর',
    77: 'সাতাত্তর', 78: 'আটাত্তর', 79: 'উনআশি', 80: 'আশি', 81: 'একাশি', 82: 'বিরাশি',
    83: 'তিরাশি', 84: 'চুরাশি', 85: 'পঁচাশি', 86: 'ছিয়াশি', 87: 'সাতাশি', 88: 'অষ্টআশি',
    89: 'উননব্বই', 90: 'নব্বই', 91: 'একানব্বই', 92: 'বিয়ানব্বই', 93: 'তিরানব্বই', 94: 'চুরানব্বই',
    95: 'পঁচানব্বই', 96: 'ছিয়ানব্বই', 97: 'সাতানব্বই', 98: 'আটানব্বই', 99: 'নিরানব্বই'
  };

  /**
   * Converts a number below 1000 into English words
   */
  private static convertThreeDigitsEn(num: number): string {
    let result = '';
    const hundred = Math.floor(num / 100);
    const rest = num % 100;

    if (hundred > 0) {
      result += `${this.ONES_EN[hundred]} Hundred `;
    }

    if (rest > 0) {
      if (rest < 20) {
        result += this.ONES_EN[rest];
      } else {
        const ten = Math.floor(rest / 10);
        const one = rest % 10;
        result += `${this.TENS_EN[ten]}${one > 0 ? ` ${this.ONES_EN[one]}` : ''}`;
      }
    }

    return result.trim();
  }

  /**
   * Converts monetary amount to English words using standard South Asian notation (Crore, Lakh, Thousand)
   */
  public static toEnglishWords(amount: number, currency = 'Taka'): string {
    if (isNaN(amount) || amount === 0) {
      return `Zero ${currency} Only`;
    }

    const absAmount = Math.abs(amount);
    const integerPart = Math.floor(absAmount);
    const decimalPart = Math.round((absAmount - integerPart) * 100);

    let crore = Math.floor(integerPart / 10000000);
    let lakh = Math.floor((integerPart % 10000000) / 100000);
    let thousand = Math.floor((integerPart % 100000) / 1000);
    let hundred = integerPart % 1000;

    const parts: string[] = [];

    if (crore > 0) {
      parts.push(`${this.convertThreeDigitsEn(crore)} Crore`);
    }
    if (lakh > 0) {
      parts.push(`${this.convertThreeDigitsEn(lakh)} Lakh`);
    }
    if (thousand > 0) {
      parts.push(`${this.convertThreeDigitsEn(thousand)} Thousand`);
    }
    if (hundred > 0) {
      parts.push(this.convertThreeDigitsEn(hundred));
    }

    let words = parts.join(' ').trim();
    if (!words) {
      words = 'Zero';
    }

    let output = `${words} ${currency}`;

    if (decimalPart > 0) {
      output += ` and ${this.convertThreeDigitsEn(decimalPart)} Paisa`;
    }

    output += ' Only';
    return output;
  }

  /**
   * Converts monetary amount to Bangla words using South Asian numbering
   */
  public static toBanglaWords(amount: number, currency = 'টাকা'): string {
    if (isNaN(amount) || amount === 0) {
      return `শূন্য ${currency} মাত্র`;
    }

    const absAmount = Math.abs(amount);
    const integerPart = Math.floor(absAmount);
    const decimalPart = Math.round((absAmount - integerPart) * 100);

    const crore = Math.floor(integerPart / 10000000);
    const lakh = Math.floor((integerPart % 10000000) / 100000);
    const thousand = Math.floor((integerPart % 100000) / 1000);
    const hundred = Math.floor((integerPart % 1000) / 100);
    const rest = integerPart % 100;

    const parts: string[] = [];

    if (crore > 0) {
      parts.push(`${this.ONES_BN[crore] || crore} কোটি`);
    }
    if (lakh > 0) {
      parts.push(`${this.ONES_BN[lakh] || lakh} লক্ষ`);
    }
    if (thousand > 0) {
      parts.push(`${this.ONES_BN[thousand] || thousand} হাজার`);
    }
    if (hundred > 0) {
      parts.push(`${this.ONES_BN[hundred] || hundred} শত`);
    }
    if (rest > 0) {
      parts.push(this.ONES_BN[rest] || String(rest));
    }

    let words = parts.join(' ').trim();
    if (!words) {
      words = 'শূন্য';
    }

    let output = `${words} ${currency}`;

    if (decimalPart > 0) {
      output += ` এবং ${this.ONES_BN[decimalPart] || decimalPart} পয়সা`;
    }

    output += ' মাত্র';
    return output;
  }

  /**
   * Universal router for Amount in Words
   */
  public static toWords(amount: number, language: 'EN' | 'BN' = 'EN', currency = 'Taka'): string {
    if (language === 'BN') {
      return this.toBanglaWords(amount, currency === 'Taka' ? 'টাকা' : currency);
    }
    return this.toEnglishWords(amount, currency);
  }
}

export default AmountInWordsService;
