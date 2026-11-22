import { execSync } from 'child_process';

interface TestSuiteDef {
  name: string;
  command: string;
  module: string;
}

const suites: TestSuiteDef[] = [
  { name: 'test:final-integration', command: 'npm run test:final-integration', module: 'Module 18: System Integration & Production Audit' },
  { name: 'test:ecommerce-public', command: 'npm run test:ecommerce-public', module: 'Module 17: Public E-Commerce Storefront' },
  { name: 'test:system-module', command: 'npm run test:system-module', module: 'Module 16: System Administration & Security' },
  { name: 'test:ai-module', command: 'npm run test:ai-module', module: 'Module 15: Central AI Assistant & Copilot' },
  { name: 'test:mis-module', command: 'npm run test:mis-module', module: 'Module 14: Executive Overview & Advanced MIS' },
  { name: 'test:support-module', command: 'npm run test:support-module', module: 'Module 13: RMA & Support Desk' },
  { name: 'test:import-module', command: 'npm run test:import-module', module: 'Module 12: Import / LC Tracker' },
  { name: 'test:marketing-module', command: 'npm run test:marketing-module', module: 'Module 11: Banners & Marketing CMS' },
  { name: 'test:hrm-module', command: 'npm run test:hrm-module', module: 'Module 10: HR & Payroll Engine' },
  { name: 'test:order-module', command: 'npm run test:order-module', module: 'Module 09: Order Processing & E-Commerce' },
  { name: 'test:sales-routes', command: 'npm run test:sales-routes', module: 'Module 09: Sales, POS & Logistics Routes' },
  { name: 'test:logistics-service', command: 'npm run test:logistics-service', module: 'Module 09: Courier Webhooks & Logistics' },
  { name: 'test:accounting-module', command: 'npm run test:accounting-module', module: 'Module 08: Accounts & Double-Entry Ledger' },
  { name: 'test:partner-service', command: 'npm run test:partner-service', module: 'Module 08: Partner Capital & Drawings' },
  { name: 'test:loan-service', command: 'npm run test:loan-service', module: 'Module 08: Bank Loans & EMI Amortization' },
  { name: 'test:document-module', command: 'npm run test:document-module', module: 'Module 07: Statutory Document & Mushak Engine' },
];

async function runAll() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  SUN BIRD ERP — 16/16 MASTER QUALITY ASSURANCE & AUDIT RUNNER');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  let totalPassed = 0;
  let totalFailed = 0;
  const results: { suite: string; module: string; passed: number; failed: number; status: string }[] = [];

  for (let i = 0; i < suites.length; i++) {
    const s = suites[i];
    process.stdout.write(`[${i + 1}/${suites.length}] Running ${s.name} (${s.module})... `);
    try {
      const output = execSync(s.command, {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf-8',
        maxBuffer: 20 * 1024 * 1024,
      });

      // Count pass markers (matches "✅", "[PASS]", or "✓")
      const passMatches = output.match(/✅\s*\[PASS\]|✓\s+|\[PASS\]/gi) || [];
      const failMatches = output.match(/❌\s*\[FAIL\]|\[FAIL\]/gi) || [];

      // Check for explicit summary line: "VERIFICATION RESULTS: X PASSED, Y FAILED" or "ALL X/X TESTS PASSED"
      const summaryMatch = output.match(/RESULTS:\s*(\d+)\s*PASSED/i) || output.match(/ALL\s*(\d+)\/(\d+)\s*(?:INTEGRATION\s*)?(?:TESTS|ASSERTIONS)/i);
      let passedCount = passMatches.length;
      if (summaryMatch) {
        passedCount = parseInt(summaryMatch[1], 10);
      }

      const failedCount = failMatches.length;

      totalPassed += passedCount;
      totalFailed += failedCount;

      results.push({
        suite: s.name,
        module: s.module,
        passed: passedCount,
        failed: failedCount,
        status: failedCount === 0 ? 'PASSED' : 'FAILED',
      });

      console.log(`✓ (${passedCount} assertions passed)`);
    } catch (err: any) {
      console.log(`❌ ERROR`);
      const errOut = (err.stdout || '') + (err.stderr || '') + (err.message || '');
      console.error(errOut.slice(-500));
      results.push({
        suite: s.name,
        module: s.module,
        passed: 0,
        failed: 1,
        status: 'CRASHED',
      });
      totalFailed++;
    }
  }

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log('  FINAL QA & DEVOPS AUDIT SUMMARY TABLE');
  console.log('════════════════════════════════════════════════════════════════════════');
  console.table(results);
  console.log(`Total Assertions Passed: ${totalPassed}`);
  console.log(`Total Assertions Failed: ${totalFailed}`);
  console.log(`Success Rate: ${((totalPassed / (totalPassed + totalFailed || 1)) * 100).toFixed(1)}%`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runAll();
