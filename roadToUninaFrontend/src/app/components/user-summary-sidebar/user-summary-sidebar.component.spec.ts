import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserSummarySidebarComponent } from './user-summary-sidebar.component';
import { AuthService } from '../../services/auth.service';
import { GameService, GameSummaryResponse } from '../../services/game.service';

describe('UserSummarySidebarComponent', () => {
  let fixture: ComponentFixture<UserSummarySidebarComponent>;
  let component: UserSummarySidebarComponent;
  let authService: { getUsername: ReturnType<typeof vi.fn> };
  let gameService: {
    getMyGames: ReturnType<typeof vi.fn>;
    getGameSteps: ReturnType<typeof vi.fn>;
  };

  const games: GameSummaryResponse[] = [
    {
      id: 1,
      username: 'mario',
      startUrl: 'Napoli',
      numberOfSteps: 3,
      gameStatus: 'Completed',
      timeElapsedSeconds: 120,
      createdAt: '2026-01-01T10:00:00',
    },
    {
      id: 2,
      username: 'mario',
      startUrl: 'Italia',
      numberOfSteps: 1,
      gameStatus: 'Failed',
      timeElapsedSeconds: 30,
      createdAt: '2026-01-02T10:00:00',
    },
    {
      id: 3,
      username: 'mario',
      startUrl: 'Europa',
      numberOfSteps: 0,
      gameStatus: 'InProgress',
      timeElapsedSeconds: 10,
      createdAt: '2026-01-03T10:00:00',
    },
  ];

  beforeEach(async () => {
    authService = { getUsername: vi.fn(() => 'mario') };
    gameService = {
      getMyGames: vi.fn(() => of([])),
      getGameSteps: vi.fn(() => of([])),
    };

    await TestBed.configureTestingModule({
      imports: [UserSummarySidebarComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: GameService, useValue: gameService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserSummarySidebarComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load the games on init and expose the grouped lists', () => {
    gameService.getMyGames.mockReturnValue(of(games));
    fixture.detectChanges();

    expect(gameService.getMyGames).toHaveBeenCalled();
    expect(component.games()).toEqual(games);
    expect(component.isLoading()).toBe(false);
    expect(component.completedGames).toEqual([games[0]]);
    expect(component.failedGames).toEqual([games[1]]);
    expect(component.inProgressGames).toEqual([games[2]]);
  });


  it('should show an error message when loading fails', () => {
    gameService.getMyGames.mockReturnValue(throwError(() => new Error('boom')));
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.games()).toEqual([]);
    expect(component.error()).toContain('Impossibile caricare il riepilogo');
  });

  it('should show the empty state when the user has no games', () => {
    fixture.detectChanges();

    const msg = fixture.nativeElement.querySelector('.sidebar-message');
    expect(msg.textContent).toContain('Non hai ancora giocato');
  });

  it('should render the summary cards with the correct counters', () => {
    gameService.getMyGames.mockReturnValue(of(games));
    fixture.detectChanges();

    const values = fixture.nativeElement.querySelectorAll('.summary-card-value');
    expect(values[0].textContent).toBe('1'); // vinte
    expect(values[1].textContent).toBe('1'); // abbandonate
    expect(values[2].textContent).toBe('1'); // in corso
  });

  it('should load steps when expanding a game path', () => {
    gameService.getMyGames.mockReturnValue(of(games));
    gameService.getGameSteps.mockReturnValue(of([{ url: 'Napoli', stepNumber: 1 }]));
    fixture.detectChanges();

    component.togglePath(1);

    expect(gameService.getGameSteps).toHaveBeenCalledWith(1);
    expect(component.expandedGameId()).toBe(1);
    expect(component.steps()).toHaveLength(1);
    expect(component.isLoadingSteps()).toBe(false);
  });

  it('should collapse the path when toggling the same game', () => {
    gameService.getMyGames.mockReturnValue(of(games));
    fixture.detectChanges();

    component.expandedGameId.set(1);
    component.steps.set([{ url: 'Napoli', stepNumber: 1 }]);
    component.togglePath(1);

    expect(component.expandedGameId()).toBeNull();
    expect(component.steps()).toEqual([]);
    expect(gameService.getGameSteps).not.toHaveBeenCalled();
  });

  it('should handle errors while loading the steps', () => {
    gameService.getMyGames.mockReturnValue(of(games));
    gameService.getGameSteps.mockReturnValue(throwError(() => new Error('boom')));
    fixture.detectChanges();

    component.togglePath(1);

    expect(component.isLoadingSteps()).toBe(false);
    expect(component.stepsError()).toContain('Impossibile caricare il percorso');
  });

  it('should emit close when clicking the overlay', () => {
    fixture.detectChanges();

    const spy = vi.fn();
    component.close.subscribe(spy);

    (fixture.nativeElement.querySelector('.sidebar-overlay') as HTMLElement).click();

    expect(spy).toHaveBeenCalled();
  });
});
