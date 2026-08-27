import { test, expect } from '@playwright/test';
import { createState, mockApi } from './mocks';

test.describe('Auth', () => {
  test.beforeEach(async ({ page }) => {
    // Pulisce cookie e storage: ogni test parte da una sessione anonima pulita.
    await page.context().clearCookies();
    await page.addInitScript(() => localStorage.clear());
  });

  test('login con credenziali corrette', async ({ page }) => {
    const state = createState({ validUsers: { mario: 'secret1' } });
    await mockApi(page, state);

    await page.goto('/login');

    await page.getByLabel('Username').fill('mario');
    await page.getByLabel('Password', { exact: true }).fill('secret1');
    await page.locator('form').getByRole('button', { name: 'Accedi', exact: true }).click();

    await expect(page.getByRole('button', { name: 'mario' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Esci' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inizia Partita' })).toBeEnabled();

    await expect(page.getByRole('button', { name: 'Accedi', exact: true })).toHaveCount(0);

    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'session' && c.httpOnly)).toBeTruthy();
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('login con credenziali errate mostra errore', async ({ page }) => {
    const state = createState({ validUsers: { mario: 'secret1' } });
    await mockApi(page, state);

    await page.goto('/login');
    await page.getByLabel('Username').fill('mario');
    await page.getByLabel('Password', { exact: true }).fill('password-sbagliata');
    await page.locator('form').getByRole('button', { name: 'Accedi', exact: true }).click();

    await expect(page.getByText('Credenziali non valide')).toBeVisible();
    await expect(page.getByText('Bentornato')).toBeVisible();

    await expect(page.getByRole('button', { name: 'mario' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Esci' })).toHaveCount(0);

    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'session')).toBeFalsy();
  });

  test('registra un nuovo utente e lo autentica', async ({ page }) => {
    const state = createState();
    await mockApi(page, state);

    await page.goto('/login');
    await page.getByRole('button', { name: 'Registrati', exact: true }).click();
    await expect(page.getByText('Crea un Account')).toBeVisible();

    await page.getByLabel('Username').fill('mario');
    await page.getByLabel('Password', { exact: true }).fill('secret1');
    await page.getByLabel('Conferma Password').fill('secret1');
    await page
      .locator('form')
      .getByRole('button', { name: 'Registrati', exact: true })
      .click();

    await expect(page.getByText('Crea un Account')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'mario' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Esci' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inizia Partita' })).toBeEnabled();
  });

  test('registrazione con due password non uguali ritorna errore', async ({ page }) => {
    const state = createState();
    await mockApi(page, state);

    await page.goto('/login');
    await page.getByRole('button', { name: 'Registrati', exact: true }).click();
    await expect(page.getByText('Crea un Account')).toBeVisible();

    // Compila il form con password diverse
    await page.getByLabel('Username').fill('mario');
    await page.getByLabel('Password', { exact: true }).fill('secret1');
    await page.getByLabel('Conferma Password').fill('secret2');
    await page.getByLabel('Conferma Password').blur();

    // Errore di mismatch visibile
    await expect(page.getByText('Le password non corrispondono')).toBeVisible();

    // L'utente non viene registrato: la modale resta aperta, nessun cookie
    await expect(page.getByText('Crea un Account')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Esci' })).toHaveCount(0);

    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'session')).toBeFalsy();
  });
});
