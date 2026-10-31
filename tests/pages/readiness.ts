import type { Page } from '@playwright/test';

/** Playground handlers are attached after client initialization. Inspect the
 * element's jQuery event cache, which survives another jQuery instance loading.
 * This observes readiness without injecting handlers or changing application data.
 */
export async function waitForWidgetHandler(page: Page, selector: string, event: string): Promise<void> {
  await page.waitForFunction(({ selector, event }) => {
    const element = document.querySelector(selector);
    if (!element) return false;
    return Object.entries(element).some(([key, value]) => {
      const cache = value as { events?: Record<string, unknown[]> } | undefined;
      return key.startsWith('jQuery') && !!cache?.events?.[event]?.length;
    });
  }, { selector, event }, { timeout: 45_000 });
}
