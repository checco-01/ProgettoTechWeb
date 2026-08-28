import { Page, Route, expect } from '@playwright/test';

/**
 * Mock condivisi per gli E2E.
 *
 * Vengono intercettate a livello di rete:
 *  - il backend di gioco (`http://localhost:8080/api/**`)
 *  - l'API di Wikipedia (`https://it.wikipedia.org/w/api.php`)
 *
 * In questo modo i test sono deterministici e non richiedono né il backend
 * reale né una connessione a Wikipedia.
 */

export const TARGET_TITLE = 'Università degli Studi di Napoli Federico II';
// Il titolo reale su Wikipedia contiene la à: senza accento il confronto dei
// titoli normalizzati nel gioco fallirebbe e la vittoria non scatterebbe.
export const TARGET_SLUG = 'Università_degli_Studi_di_Napoli_Federico_II';

interface GameSummary {
  id: number;
  username: string;
  startUrl: string;
  numberOfSteps: number;
  gameStatus: 'InProgress' | 'Completed' | 'Failed';
  timeElapsedSeconds: number;
  createdAt: string;
}

interface LeaderboardEntry {
  position: number;
  username: string;
  completedGames: number;
  averageSteps: number;
}

interface Step {
  stepNumber: number;
  url: string;
}

interface ApiState {
  /** Username "autenticato" lato backend (null = non autenticato). */
  username: string | null;
  /** Credenziali valide per il login (username -> password). */
  validUsers: Record<string, string>;
  nextGameId: number;
  /** Titolo restituito da /w/api.php (random start). */
  startTitle: string;
  inProgress: GameSummary[];
  leaderboard: LeaderboardEntry[];
  searchResults: GameSummary[];
  myGames: GameSummary[];
  gameSteps: Record<number, Step[]>;
  /** Titolo pagina -> HTML grezzo restituito dall'API parse. */
  wikiPages: Record<string, string>;
}

export function createState(overrides: Partial<ApiState> = {}): ApiState {
  return {
    username: null,
    validUsers: { mario: 'secret1' },
    nextGameId: 1,
    startTitle: 'Napoli',
    inProgress: [],
    leaderboard: [],
    searchResults: [],
    myGames: [],
    gameSteps: {},
    wikiPages: {
      Napoli: napoliHtml(),
      [TARGET_SLUG]: targetHtml(),
    },
    ...overrides,
  };
}

const SESSION_COOKIE_NAME = 'session';
const SESSION_COOKIE_VALUE = 'road-to-unina-test';
const SESSION_COOKIE_HEADER = `${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}; Path=/; HttpOnly; SameSite=Lax`;

function hasSessionCookie(request: { headers(): Record<string, string> }): boolean {
  return (request.headers()['cookie'] ?? '').includes(
    `${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}`,
  );
}

/** Cookie di sessione "httpOnly" simulato, usato da loginViaUi. */
const SESSION_COOKIE = {
  name: SESSION_COOKIE_NAME,
  value: SESSION_COOKIE_VALUE,
  domain: 'localhost',
  path: '/',
  httpOnly: true,
} as const;

function currentGame(state: ApiState, id: number): GameSummary | undefined {
  return state.inProgress.find((g) => g.id === id) ?? state.searchResults.find((g) => g.id === id);
}

/** Registra tutti i mock di rete per una pagina. */
export async function mockApi(page: Page, state: ApiState): Promise<void> {
  const fulfillJson = (
    route: Route,
    body: unknown,
    status = 200,
    extraHeaders: Record<string, string> = {},
  ) => route.fulfill({ status, json: body, headers: extraHeaders });

  // ---------------------------------------------------------------- Auth
  await page.route('**/api/auth**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (method === 'GET' && path.endsWith('/me')) {
      if (hasSessionCookie(route.request()) && state.username) {
        await fulfillJson(route, { username: state.username });
      } else {
        await fulfillJson(route, { error: 'Non autenticato' }, 401);
      }
      return;
    }

    if (method === 'POST' && path.endsWith('/login')) {
      const body = route.request().postDataJSON() as { username: string; password: string };
      if (state.validUsers[body.username] === body.password) {
        state.username = body.username;
        await fulfillJson(route, { username: body.username, message: 'Login effettuato' }, 200, {
          'set-cookie': SESSION_COOKIE_HEADER,
        });
      } else {
        await fulfillJson(route, { error: 'Credenziali non valide' }, 401);
      }
      return;
    }

    if (method === 'POST' && path.endsWith('/register')) {
      const body = route.request().postDataJSON() as { username: string; password: string };
      state.username = body.username;
      state.validUsers[body.username] = body.password;
      await fulfillJson(
        route,
        { username: body.username, message: 'Registrazione completata' },
        200,
        {
          'set-cookie': SESSION_COOKIE_HEADER,
        },
      );
      return;
    }

    await fulfillJson(route, { error: 'Non gestito' }, 404);
  });

  // ---------------------------------------------------------------- Game
  await page.route('**/api/game**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    const idMatch = path.match(/^\/api\/game\/(\d+)$/);
    const stepsMatch = path.match(/^\/api\/game\/(\d+)\/steps$/);
    const lastStepMatch = path.match(/^\/api\/game\/(\d+)\/last-step$/);
    const completeMatch = path.match(/^\/api\/game\/(\d+)\/complete$/);
    const stepMatch = path.match(/^\/api\/game\/(\d+)\/step$/);

    // POST /api/game/start
    if (method === 'POST' && path === '/api/game/start') {
      const body = route.request().postDataJSON() as { startUrl: string };
      const game: GameSummary = {
        id: state.nextGameId++,
        username: state.username ?? 'anonimo',
        startUrl: body.startUrl,
        numberOfSteps: 0,
        gameStatus: 'InProgress',
        timeElapsedSeconds: 0,
        createdAt: new Date().toISOString(),
      };
      state.inProgress.push(game);
      await fulfillJson(route, { gameId: game.id, startUrl: game.startUrl });
      return;
    }

    // GET /api/game/in-progress
    if (method === 'GET' && path === '/api/game/in-progress') {
      await fulfillJson(route, state.inProgress);
      return;
    }

    // GET /api/game/my-games
    if (method === 'GET' && path === '/api/game/my-games') {
      await fulfillJson(route, state.myGames);
      return;
    }

    // GET /api/game/leaderboard
    if (method === 'GET' && path === '/api/game/leaderboard') {
      await fulfillJson(route, state.leaderboard);
      return;
    }

    // GET /api/game/search?query=...
    if (method === 'GET' && path === '/api/game/search') {
      await fulfillJson(route, state.searchResults);
      return;
    }

    // GET /api/game/:id/steps
    if (stepsMatch) {
      await fulfillJson(route, state.gameSteps[Number(stepsMatch[1])] ?? []);
      return;
    }

    // GET /api/game/:id/last-step
    if (lastStepMatch) {
      const id = Number(lastStepMatch[1]);
      const game = currentGame(state, id);
      const steps = state.gameSteps[id] ?? [];
      await fulfillJson(route, {
        url: steps.at(-1)?.url ?? game?.startUrl ?? state.startTitle,
        stepNumber: steps.length,
      });
      return;
    }

    // POST /api/game/:id/step
    if (stepMatch) {
      const id = Number(stepMatch[1]);
      const body = route.request().postDataJSON() as { urlTo: string };
      const steps = state.gameSteps[id] ?? (state.gameSteps[id] = []);
      steps.push({ stepNumber: steps.length + 1, url: body.urlTo });
      await fulfillJson(route, {});
      return;
    }

    // POST /api/game/:id/complete
    if (completeMatch) {
      const id = Number(completeMatch[1]);
      const game = currentGame(state, id);
      if (game) game.gameStatus = 'Completed';
      await fulfillJson(route, game ?? emptySummary(id, 'Completed'));
      return;
    }

    // GET /api/game/:id
    if (idMatch) {
      const game = currentGame(state, Number(idMatch[1]));
      if (game) {
        await fulfillJson(route, game);
      } else {
        await fulfillJson(route, { error: 'Partita non trovata' }, 404);
      }
      return;
    }

    await fulfillJson(route, { error: 'Non gestito' }, 404);
  });

  // ---------------------------------------------------------------- Wikipedia
  await page.route('**/w/api.php**', async (route) => {
    const url = new URL(route.request().url());
    const action = url.searchParams.get('action');

    if (action === 'query') {
      await fulfillJson(route, {
        query: { random: [{ id: 1, title: state.startTitle }] },
      });
      return;
    }

    if (action === 'parse') {
      const pageTitle = url.searchParams.get('page') ?? state.startTitle;
      await fulfillJson(route, {
        parse: {
          title: pageTitle,
          text: { '*': state.wikiPages[pageTitle] ?? fallbackHtml(pageTitle) },
        },
      });
      return;
    }

    await fulfillJson(route, { error: 'Non gestito' }, 404);
  });
}

// ---------------------------------------------------------------- Contenuti Wikipedia

function napoliHtml(): string {
  return `<div><h1>Napoli</h1><p>Napoli è un comune italiano di circa 900 000 abitanti.</p><a href="/wiki/${TARGET_SLUG}">Università Federico II</a></div>`;
}

function targetHtml(): string {
  return `<div><h1>${TARGET_TITLE}</h1><p>È l'università più antica d'Europa in forma statale.</p></div>`;
}

function fallbackHtml(title: string): string {
  return `<div><h1>${title}</h1><p>Contenuto di esempio per "${title}".</p></div>`;
}

function emptySummary(id: number, gameStatus: GameSummary['gameStatus']): GameSummary {
  return {
    id,
    username: '',
    startUrl: '',
    numberOfSteps: 0,
    gameStatus,
    timeElapsedSeconds: 0,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------- Helper di flusso

/** Effettua il login tramite l'interfaccia (modale) e attende la sessione attiva. */
export async function loginViaUi(
  page: Page,
  username = 'mario',
  password = 'secret1',
): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Accedi', exact: true }).click();
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.locator('form').getByRole('button', { name: 'Accedi', exact: true }).click();

  // La modale si chiude e la topbar mostra lo username.
  await expect(page.getByText('Bentornato')).toHaveCount(0);
  await expect(page.getByRole('button', { name: username })).toBeVisible();

  // Garantisce il cookie di sessione anche se il browser non lo ha memorizzato
  // dal mock (ad es. per politiche su cookie cross-origin).
  await page.context().addCookies([SESSION_COOKIE]);
}
