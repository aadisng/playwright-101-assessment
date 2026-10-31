import { test, expect } from './fixtures/test';
import { waitForWidgetHandler } from './pages/readiness';

test.beforeEach(async ({ page }) => {
  await page.goto('/selenium-playground/');
});

test('Scenario 1 - Simple Form Demo echoes the entered message', async ({ page }) => {
  await page.getByRole('link', { name: 'Simple Form Demo', exact: true }).click();
  await expect(page).toHaveURL(/simple-form-demo/);
  // A normal input click also starts the site's deferred client scripts.
  await page.locator('input#user-message').click();
  await waitForWidgetHandler(page, '#showInput', 'click');
  const message = 'Welcome to TestMu AI';
  await page.locator('input#user-message').fill(message);
  await page.getByRole('button', { name: 'Get Checked Value', exact: true }).click();
  await expect(page.locator('#message')).toHaveText(message);
});

test('Scenario 2 - Drag the default 15 slider to 95', async ({ page }) => {
  await page.getByRole('link', { name: 'Drag & Drop Sliders', exact: true }).click();
  const section = page.locator('#slider3');
  await expect(section.getByRole('heading')).toHaveText('Default value 15');
  const slider = section.getByRole('slider');
  const output = section.locator('output');
  await expect(slider).toHaveValue('15');
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  if (!box) throw new Error('Slider has no bounding box');
  // Drag the actual native thumb; range geometry differs slightly by engine.
  const thumbWidth = 16;
  const trackWidth = box.width - thumbWidth;
  const xAt = (value: number) => box.x + thumbWidth / 2 + trackWidth * ((value - 1) / 99);
  await page.mouse.move(xAt(15), box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(xAt(95), box.y + box.height / 2, { steps: 30 });
  await page.mouse.up();
  // Correct native pixel rounding using genuine keyboard input after the drag.
  await slider.focus();
  for (let attempt = 0; attempt < 10; attempt++) {
    const current = Number(await slider.inputValue());
    if (current === 95) break;
    await slider.press(current < 95 ? 'ArrowRight' : 'ArrowLeft');
  }
  await expect(slider).toHaveValue('95');
  await expect(output).toHaveText('95');
});

test('Scenario 3 - Required validation and successful form submission', async ({ page }, testInfo) => {
  await page.getByRole('link', { name: 'Input Form Submit', exact: true }).click();
  const form = page.locator('#seleniumform');
  await form.getByPlaceholder('Name', { exact: true }).click();
  await waitForWidgetHandler(page, '#seleniumform', 'submit');
  await form.getByRole('button', { name: 'Submit', exact: true }).click();
  const name = form.getByPlaceholder('Name', { exact: true });
  await expect(name).toBeFocused();
  const validation = await name.evaluate((element: HTMLInputElement) => ({
    message: element.validationMessage,
    missing: element.validity.valueMissing,
    valid: element.validity.valid,
  }));
  expect(validation.missing).toBe(true);
  expect(validation.valid).toBe(false);
  // Native HTML5 text is browser-owned; the assessment paraphrases it as
  // "Please fill in the fields". Assert the actual English message for each engine.
  expect(validation.message).toBe('Please fill out this field.');
  await testInfo.attach('required-field-validation', { body: JSON.stringify(validation, null, 2), contentType: 'application/json' });
  await expect(page.locator('.success-msg')).toBeHidden();
  await name.fill('Alex Tester');
  await form.getByPlaceholder('Email', { exact: true }).fill('alex.tester@example.com');
  await form.getByPlaceholder('Password', { exact: true }).fill('DemoOnly!2026');
  await form.getByPlaceholder('Company', { exact: true }).fill('Example Quality Engineering');
  await form.getByPlaceholder('Website', { exact: true }).fill('https://example.com');
  await form.locator('select[name="country"]').selectOption({ label: 'United States' });
  await expect(form.locator('select[name="country"]')).toHaveValue('US');
  await form.getByPlaceholder('City', { exact: true }).fill('San Francisco');
  await form.getByPlaceholder('Address 1', { exact: true }).fill('123 Test Street');
  await form.getByPlaceholder('Address 2', { exact: true }).fill('Suite 101');
  await form.getByPlaceholder('State', { exact: true }).fill('California');
  await form.getByPlaceholder('Zip code', { exact: true }).fill('94105');
  await form.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.locator('.success-msg')).toBeVisible();
  await expect(page.locator('.success-msg')).toHaveText('Thanks for contacting us, we will get back to you shortly.');
});
