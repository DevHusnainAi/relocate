// FR-1.2: on failure, dump the DOM exactly as it was at the point of failure.
import { test as base, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

export const test = base.extend<{ relocateCapture: void }>({
  relocateCapture: [async ({ page }, use, info) => {
    await use();
    if (info.status === info.expectedStatus) return;
    const dir = `.relocate/snapshots/${info.testId}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/dom.html`, await page.content());
    writeFileSync(`${dir}/url.txt`, page.url());
  }, { auto: true }],
});
export { expect };
