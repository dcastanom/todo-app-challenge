import { expect, type Page } from '@playwright/test';

export interface TestUser {
  email: string;
  username: string;
  password: string;
}

export function uniqueUser(): TestUser {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return { email: `e2e-${id}@example.com`, username: `e2e_${id}`, password: 'Passw0rd!' };
}

/** Registers a new account and lands on the dashboard. */
export async function registerAndLogin(page: Page, user: TestUser): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Usuario').fill(user.username);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Contraseña').fill(user.password);
  await page.getByRole('button', { name: /crear cuenta/i }).click();
  await expect(page.getByRole('heading', { name: 'Mis tareas' })).toBeVisible();
}

export async function createTask(
  page: Page,
  fields: { titulo: string; prioridad?: string; categoria?: string },
): Promise<void> {
  await page.getByRole('button', { name: '+ Nueva tarea' }).click();
  const form = page.getByRole('form', { name: 'Nueva tarea' });
  await form.getByLabel('Título').fill(fields.titulo);
  if (fields.prioridad) await form.getByLabel('Prioridad').selectOption(fields.prioridad);
  if (fields.categoria)
    await form.getByLabel('Categoría').selectOption({ label: fields.categoria });
  await form.getByRole('button', { name: /crear tarea/i }).click();
  await expect(form).toBeHidden();
}

export function taskItem(page: Page, titulo: string) {
  return page.getByRole('listitem').filter({ hasText: titulo });
}
