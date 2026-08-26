import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SearchGameModalComponent } from './search-game-modal.component';
import { GameService, GameSummaryResponse, StepResponse } from '../../services/game.service';

describe('SearchGameModalComponent', () => {
  let fixture: ComponentFixture<SearchGameModalComponent>;
  let component: SearchGameModalComponent;
  let gameService: {
    searchGames: ReturnType<typeof vi.fn>;
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
  ];

  const steps: StepResponse[] = [
    { url: 'Napoli', stepNumber: 1 },
    { url: 'Campania', stepNumber: 2 },
  ];

  beforeEach(async () => {
    gameService = {
      searchGames: vi.fn(),
      getGameSteps: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SearchGameModalComponent],
      providers: [{ provide: GameService, useValue: gameService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchGameModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show an error when searching with an empty query', () => {
    component.searchQuery.set('   ');
    component.onSearch();

    expect(component.error()).toBe('Inserisci un codice partita o uno username');
    expect(component.hasSearched()).toBe(false);
    expect(gameService.searchGames).not.toHaveBeenCalled();
  });

  it('should search and store the results', () => {
    gameService.searchGames.mockReturnValue(of(games));
    component.searchQuery.set('mario');
    component.onSearch();

    expect(gameService.searchGames).toHaveBeenCalledWith('mario');
    expect(component.results()).toEqual(games);
    expect(component.hasSearched()).toBe(true);
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe('');
  });

  it('should handle search errors', () => {
    gameService.searchGames.mockReturnValue(throwError(() => new Error('boom')));
    component.searchQuery.set('mario');
    component.onSearch();

    expect(component.results()).toEqual([]);
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toContain('errore durante la ricerca');
  });

  it('should show the no-results message when the search returns nothing', () => {
    gameService.searchGames.mockReturnValue(of([]));
    component.searchQuery.set('xyz');
    component.onSearch();
    fixture.detectChanges();

    const msg = fixture.nativeElement.querySelector('.search-message');
    expect(msg.textContent).toContain('Nessuna partita completata trovata');
  });

  it('should render the found games', () => {
    gameService.searchGames.mockReturnValue(of(games));
    component.searchQuery.set('mario');
    component.onSearch();
    fixture.detectChanges();

    const results = fixture.nativeElement.querySelectorAll('.search-result');
    expect(results.length).toBe(1);
    expect(results[0].textContent).toContain('#1');
    expect(results[0].textContent).toContain('mario');
  });

  it('should load steps when expanding a game path', () => {
    gameService.getGameSteps.mockReturnValue(of(steps));
    component.togglePath(1);

    expect(gameService.getGameSteps).toHaveBeenCalledWith(1);
    expect(component.expandedGameId()).toBe(1);
    expect(component.steps()).toEqual(steps);
    expect(component.isLoadingSteps()).toBe(false);
    expect(component.stepsError()).toBe('');
  });

  it('should handle errors while loading the steps', () => {
    gameService.getGameSteps.mockReturnValue(throwError(() => new Error('boom')));
    component.togglePath(1);

    expect(component.expandedGameId()).toBe(1);
    expect(component.isLoadingSteps()).toBe(false);
    expect(component.stepsError()).toContain('Impossibile caricare il percorso');
  });

  it('should emit close when clicking the overlay', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);

    (fixture.nativeElement.querySelector('.modal-overlay') as HTMLElement).click();

    expect(spy).toHaveBeenCalled();
  });
});
