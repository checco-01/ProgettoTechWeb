import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { GameService, GameSummaryResponse, StepResponse } from '../../services/game.service';

@Component({
  selector: 'app-user-summary-sidebar',
  standalone: true,
  templateUrl: './user-summary-sidebar.component.html',
  styleUrl: './user-summary-sidebar.component.scss',
})
export class UserSummarySidebarComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  private authService = inject(AuthService);
  private gameService = inject(GameService);

  isLoading = signal(true);
  error = signal('');
  games = signal<GameSummaryResponse[]>([]);

  expandedGameId = signal<number | null>(null);
  steps = signal<StepResponse[]>([]);
  isLoadingSteps = signal(false);
  stepsError = signal('');

  ngOnInit(): void {
    this.loadGames();
  }

  get username(): string | null {
    return this.authService.getUsername();
  }

  get completedGames(): GameSummaryResponse[] {
    return this.games().filter((g) => g.gameStatus === 'Completed');
  }

  get failedGames(): GameSummaryResponse[] {
    return this.games().filter((g) => g.gameStatus === 'Failed');
  }

  get inProgressGames(): GameSummaryResponse[] {
    return this.games().filter((g) => g.gameStatus === 'InProgress');
  }

  loadGames(): void {
    this.isLoading.set(true);
    this.error.set('');
    this.gameService.getMyGames().subscribe({
      next: (games) => {
        this.games.set(games);
        this.isLoading.set(false);
      },
      error: () => {
        this.games.set([]);
        this.isLoading.set(false);
        this.error.set('Impossibile caricare il riepilogo delle tue partite.');
      },
    });
  }

  togglePath(gameId: number): void {
    if (this.expandedGameId() === gameId) {
      this.expandedGameId.set(null);
      this.steps.set([]);
      return;
    }

    this.expandedGameId.set(gameId);
    this.steps.set([]);
    this.stepsError.set('');
    this.isLoadingSteps.set(true);

    this.gameService.getGameSteps(gameId).subscribe({
      next: (steps) => {
        this.steps.set(steps);
        this.isLoadingSteps.set(false);
      },
      error: () => {
        this.steps.set([]);
        this.isLoadingSteps.set(false);
        this.stepsError.set('Impossibile caricare il percorso della partita.');
      },
    });
  }

  getFormattedTime(timeElapsedSeconds: number): string {
    if (timeElapsedSeconds == null) return '—';
    const m = Math.floor(timeElapsedSeconds / 60);
    const s = timeElapsedSeconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }

  getFormattedDate(createdAt: string): string {
    if (!createdAt) return '—';
    return new Date(createdAt).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatStepUrl(url: string): string {
    if (!url) return '(inizio)';
    return url.replace(/_/g, ' ');
  }
}
