import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HomeComponent } from './home';
import { AuthService } from '../../services/auth.service';
import { GameService, GameSummaryResponse } from '../../services/game.service';

const makeGame = (id: number): GameSummaryResponse => ({
  id,
  username: 'mario',
  startUrl: 'Napoli',
  numberOfSteps: 2,
  gameStatus: 'InProgress',
  timeElapsedSeconds: 60,
  createdAt: '2026-01-01T10:00:00',
});

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let authService: {
    checkSession: ReturnType<typeof vi.fn>;
    isLoggedIn: ReturnType<typeof vi.fn>;
    getUsername: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let gameService: {
    getInProgressGames: ReturnType<typeof vi.fn>;
    abandonGame: ReturnType<typeof vi.fn>;
    getLeaderboard: ReturnType<typeof vi.fn>;
    getMyGames: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigate: ReturnType<typeof vi.fn>;
    createUrlTree: ReturnType<typeof vi.fn>;
    serializeUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      checkSession: vi.fn(() => of(true)),
      isLoggedIn: vi.fn(() => false),
      getUsername: vi.fn(() => null),
      logout: vi.fn(),
    };
    gameService = {
      getInProgressGames: vi.fn(() => of([])),
      abandonGame: vi.fn(() => of({})),
      getLeaderboard: vi.fn(() => of([])),
      getMyGames: vi.fn(() => of([])),
    };
    router = {
      navigate: vi.fn(),
      createUrlTree: vi.fn(() => null),
      serializeUrl: vi.fn(() => ''),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: GameService, useValue: gameService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should check the session on init', () => {
    fixture.detectChanges();
    expect(authService.checkSession).toHaveBeenCalled();
  });

  it('should show "Accedi" and hide "Esci" when logged out', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Accedi');
    expect(text).not.toContain('Esci');
  });

  it('should show the username and "Esci" when logged in', () => {
    authService.isLoggedIn.mockReturnValue(true);
    authService.getUsername.mockReturnValue('mario');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('mario');
    expect(text).toContain('Esci');
  });

  it('should open the search modal', () => {
    component.openSearchModal();
    expect(component.showSearchModal()).toBe(true);
  });

  it('should open and close the leaderboard modal', () => {
    component.openLeaderboardModal();
    expect(component.showLeaderboardModal()).toBe(true);

    component.closeModals();
    expect(component.showLeaderboardModal()).toBe(false);
    expect(component.showSearchModal()).toBe(false);
    expect(component.showAuthModal()).toBe(false);
    expect(component.showResumeModal()).toBe(false);
  });

  it('should open the auth modal in the requested mode', () => {
    component.openAuthModal('register');
    expect(component.authMode()).toBe('register');
    expect(component.showAuthModal()).toBe(true);
  });

  it('should toggle and close the user sidebar', () => {
    component.toggleUserSidebar();
    expect(component.showUserSidebar()).toBe(true);
    component.toggleUserSidebar();
    expect(component.showUserSidebar()).toBe(false);
    component.closeUserSidebar();
    expect(component.showUserSidebar()).toBe(false);
  });

  it('should close the auth modal on authentication', () => {
    component.openAuthModal();
    expect(component.showAuthModal()).toBe(true);

    component.onAuthenticated();
    expect(component.showAuthModal()).toBe(false);
  });

  it('should navigate to /game when there are no in-progress games', () => {
    component.startOrResumeGame();

    expect(gameService.getInProgressGames).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/game']);
    expect(component.showResumeModal()).toBe(false);
  });

  it('should show the resume modal when there are in-progress games', () => {
    const games = [makeGame(1), makeGame(2)];
    gameService.getInProgressGames.mockReturnValue(of(games));
    component.startOrResumeGame();

    expect(component.showResumeModal()).toBe(true);
    expect(component.inProgressGames()).toEqual(games);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when the session is expired', () => {
    gameService.getInProgressGames.mockReturnValue(throwError(() => ({ status: 401 })));
    component.startOrResumeGame();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/'], { queryParams: { auth: 'login' } });
  });

  it('should resume a game navigating with the gameId', () => {
    component.resumeGame(42);
    expect(router.navigate).toHaveBeenCalledWith(['/game'], { queryParams: { gameId: 42 } });
  });

  it('should start a new game', () => {
    component.startNewGame();
    expect(router.navigate).toHaveBeenCalledWith(['/game']);
  });

  it('should remove an abandoned game from the list', () => {
    const games = [makeGame(1), makeGame(2)];
    component.inProgressGames.set(games);

    component.abandonGame(games[0]);

    expect(gameService.abandonGame).toHaveBeenCalledWith(1);
    expect(component.inProgressGames()).toEqual([games[1]]);
  });

  it('should close the resume modal when the last game is abandoned', () => {
    component.inProgressGames.set([makeGame(1)]);
    component.showResumeModal.set(true);

    component.abandonGame(component.inProgressGames()[0]);

    expect(component.inProgressGames()).toEqual([]);
    expect(component.showResumeModal()).toBe(false);
  });

  it('should redirect to login when abandoning fails with an auth error', () => {
    gameService.abandonGame.mockReturnValue(throwError(() => ({ status: 403 })));
    component.inProgressGames.set([makeGame(1)]);

    component.abandonGame(component.inProgressGames()[0]);

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/'], { queryParams: { auth: 'login' } });
  });

  it('should logout', () => {
    component.logout();
    expect(authService.logout).toHaveBeenCalled();
  });
});

describe('HomeComponent with ?auth=login query param', () => {
  let component: HomeComponent;
  let router: {
    navigate: ReturnType<typeof vi.fn>;
    createUrlTree: ReturnType<typeof vi.fn>;
    serializeUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    router = { navigate: vi.fn(), createUrlTree: vi.fn(() => null), serializeUrl: vi.fn(() => '') };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            checkSession: vi.fn(() => of(true)),
            isLoggedIn: vi.fn(() => false),
            getUsername: vi.fn(() => null),
            logout: vi.fn(),
          },
        },
        {
          provide: GameService,
          useValue: {
            getInProgressGames: vi.fn(() => of([])),
            abandonGame: vi.fn(() => of({})),
            getLeaderboard: vi.fn(() => of([])),
            getMyGames: vi.fn(() => of([])),
          },
        },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => 'login' } } },
        },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should open the auth modal in login mode and clear the query params', () => {
    expect(component.showAuthModal()).toBe(true);
    expect(component.authMode()).toBe('login');
    expect(router.navigate).toHaveBeenCalledWith([], { queryParams: {}, replaceUrl: true });
  });
});
