import { Types } from 'mongoose';
import { CustomerCreditProfileModel } from '../models/CustomerCreditProfile';
import { CustomerCreditService } from '../services/CustomerCreditService';
import { CreditLockedError } from '../errors/AppError';

describe('B2B Customer Credit Gate Test Suite (Prompt 54)', () => {
  const customerId = new Types.ObjectId();

  afterAll(async () => {
    await CustomerCreditProfileModel.deleteMany({ customerId });
  });

  it('should approve dispatch when customer credit exposure is within limit', async () => {
    await CustomerCreditProfileModel.create({
      customerId,
      creditLimitBDT: 500000, // 5 Lakh limit
      creditTermDays: 30,
      currentOutstandingAR: 200000,
      unbilledDispatches: 0,
      isCreditLocked: false,
    });

    // Validating an order for 100,000 (total exposure 300,000 <= 500,000)
    const allowed = await CustomerCreditService.checkCreditExposure(
      customerId.toString(),
      100000
    );

    expect(allowed).toBe(true);
  });

  it('should hard-lock dispatch when order causes exposure to exceed approved limit', async () => {
    // Validating an order for 400,000 (total exposure 200,000 + 400,000 = 600,000 > 500,000)
    await expect(
      CustomerCreditService.checkCreditExposure(customerId.toString(), 400000)
    ).rejects.toThrow(CreditLockedError);
  });
});
