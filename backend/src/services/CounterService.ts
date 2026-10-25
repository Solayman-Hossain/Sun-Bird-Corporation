import { ClientSession } from 'mongoose';
import { CounterModel } from '../models/Counter';
import logger from '../config/logger';

export class CounterService {
  /**
   * Atomically generates a gapless sequential identifier formatted per NBR/Sun Bird standards.
   *
   * Formats supported per Prompt 44:
   * - `CH-2026-00001`  (Mushak-6.3 Delivery Challan)
   * - `INV-2026-00001` (Tax Invoice)
   * - `JV-2026-00001`  (Journal Voucher)
   * - `PO-2026-00001`  (Purchase Order)
   * - `PR-2026-10`     (Monthly Payroll Run)
   * - `CRM-2026-00001` (CRM Activity)
   * - `AR-2026-00001`  (Approval Request)
   *
   * @param counterKey Document code prefix or counter key (e.g. 'CH', 'INV', 'JV', 'PO', 'PR', 'CRM', 'AR')
   * @param session Optional MongoDB ClientSession for ACID transaction enlistment
   * @returns Formatted unique sequence string
   */
  public static async getNextSequence(
    counterKey: string,
    session?: ClientSession
  ): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const normalizedKey = counterKey.trim().toUpperCase();

    let counterId: string;
    let isPayrollRun = false;

    if (normalizedKey === 'PR' || normalizedKey.startsWith('PR_')) {
      isPayrollRun = true;
      counterId = `PR_${year}_${month}`;
    } else if (normalizedKey.includes('_')) {
      counterId = normalizedKey;
    } else {
      counterId = `${normalizedKey}_${year}`;
    }

    const updateOptions: any = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    };
    if (session) {
      updateOptions.session = session;
    }

    const counter = await CounterModel.findByIdAndUpdate(
      counterId,
      { $inc: { seq: 1 } },
      updateOptions
    );

    const seqNumber = counter ? counter.seq : 1;

    let formattedNumber: string;
    if (isPayrollRun) {
      formattedNumber = `PR-${year}-${month}`;
    } else {
      const prefix = counterId.split('_')[0];
      formattedNumber = `${prefix}-${year}-${String(seqNumber).padStart(5, '0')}`;
    }

    logger.debug(`Generated sequence ${formattedNumber} for counterId ${counterId}`);
    return formattedNumber;
  }
}

export default CounterService;
