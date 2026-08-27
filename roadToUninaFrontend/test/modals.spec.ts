import { test, expect } from '@playwright/test';
import { createState, mockApi, loginViaUi, TARGET_TITLE, TARGET_SLUG } from './mocks';

test.describe('Modali', () => {
  test('mostra la classifica dei migliori giocatori', async ({ page }) => {
    const state = createState({
      leaderboard: [
        { position: 1, username: 'luca', completedGames: 10, averageSteps: 3.5 },
        { position: 2, username: 'mario', completedGames: 7, averageSteps: 4.2 },
        { position: 3, username: 'anna', completedGames: 5, averageSteps: 5.1 },
      ],
    });
    await mockApi(page, state);
    await page.goto('/');

    await page.getByRole('button', { name: 'Classifica' }).click();

    await expect(page.getByRole('heading', { name: 'Classifica' })).toBeVisible();
    await expect(page.getByText('I 10 migliori navigatori di Wikipedia')).toBeVisible();

    // Tre righe con posizione, utente, sfide e percorso medio
    const rows = page.locator('.leaderboard-row');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0).locator('.leaderboard-col--pos')).toHaveText('1');
    await expect(rows.nth(0).locator('.leaderboard-col--user')).toHaveText('luca');
    await expect(rows.nth(0).locator('.leaderboard-col--games')).toHaveText('10');
    await expect(rows.nth(0).locator('.leaderboard-col--steps')).toHaveText('3,5 passi');
    await expect(rows.nth(1).locator('.leaderboard-col--user')).toHaveText('mario');
    await expect(rows.nth(1).locator('.leaderboard-col--games')).toHaveText('7');
    await expect(rows.nth(2).locator('.leaderboard-col--user')).toHaveText('anna');
    await expect(rows.nth(2).locator('.leaderboard-col--steps')).toHaveText('5,1 passi');

    // I primi tre hanno la medaglia
    await expect(page.locator('.leaderboard-medal')).toHaveCount(3);
  });

  test('mostra il riepilogo utente con le mosse medie', async ({ page }) => {
    const state = createState({
      myGames: [
        {
          id: 1,
          username: 'mario',
          startUrl: 'Napoli',
          numberOfSteps: 3,
          gameStatus: 'Completed',
          timeElapsedSeconds: 180,
          createdAt: '2026-08-20T10:30:00',
        },
        {
          id: 2,
          username: 'mario',
          startUrl: 'Roma',
          numberOfSteps: 6,
          gameStatus: 'Completed',
          timeElapsedSeconds: 300,
          createdAt: '2026-08-21T10:30:00',
        },
        {
          id: 3,
          username: 'mario',
          startUrl: 'Milano',
          numberOfSteps: 2,
          gameStatus: 'InProgress',
          timeElapsedSeconds: 60,
          createdAt: '2026-08-22T10:30:00',
        },
      ],
    });
    await mockApi(page, state);
    await loginViaUi(page);

    // Apre la sidebar dal nome utente in topbar
    await page.getByRole('button', { name: 'mario' }).click();
    await expect(page.getByText('Riepilogo partite')).toBeVisible();

    // Vinte 2, abbandonate 0, in corso 1, mosse medie (3+6)/2 = 4,5
    const cards = page.locator('.summary-card');
    await expect(cards).toHaveCount(4);
    await expect(cards.nth(0)).toContainText('Vinte');
    await expect(cards.nth(0)).toContainText('2');
    await expect(cards.nth(1)).toContainText('Abbandonate');
    await expect(cards.nth(1)).toContainText('0');
    await expect(cards.nth(2)).toContainText('In corso');
    await expect(cards.nth(2)).toContainText('1');
    await expect(cards.nth(3)).toContainText('Mosse medie');
    await expect(cards.nth(3)).toContainText('4,5');
  });

  test('cerca una partita e ne espande il percorso', async ({ page }) => {
    const state = createState({
      searchResults: [
        {
          id: 42,
          username: 'mario',
          startUrl: 'Napoli',
          numberOfSteps: 4,
          gameStatus: 'Completed',
          timeElapsedSeconds: 300,
          createdAt: '2026-08-20T10:30:00',
        },
      ],
      gameSteps: {
        42: [
          { stepNumber: 1, url: 'Napoli' },
          { stepNumber: 2, url: 'Campania' },
          { stepNumber: 3, url: 'Italia' },
          { stepNumber: 4, url: TARGET_SLUG },
        ],
      },
    });
    await mockApi(page, state);
    await page.goto('/');

    await page.getByRole('button', { name: 'Cerca Partite' }).click();
    await expect(page.getByRole('heading', { name: 'Lista partite' })).toBeVisible();

    await page.getByPlaceholder('Cerca per codice partita o username...').fill('mario');
    await page.getByRole('button', { name: 'Cerca', exact: true }).click();

    await expect(page.getByText('1 partita trovata')).toBeVisible();
    await expect(page.locator('.search-result-value--code')).toHaveText('#42');
    await expect(page.getByText('mario')).toBeVisible();

    // La riga "Mosse" mostra il numero di passi
    const result = page.locator('.search-result');
    const mosseRow = result.locator('.search-result-row', { hasText: 'Mosse:' });
    await expect(mosseRow.locator('.search-result-value')).toHaveText('4');

    // Espandi il percorso della partita
    await page.getByRole('button', { name: /Percorso/ }).click();
    await expect(page.getByText('Campania')).toBeVisible();
    await expect(page.getByText('Italia')).toBeVisible();
    await expect(page.getByText(TARGET_TITLE)).toBeVisible();
  });
});
