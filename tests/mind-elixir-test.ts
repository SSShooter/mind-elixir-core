import { test as base } from '@playwright/test'
import { MindElixirFixture } from './MindElixirFixture'
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const istanbulCLIOutput = path.join(process.cwd(), '.nyc_output');

export function generateUUID(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Declare the types of your fixtures.
type MyFixtures = {
  me: MindElixirFixture
}

// Extend base test by providing "todoPage" and "settingsPage".
// This new "test" can be used in multiple test files, and each of them will get the fixtures.
export const test = base.extend<MyFixtures>({
  context: async ({ context }, use) => {
    await context.addInitScript(() =>
      window.addEventListener('beforeunload', () =>
        (window as any).collectIstanbulCoverage(JSON.stringify((window as any).__coverage__))
      ),
    );
    await fs.promises.mkdir(istanbulCLIOutput, { recursive: true });
    await context.exposeFunction('collectIstanbulCoverage', (coverageJSON: string) => {
      if (coverageJSON)
        fs.writeFileSync(path.join(istanbulCLIOutput, `playwright_coverage_${generateUUID()}.json`), coverageJSON);
    });
    await use(context);
    for (const page of context.pages()) {
      await page.evaluate(() => (window as any).collectIstanbulCoverage(JSON.stringify((window as any).__coverage__)))
    }
  },
  me: async ({ page }, use) => {
    // Set up the fixture.
    const me = new MindElixirFixture(page)
    await me.goto()

    // Use the fixture value in the test.
    await use(me)
  },
})
export { expect } from '@playwright/test'
