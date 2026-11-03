import { expect, test, type Locator, type Page } from '@playwright/test';

const open = async (page: Page) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto('/');
  await expect(page.getByRole('list', { name: 'Products' })).toBeVisible();
};
const panel = (page: Page, name: RegExp) => page.getByRole('dialog', { name });
const rect = async (element: Locator) => {
  const box = await element.boundingBox();
  if (!box) throw new Error('Expected visible element');
  return box;
};

test('the brand and equally weighted icon controls are present on mobile', async ({
  page,
}) => {
  await open(page);
  const logo = page.getByRole('img', { name: /basf/i });
  await expect(logo).toBeVisible();
  expect(
    await logo.evaluate(
      (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
    ),
  ).toBe(true);
  const buttons = ['Search', 'Filters', 'Sort'].map((name) =>
    page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') }),
  );
  const boxes = await Promise.all(buttons.map(rect));
  expect(
    Math.max(...boxes.map((box) => box.width)) -
      Math.min(...boxes.map((box) => box.width)),
  ).toBeLessThan(2);
  const backgrounds = await Promise.all(
    buttons.map((button) =>
      button.evaluate((node) => getComputedStyle(node).backgroundColor),
    ),
  );
  expect(new Set(backgrounds).size).toBe(1);
  for (const button of buttons)
    await expect(button.locator('svg, .pi')).toHaveCount(1);
});

test('filter panel keeps header and full width apply visible while content scrolls and draft changes are applied or discarded', async ({
  page,
}) => {
  await open(page);
  const trigger = page.getByRole('button', { name: /^filters$/i });
  await trigger.click();
  let dialog = panel(page, /filter/i);
  const close = dialog.getByRole('button', { name: /close/i });
  const reset = dialog.getByRole('button', { name: /reset|clear/i });
  const apply = dialog.getByRole('button', { name: /apply/i });
  await expect(dialog.getByRole('button', { name: /cancel/i })).toHaveCount(0);
  await expect(apply).toContainText(/0/);
  await dialog.getByRole('checkbox', { name: /^active$/i }).check();
  await dialog.getByRole('checkbox', { name: /phase.out/i }).check();
  await expect(apply).toContainText(/2/);
  const headerBefore = await rect(close);
  const footerBefore = await rect(apply);
  const scrollable = dialog.locator('[data-panel-content]');
  expect(
    await scrollable.evaluate((node) => node.scrollHeight > node.clientHeight),
  ).toBe(true);
  await scrollable.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  expect((await rect(close)).y).toBeCloseTo(headerBefore.y, 0);
  expect((await rect(apply)).y).toBeCloseTo(footerBefore.y, 0);
  await expect(reset).toBeInViewport();
  await expect(apply).toBeInViewport();
  const panelBox = await rect(dialog);
  const buttonBox = await rect(apply);
  expect(buttonBox.width).toBeGreaterThan(panelBox.width * 0.8);
  await close.click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  dialog = panel(page, /filter/i);
  await expect(
    dialog.getByRole('checkbox', { name: /^active$/i }),
  ).not.toBeChecked();
  await dialog.getByRole('checkbox', { name: /^active$/i }).check();
  await dialog.getByRole('button', { name: /apply/i }).click();
  await expect(
    page.getByRole('button', { name: /remove.*active/i }),
  ).toBeVisible();
  await trigger.click();
  dialog = panel(page, /filter/i);
  await dialog.getByRole('button', { name: /reset|clear/i }).click();
  await expect(dialog.getByRole('button', { name: /apply/i })).toContainText(
    /0/,
  );
  await dialog.getByRole('button', { name: /close/i }).click();
  await expect(
    page.getByRole('button', { name: /remove.*active/i }),
  ).toBeVisible();
  await trigger.click();
  dialog = panel(page, /filter/i);
  await dialog.getByRole('button', { name: /reset|clear/i }).click();
  await dialog.getByRole('button', { name: /apply/i }).click();
  await expect(
    page.getByRole('button', { name: /remove.*active/i }),
  ).toHaveCount(0);
});

test('sort reset and close preserve the committed selection until applied', async ({
  page,
}) => {
  await open(page);
  const trigger = page.getByRole('button', { name: /^sort$/i });
  await trigger.click();
  let dialog = panel(page, /sort/i);
  await expect(dialog.getByRole('button', { name: /apply/i })).toContainText(
    /1/,
  );
  await dialog.getByRole('radio', { name: /name.*z.*a/i }).check();
  await dialog.getByRole('button', { name: /close/i }).click();
  await trigger.click();
  dialog = panel(page, /sort/i);
  await expect(
    dialog.getByRole('radio', { name: /name.*a.*z/i }),
  ).toBeChecked();
  await dialog.getByRole('radio', { name: /name.*z.*a/i }).check();
  await dialog.getByRole('button', { name: /apply/i }).click();
  await trigger.click();
  dialog = panel(page, /sort/i);
  await dialog.getByRole('button', { name: /reset/i }).click();
  await expect(
    dialog.getByRole('radio', { name: /name.*a.*z/i }),
  ).toBeChecked();
  await dialog.getByRole('button', { name: /close/i }).click();
  await trigger.click();
  dialog = panel(page, /sort/i);
  await expect(
    dialog.getByRole('radio', { name: /name.*z.*a/i }),
  ).toBeChecked();
  const box = await rect(dialog.getByRole('button', { name: /apply/i }));
  expect(box.width).toBeGreaterThan((await rect(dialog)).width * 0.8);
  await expect(dialog.getByRole('button', { name: /cancel/i })).toHaveCount(0);
});

test('status labels are legible and visually distinguish the requested states', async ({
  page,
}) => {
  await open(page);
  const row = (name: string) =>
    page.getByRole('listitem').filter({ hasText: name });
  const active = row('Fixture Product 001').getByText('Active', {
    exact: true,
  });
  const phase = row('Fixture Product 002').getByText('Phase-out', {
    exact: true,
  });
  const discontinued = row('Fixture Product 003').getByText('Discontinued', {
    exact: true,
  });
  const colors = await Promise.all(
    [active, phase, discontinued].map((tag) =>
      tag.evaluate((element) => {
        const style = getComputedStyle(element.closest('p-tag') ?? element);
        return style.backgroundColor;
      }),
    ),
  );
  expect(new Set(colors).size).toBe(3);
});
