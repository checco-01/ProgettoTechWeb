import { test, expect } from '@playwright/test';
import { createState, mockApi, loginViaUi } from './mocks';

test.describe('Home', () => {
  test('mostra la home correttamente per utenti anonimi', async ({ page }) => {
    const state = createState();
    await mockApi(page, state);
    await page.goto('/');

    // Contenuto principale
    await expect(page.getByRole('heading', { name: 'Road to Unina' })).toBeVisible();
    await expect(
      page.getByText('Metti alla prova le tue conoscenze e scala la classifica'),
    ).toBeVisible();

    // Navigazione topbar
    await expect(page.getByRole('button', { name: 'Classifica' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerca Partite' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accedi', exact: true })).toBeVisible();

    // CTA disabilitata per gli anonimi
    await expect(
      page.getByRole('button', { name: /Accedi o Registrati per iniziare a giocare/ }),
    ).toBeDisabled();
  });

  test('effettua il login e abilita il gioco', async ({ page }) => {
    const state = createState();
    await mockApi(page, state);
    await loginViaUi(page, 'mario', 'secret1');

    await expect(page.getByRole('button', { name: 'Esci' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inizia Partita' })).toBeEnabled();
  });
});
