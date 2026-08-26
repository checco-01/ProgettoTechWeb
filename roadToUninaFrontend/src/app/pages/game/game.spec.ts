import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameComponent } from './game';
import { WikipediaService } from '../../services/wikipedia.service';
import { GameService } from '../../services/game.service';
import { AuthService } from '../../services/auth.service';

describe('GameComponent', () => {
  let fixture: ComponentFixture<GameComponent>;
  let component: GameComponent;
  let wikiService: {
    getTargetPage: ReturnType<typeof vi.fn>;
    getRandomStart: ReturnType<typeof vi.fn>;
    getPage: ReturnType<typeof vi.fn>;
  };
  let gameService: {
    startGame: ReturnType<typeof vi.fn>;
    recordStep: ReturnType<typeof vi.fn>;
    completeGame: ReturnType<typeof vi.fn>;
    abandonGame: ReturnType<typeof vi.fn>;
    getLastGameStep: ReturnType<typeof vi.fn>;
    getGame: ReturnType<typeof vi.fn>;
  };
  let authService: { logout: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const TARGET = 'Università degli Studi di Napoli Federico II';

  const clickOnAnchor = (href: string): MouseEvent => {
    const anchor = document.createElement('a');
    anchor.href = href;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'target', { value: anchor });
    return event;
  };

  beforeEach(async () => {
    wikiService = {
      getTargetPage: vi.fn(() => TARGET),
      getRandomStart: vi.fn(),
      getPage: vi.fn(),
    };
    gameService = {
      startGame: vi.fn(),
      recordStep: vi.fn(),
      completeGame: vi.fn(),
      abandonGame: vi.fn(),
      getLastGameStep: vi.fn(),
      getGame: vi.fn(),
    };
    authService = { logout: vi.fn() };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [GameComponent],
      providers: [
        { provide: WikipediaService, useValue: wikiService },
        { provide: GameService, useValue: gameService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  const startNewGame = (): void => {
    wikiService.getRandomStart.mockReturnValue(of('Napoli'));
    gameService.startGame.mockReturnValue(of({ gameId: 1, startUrl: 'Napoli' }));
    gameService.recordStep.mockReturnValue(of({}));
    wikiService.getPage.mockReturnValue(
      of({ title: 'Napoli', html: '<p>ciao</p>', links: ['Italia'] }),
    );
  };

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should start a new game on init', () => {
    startNewGame();
    fixture.detectChanges();

    expect(wikiService.getRandomStart).toHaveBeenCalled();
    expect(gameService.startGame).toHaveBeenCalledWith('Napoli');
    expect(component.moveCount()).toBe(0);
    expect(component.loading()).toBe(false);
    expect(component.links()).toEqual(['Italia']);
  });

  it('should detect the win when the loaded page is the target', () => {
    wikiService.getRandomStart.mockReturnValue(of(TARGET));
    gameService.startGame.mockReturnValue(of({ gameId: 1, startUrl: TARGET }));
    wikiService.getPage.mockReturnValue(of({ title: TARGET, html: '<p>x</p>', links: [] }));
    gameService.completeGame.mockReturnValue(of({}));

    fixture.detectChanges();

    expect(component.hasWon()).toBe(true);
    expect(gameService.completeGame).toHaveBeenCalledWith(1);
  });

  it('should increment the move counter when clicking a valid wiki link', () => {
    startNewGame();
    fixture.detectChanges();

    component.onContentClick(clickOnAnchor('./wiki/Italia'));

    expect(gameService.recordStep).toHaveBeenCalledWith(1, 'Italia');
    expect(component.moveCount()).toBe(1);
    expect(wikiService.getPage).toHaveBeenCalledWith('Italia');
  });

  it('should prevent default navigation on any link click', () => {
    startNewGame();
    fixture.detectChanges();

    const event = clickOnAnchor('./wiki/Italia');
    component.onContentClick(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('should ignore clicks on links not present in the page links', () => {
    startNewGame();
    fixture.detectChanges();

    component.onContentClick(clickOnAnchor('./wiki/Roma'));

    expect(gameService.recordStep).not.toHaveBeenCalled();
    expect(component.moveCount()).toBe(0);
  });

  it('should retry loading a page up to 3 times then show an error', () => {
    wikiService.getRandomStart.mockReturnValue(of('Napoli'));
    gameService.startGame.mockReturnValue(of({ gameId: 1, startUrl: 'Napoli' }));
    wikiService.getPage.mockReturnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(wikiService.getPage).toHaveBeenCalledTimes(3);
    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toContain('Impossibile caricare la pagina');
  });

  it('should roll back the move counter when recording a step fails', () => {
    startNewGame();
    fixture.detectChanges();

    gameService.recordStep.mockReturnValue(throwError(() => ({ status: 500 })));
    component.onContentClick(clickOnAnchor('./wiki/Italia'));

    expect(component.moveCount()).toBe(0);
  });

  it('should redirect to login when starting a game returns 401', () => {
    wikiService.getRandomStart.mockReturnValue(of('Napoli'));
    gameService.startGame.mockReturnValue(throwError(() => ({ status: 401 })));

    fixture.detectChanges();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/'], { queryParams: { auth: 'login' } });
  });

  it('should abandon the game and navigate home', () => {
    startNewGame();
    gameService.abandonGame.mockReturnValue(of({}));
    fixture.detectChanges();

    component.abandon();

    expect(gameService.abandonGame).toHaveBeenCalledWith(1);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should update the elapsed time with the timer', () => {
    vi.useFakeTimers();
    startNewGame();
    fixture.detectChanges();

    expect(component.elapsedTime()).toBe('0:00');

    vi.advanceTimersByTime(65_000);
    expect(component.elapsedTime()).toBe('1:05');
  });

  it('should start a new game when startNewGame is called', () => {
    startNewGame();
    fixture.detectChanges();
    expect(wikiService.getRandomStart).toHaveBeenCalledTimes(1);

    component.moveCount.set(5);
    component.startNewGame();

    expect(wikiService.getRandomStart).toHaveBeenCalledTimes(2);
    expect(component.moveCount()).toBe(0);
    expect(component.hasWon()).toBe(false);
    expect(component.loading()).toBe(false);
  });
});

describe('GameComponent with gameId query param', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let wikiService: {
    getTargetPage: ReturnType<typeof vi.fn>;
    getRandomStart: ReturnType<typeof vi.fn>;
    getPage: ReturnType<typeof vi.fn>;
  };
  let gameService: {
    startGame: ReturnType<typeof vi.fn>;
    recordStep: ReturnType<typeof vi.fn>;
    completeGame: ReturnType<typeof vi.fn>;
    abandonGame: ReturnType<typeof vi.fn>;
    getLastGameStep: ReturnType<typeof vi.fn>;
    getGame: ReturnType<typeof vi.fn>;
  };
  let authService: { logout: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    wikiService = {
      getTargetPage: vi.fn(() => 'Università degli Studi di Napoli Federico II'),
      getRandomStart: vi.fn(),
      getPage: vi.fn(),
    };
    gameService = {
      startGame: vi.fn(),
      recordStep: vi.fn(),
      completeGame: vi.fn(),
      abandonGame: vi.fn(),
      getLastGameStep: vi.fn(),
      getGame: vi.fn(),
    };
    authService = { logout: vi.fn() };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [GameComponent],
      providers: [
        { provide: WikipediaService, useValue: wikiService },
        { provide: GameService, useValue: gameService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: { get: (k: string) => (k === 'gameId' ? '7' : null) },
            },
          },
        },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('should resume the game when gameId is present', () => {
    gameService.getLastGameStep.mockReturnValue(of({ url: 'Napoli', stepNumber: 3 }));
    gameService.getGame.mockReturnValue(
      of({
        id: 7,
        username: 'mario',
        startUrl: 'Napoli',
        numberOfSteps: 3,
        gameStatus: 'InProgress',
        timeElapsedSeconds: 10,
        createdAt: '2026-01-01T10:00:00',
      }),
    );
    wikiService.getPage.mockReturnValue(of({ title: 'Napoli', html: '<p>x</p>', links: [] }));

    fixture.detectChanges();

    expect(gameService.getLastGameStep).toHaveBeenCalledWith(7);
    expect(gameService.getGame).toHaveBeenCalledWith(7);
    expect(component.moveCount()).toBe(3);
    expect(component.loading()).toBe(false);
    expect(wikiService.getRandomStart).not.toHaveBeenCalled();
  });

  it('should show an error when the game cannot be resumed', () => {
    gameService.getLastGameStep.mockReturnValue(throwError(() => ({ status: 404 })));

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toContain('Impossibile riprendere la partita');
  });
});
