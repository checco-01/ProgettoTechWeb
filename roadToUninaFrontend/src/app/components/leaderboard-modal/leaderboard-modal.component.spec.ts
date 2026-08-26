import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { LeaderboardModalComponent } from './leaderboard-modal.component';
import { GameService, LeaderboardEntryResponse } from '../../services/game.service';

describe('LeaderboardModalComponent', () => {
  let fixture: ComponentFixture<LeaderboardModalComponent>;
  let component: LeaderboardModalComponent;
  let gameService: { getLeaderboard: ReturnType<typeof vi.fn> };

  const entries: LeaderboardEntryResponse[] = [
    { position: 1, username: 'mario', completedGames: 10, averageSteps: 4.56 },
    { position: 2, username: 'anna', completedGames: 7, averageSteps: 5 },
    { position: 3, username: 'luigi', completedGames: 5, averageSteps: 6.25 },
    { position: 4, username: 'peach', completedGames: 2, averageSteps: 8 },
  ];

  const setup = (leaderboard$: Observable<LeaderboardEntryResponse[]>): void => {
    gameService.getLeaderboard.mockReturnValue(leaderboard$);
    fixture = TestBed.createComponent(LeaderboardModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    gameService = { getLeaderboard: vi.fn(() => of([])) };

    await TestBed.configureTestingModule({
      imports: [LeaderboardModalComponent],
      providers: [{ provide: GameService, useValue: gameService }],
    }).compileComponents();
  });

  it('should create the component', () => {
    setup(of([]));
    expect(component).toBeTruthy();
  });

  it('should load and render the entries on init', () => {
    setup(of(entries));

    expect(gameService.getLeaderboard).toHaveBeenCalled();
    expect(component.entries()).toEqual(entries);
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe('');

    const rows = fixture.nativeElement.querySelectorAll('.leaderboard-row');
    expect(rows.length).toBe(4);
  });

  it('should show an error message when the request fails', () => {
    setup(throwError(() => new Error('boom')));

    expect(component.isLoading()).toBe(false);
    expect(component.entries()).toEqual([]);
    expect(component.error()).toContain('Impossibile caricare la classifica');
  });

  it('should show the empty state when there are no entries', () => {
    setup(of([]));

    const msg = fixture.nativeElement.querySelector('.leaderboard-message');
    expect(msg.textContent).toContain('Nessuna sfida completata');
  });

  it('medalClass should return the correct class for the top 3 positions', () => {
    setup(of([]));
    expect(component.medalClass(1)).toBe('leaderboard-medal--gold');
    expect(component.medalClass(2)).toBe('leaderboard-medal--silver');
    expect(component.medalClass(3)).toBe('leaderboard-medal--bronze');
    expect(component.medalClass(4)).toBe('');
  });

  it('should emit close when clicking the close button', () => {
    setup(of([]));
    const spy = vi.fn();
    component.close.subscribe(spy);

    (fixture.nativeElement.querySelector('.modal-close') as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalled();
  });
});
