import { expect, test } from '@playwright/test';
import { createTask, registerAndLogin, taskItem, uniqueUser } from './helpers.js';

test.describe('dashboard de estadísticas', () => {
  test('refleja los totales y el desglose por prioridad', async ({ page }) => {
    await registerAndLogin(page, uniqueUser());

    await createTask(page, { titulo: 'Para estadísticas', prioridad: 'alta' });
    await taskItem(page, 'Para estadísticas')
      .getByRole('checkbox', { name: /completada/i })
      .check();
    await createTask(page, { titulo: 'Pendiente', prioridad: 'alta' });

    await page.getByRole('button', { name: 'Estadísticas', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Estadísticas' })).toBeVisible();

    await expect(page.getByText('Total de tareas')).toBeVisible();
    await expect(page.getByText('Por prioridad')).toBeVisible();
    await expect(page.getByRole('img', { name: /^Alta: 2 tareas/ })).toBeVisible();

    await page.getByRole('button', { name: '← Volver a tareas' }).click();
    await expect(page.getByRole('heading', { name: 'Mis tareas' })).toBeVisible();
  });
});

test.describe('actualizaciones en tiempo real', () => {
  test('una tarea creada en una pestaña aparece sola en la otra', async ({ context }) => {
    const user = uniqueUser();

    const tabA = await context.newPage();
    await registerAndLogin(tabA, user);

    // Same browser context → same localStorage → the second tab is already
    // authenticated, exactly like opening a second tab of the same session.
    const tabB = await context.newPage();
    await tabB.goto('/');
    await expect(tabB.getByRole('heading', { name: 'Mis tareas' })).toBeVisible();

    await createTask(tabA, { titulo: 'Creada en la pestaña A' });

    // No reload on tabB — this only appears via the realtime Socket.IO push.
    await expect(taskItem(tabB, 'Creada en la pestaña A')).toBeVisible({ timeout: 5000 });
  });

  test('completar una tarea en una pestaña la sincroniza en la otra', async ({ context }) => {
    const user = uniqueUser();

    const tabA = await context.newPage();
    await registerAndLogin(tabA, user);
    await createTask(tabA, { titulo: 'Compartida' });

    const tabB = await context.newPage();
    await tabB.goto('/');
    await expect(taskItem(tabB, 'Compartida')).toBeVisible();

    await taskItem(tabA, 'Compartida')
      .getByRole('checkbox', { name: /completada/i })
      .check();

    await expect(
      taskItem(tabB, 'Compartida').getByRole('checkbox', { name: /pendiente/i }),
    ).toBeChecked({ timeout: 5000 });
  });
});
