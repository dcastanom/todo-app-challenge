import { expect, test } from '@playwright/test';
import { createTask, registerAndLogin, taskItem, uniqueUser } from './helpers.js';

test.describe('CRUD de tareas', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, uniqueUser());
  });

  test('empieza vacío y permite crear una tarea', async ({ page }) => {
    await expect(page.getByText(/no tienes tareas todavía/i)).toBeVisible();

    await createTask(page, { titulo: 'Comprar café', prioridad: 'alta' });

    const item = taskItem(page, 'Comprar café');
    await expect(item).toBeVisible();
    await expect(item.getByText('Alta')).toBeVisible();
  });

  test('completa, edita y elimina una tarea', async ({ page }) => {
    await createTask(page, { titulo: 'Regar plantas' });
    const item = taskItem(page, 'Regar plantas');

    // completar
    await item.getByRole('checkbox').check();
    await expect(item.getByRole('checkbox')).toBeChecked();

    // editar
    await item.getByRole('button', { name: /editar/i }).click();
    const form = page.getByRole('form', { name: 'Editar tarea' });
    await form.getByLabel('Título').fill('Regar el jardín');
    await form.getByRole('button', { name: /guardar/i }).click();
    await expect(taskItem(page, 'Regar el jardín')).toBeVisible();

    // eliminar
    await taskItem(page, 'Regar el jardín')
      .getByRole('button', { name: /eliminar/i })
      .click();
    await expect(page.getByText('Regar el jardín')).toBeHidden();
  });

  test('persiste tras recargar la página', async ({ page }) => {
    await createTask(page, { titulo: 'Tarea persistente' });
    await page.reload();
    await expect(taskItem(page, 'Tarea persistente')).toBeVisible();
  });
});
