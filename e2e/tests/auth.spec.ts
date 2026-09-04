import { expect, test } from '@playwright/test';
import { registerAndLogin, uniqueUser } from './helpers.js';

test.describe('autenticación', () => {
  test('redirige a /login cuando no hay sesión', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('registro → dashboard → logout → login', async ({ page }) => {
    const user = uniqueUser();

    await registerAndLogin(page, user);
    await expect(page.getByText(user.username)).toBeVisible();

    await page.getByRole('button', { name: 'Salir' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Contraseña').fill(user.password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByRole('heading', { name: 'Mis tareas' })).toBeVisible();
  });

  test('muestra un error con credenciales incorrectas', async ({ page }) => {
    const user = uniqueUser();
    await registerAndLogin(page, user);
    await page.getByRole('button', { name: 'Salir' }).click();

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Contraseña').fill('WrongPass9!');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByRole('alert')).toContainText(/incorrect/i);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('valida el formulario de registro', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/\/register$/);
  });
});
