import { test, expect } from '@playwright/test';
import { createState, mockApi, loginViaUi, TARGET_TITLE } from './mocks';

test.describe('Gioco', () => {
  test('il guard reindirizza gli utenti non autenticati al login', async ({ page }) => {
    const state = createState(); // nessun cookie di sessione
    await mockApi(page, state);

    // /game -> /me risponde 401 -> redirect verso /?auth=login -> modale aperta
    await page.goto('/game');
    await expect(page.getByText('Bentornato')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.locator('.game-topbar')).toHaveCount(0);
  });

  test('vince la partita raggiungendo la pagina obiettivo', async ({ page }) => {
    const state = createState();
    await mockApi(page, state);
    await loginViaUi(page);

    await page.getByRole('button', { name: 'Inizia Partita' }).click();

    // "Napoli" contiene il link all'obiettivo: clicca per arrivarci
    await expect(page.locator('.game-moves-count')).toHaveText('0');
    await page.getByRole('link', { name: 'Università Federico II' }).click();

    // Overlay di vittoria con il riepilogo
    await expect(page.getByText('Hai vinto!')).toBeVisible();
    await expect(page.locator('.game-moves-count')).toHaveText('1');
    await expect(page.getByText('Partendo da Napoli in')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nuova Partita' })).toBeVisible();
  });

  test('torna alla home senza abbandonare la partita in corso', async ({ page }) => {
    const state = createState();
    await mockApi(page, state);
    await loginViaUi(page);

    await page.getByRole('button', { name: 'Inizia Partita' }).click();
    await expect(page.locator('.game-moves-count')).toHaveText('0');

    // Il pulsante "Torna indietro" in alto a sinistra riporta alla home
    await page.getByRole('button', { name: 'Torna indietro' }).click();
    await expect(page.locator('.game-topbar')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Inizia Partita' })).toBeVisible();

    // La partita NON è stata abbandonata: la modale di ripresa la propone
    await page.getByRole('button', { name: 'Inizia Partita' }).click();
    await expect(page.getByText('Hai una partita in corso!')).toBeVisible();
    const info = page.locator('.resume-game-info');
    await expect(info).toContainText('Mosse:');
    await expect(info).toContainText('0');
  });

  test('riprende una partita in corso', async ({ page }) => {
    const state = createState({
      inProgress: [
        {
          id: 1,
          username: 'mario',
          startUrl: 'Napoli',
          numberOfSteps: 2,
          gameStatus: 'InProgress',
          timeElapsedSeconds: 120,
          createdAt: new Date().toISOString(),
        },
      ],
      gameSteps: {
        1: [
          { stepNumber: 1, url: 'Napoli' },
          { stepNumber: 2, url: 'Campania' },
        ],
      },
    });
    await mockApi(page, state);
    await loginViaUi(page);

    // Con una partita in corso, "Inizia Partita" apre la modale di ripresa
    await page.getByRole('button', { name: 'Inizia Partita' }).click();
    await expect(page.getByText('Hai una partita in corso!')).toBeVisible();

    const info = page.locator('.resume-game-info');
    await expect(info).toContainText('Partenza:');
    await expect(info).toContainText('Napoli');
    await expect(info).toContainText('Mosse:');
    await expect(info).toContainText('2');

    // Riprendi -> si continua dall'ultimo step, con il contatore mosse salvato
    await page.getByRole('button', { name: 'Riprendi' }).click();
    await expect(page.locator('.game-moves-count')).toHaveText('2');
    await expect(page.locator('.game-target-name')).toHaveText(TARGET_TITLE);
    await expect(page.getByText('Contenuto di esempio per "Campania".')).toBeVisible();
  });
});
