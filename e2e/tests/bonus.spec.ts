import { expect, test } from '@playwright/test';
import { createTask, registerAndLogin, taskItem, uniqueUser } from './helpers.js';

test.describe('features bonus', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, uniqueUser());
  });

  test('alterna el modo oscuro y lo recuerda', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).not.toHaveAttribute('data-theme', 'dark');

    await page.getByRole('button', { name: /cambiar a modo oscuro/i }).click();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('abre el modal de atajos y crea una tarea con el teclado', async ({ page }) => {
    await page.getByRole('button', { name: 'Atajos de teclado' }).click();
    await expect(page.getByRole('dialog', { name: /atajos de teclado/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.keyboard.press('n');
    await expect(page.getByRole('form', { name: 'Nueva tarea' })).toBeVisible();
  });

  test('completa varias tareas en lote', async ({ page }) => {
    await createTask(page, { titulo: 'Lote A' });
    await createTask(page, { titulo: 'Lote B' });

    await page.getByRole('button', { name: 'Seleccionar' }).click();
    await taskItem(page, 'Lote A')
      .getByRole('checkbox', { name: /seleccionar/i })
      .check();
    await taskItem(page, 'Lote B')
      .getByRole('checkbox', { name: /seleccionar/i })
      .check();

    await expect(page.getByText('2 seleccionadas')).toBeVisible();
    await page
      .getByRole('region', { name: /acciones en lote/i })
      .getByRole('button', { name: 'Completar' })
      .click();

    await expect(
      taskItem(page, 'Lote A').getByRole('checkbox', { name: /pendiente/i }),
    ).toBeChecked();
    await expect(
      taskItem(page, 'Lote B').getByRole('checkbox', { name: /pendiente/i }),
    ).toBeChecked();
  });

  test('exporta las tareas a CSV', async ({ page }) => {
    await createTask(page, { titulo: 'Exportable' });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'CSV' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^tareas-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
