import { test as base, expect, type Browser } from '@playwright/test';
import { version } from '@playwright/test/package.json';

export type CloudOptions = { cloudTarget: { browser: string; platform: string } | undefined };

export const test = base.extend<CloudOptions>({
  cloudTarget: [undefined, { option: true }],
  page: async ({ playwright, browserName, cloudTarget, baseURL, viewport, locale, actionTimeout, navigationTimeout }, use, testInfo) => {
    const engine = playwright[browserName];
    let browser: Browser;
    if (cloudTarget) {
      const capabilities = {
        browserName: cloudTarget.browser,
        browserVersion: 'latest',
        'LT:Options': {
          platform: cloudTarget.platform,
          build: process.env.LT_BUILD_NAME || 'Playwright 101 Assessment',
          name: `${testInfo.project.name}: ${testInfo.title}`,
          user: process.env.LT_USERNAME,
          accessKey: process.env.LT_ACCESS_KEY,
          network: true,
          video: true,
          visual: true,
          console: true,
          'client.playwrightVersion': version,
        },
      };
      try {
        browser = await engine.connect({
          wsEndpoint: `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify(capabilities))}`,
          timeout: 60_000,
        });
      } catch (error) {
        // Connection messages can embed credentials in the endpoint. Redact before reporting.
        const reason = String(error instanceof Error ? error.message : error)
          .replace(/wss:\/\/\S+/g, '[redacted endpoint]')
          .replaceAll(process.env.LT_ACCESS_KEY ?? '__unset_key__', '[redacted key]');
        throw new Error(`TestMu cloud connection failed: ${reason}`);
      }
    } else {
      browser = await engine.launch();
    }
    const context = await browser.newContext({
      baseURL, viewport, locale,
      // Cloud video is recorded by TestMu. Native recording needs a grid-side
      // ffmpeg binary that is not available on every provider image.
      recordVideo: cloudTarget ? undefined : { dir: testInfo.outputPath('videos') },
      recordHar: { path: testInfo.outputPath('network.har'), mode: 'minimal', content: 'omit' },
    });
    context.setDefaultTimeout(actionTimeout ?? 15_000);
    context.setDefaultNavigationTimeout(navigationTimeout ?? 45_000);
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    const page = await context.newPage().catch(async error => {
      try { await context.close(); } finally { await browser.close(); }
      throw error;
    });
    const logs: string[] = [];
    page.on('console', message => logs.push(`[${message.type()}] ${message.text()}`));
    page.on('pageerror', error => logs.push(`[pageerror] ${error.message}`));
    try {
      if (cloudTarget) {
        const raw = await page.evaluate(() => {}, 'lambdatest_action: {"action":"getTestDetails"}') as unknown;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const info = (parsed?.data ?? parsed) as Record<string, unknown>;
        const details = Object.fromEntries(Object.entries(info ?? {}).filter(([key]) => /^(session_?id|test_?id|dashboard_?url)$/i.test(key)));
        if (!Object.keys(details).length) throw new Error('Cloud session ID was not returned by getTestDetails. Check the TestMu dashboard.');
        await testInfo.attach('testmu-session', { body: JSON.stringify(details, null, 2), contentType: 'application/json' });
        console.log(`TestMu session (${testInfo.project.name} / ${testInfo.title}): ${JSON.stringify(details)}`);
      }
      await use(page);
    } finally {
      try {
        if (!page.isClosed()) {
          await testInfo.attach('final-screenshot', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
          if (cloudTarget) {
            await page.evaluate(() => {}, `lambdatest_action: ${JSON.stringify({ action: 'setTestStatus', arguments: {
              status: testInfo.status === 'passed' ? 'passed' : 'failed',
              remark: `${testInfo.title}: ${testInfo.status}`,
            } })}`);
          }
        }
      } finally {
        await testInfo.attach('console', { body: logs.join('\n') || '(no console messages)', contentType: 'text/plain' });
        try {
          await context.tracing.stop({ path: testInfo.outputPath('trace.zip') });
        } finally {
          try {
            await context.close();
            await testInfo.attach('trace', { path: testInfo.outputPath('trace.zip'), contentType: 'application/zip' });
            await testInfo.attach('network', { path: testInfo.outputPath('network.har'), contentType: 'application/json' });
            const video = page.video();
            if (video) await testInfo.attach('video', { path: await video.path(), contentType: 'video/webm' });
          } finally { await browser.close(); }
        }
      }
    }
  },
});
export { expect };
