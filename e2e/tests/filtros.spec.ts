import { expect, test } from '@playwright/test';
import { createTask, registerAndLogin, taskItem, uniqueUser } from './helpers.js';

test.describe('filtrado y búsqueda', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, uniqueUser());
    await createTask(page, { titulo: 'Preparar informe', prioridad: 'urgente' });
    await createTask(page, { titulo: 'Comprar leche', prioridad: 'baja' });
  });

  test('busca por texto', async ({ page }) => {
    await page.getByRole('searchbox', { name: /buscar tareas/i }).fill('informe');

    await expect(taskItem(page, 'Preparar informe')).toBeVisible();
    await expect(page.getByText('Comprar leche')).toBeHidden();
  });

  test('filtra por prioridad y limpia', async ({ page }) => {
    await page.getByRole('button', { name: /^filtros/i }).click();
    const panel = page.getByLabel('Filtros');
    await panel.getByLabel('Prioridad').selectOption('urgente');

    await expect(taskItem(page, 'Preparar informe')).toBeVisible();
    await expect(page.getByText('Comprar leche')).toBeHidden();

    await panel.getByRole('button', { name: /limpiar filtros/i }).click();
    await expect(taskItem(page, 'Comprar leche')).toBeVisible();
  });

  test('muestra estado vacío cuando nada coincide', async ({ page }) => {
    await page.getByRole('searchbox', { name: /buscar tareas/i }).fill('xyz-no-existe');
    await expect(page.getByText(/ninguna tarea coincide/i)).toBeVisible();
  });
});
