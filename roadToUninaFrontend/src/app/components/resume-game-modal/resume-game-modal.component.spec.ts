import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ResumeGameModalComponent } from './resume-game-modal.component';
import { GameSummaryResponse } from '../../services/game.service';

describe('ResumeGameModalComponent', () => {
  let fixture: ComponentFixture<ResumeGameModalComponent>;
  let component: ResumeGameModalComponent;

  const makeGame = (id: number, createdAt = '2026-01-01T00:00:00'): GameSummaryResponse => ({
    id,
    username: 'mario',
    startUrl: 'Napoli',
    numberOfSteps: 2,
    gameStatus: 'InProgress',
    timeElapsedSeconds: 60,
    createdAt,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeGameModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumeGameModalComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should disable the "Nuova Partita" button when the limit is reached', () => {
    component.games = [makeGame(1), makeGame(2), makeGame(3)];
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '.btn.btn-secondary',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.tooltip-text')).toBeTruthy();
  });

  it('should render one card per in-progress game', () => {
    component.games = [makeGame(1), makeGame(2)];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.resume-game-info').length).toBe(2);
  });

  it('should emit resume with the game id', () => {
    component.games = [makeGame(1)];
    fixture.detectChanges();

    const spy = vi.fn();
    component.resume.subscribe(spy);

    const buttons = fixture.nativeElement.querySelectorAll('.resume-game-actions .btn');
    (buttons[0] as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalledWith(1);
  });

  it('should emit abandon with the game', () => {
    const game = makeGame(1);
    component.games = [game];
    fixture.detectChanges();

    const spy = vi.fn();
    component.abandon.subscribe(spy);

    const buttons = fixture.nativeElement.querySelectorAll('.resume-game-actions .btn');
    (buttons[1] as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalledWith(game);
  });

  it('should emit newGame', () => {
    component.games = [];
    fixture.detectChanges();

    const spy = vi.fn();
    component.newGame.subscribe(spy);

    (fixture.nativeElement.querySelector('.btn.btn-secondary') as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalled();
  });

  it('getElapsedTime should format the seconds elapsed since creation', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:01:30'));

    expect(component.getElapsedTime('2026-01-01T00:00:00')).toBe('1:30');
    expect(component.getElapsedTime('2026-01-01T00:00:05')).toBe('1:25');
  });

  it('should emit close when clicking the close button', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);

    (fixture.nativeElement.querySelector('.modal-close') as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalled();
  });
});
