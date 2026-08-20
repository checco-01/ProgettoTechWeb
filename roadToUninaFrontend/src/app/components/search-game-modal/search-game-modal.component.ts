import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { GameService, GameSummaryResponse, StepResponse } from '../../services/game.service';

@Component({
  selector: 'app-search-game-modal',
  standalone: true,
  templateUrl: './search-game-modal.component.html',
  styleUrl: './search-game-modal.component.scss',
})
export class SearchGameModalComponent {
  @Output() close = new EventEmitter<void>();

  private gameService = inject(GameService);

  searchQuery = signal('');
  results = signal<GameSummaryResponse[]>([]);
  isLoading = signal(false);
  hasSearched = signal(false);
  error = signal('');

  expandedGameId = signal<number | null>(null);
  steps = signal<StepResponse[]>([]);
  isLoadingSteps = signal(false);
  stepsError = signal('');

  onSearch(): void {
    const query = this.searchQuery().trim();
    if (!query) {
      this.error.set('Inserisci un codice partita o uno username');
      return;
    }

    this.error.set('');
    this.hasSearched.set(true);
    this.isLoading.set(true);

    this.gameService.searchGames(query).subscribe({
      next: (games) => {
        this.results.set(games);
        this.isLoading.set(false);
      },
      error: () => {
        this.results.set([]);
        this.isLoading.set(false);
        this.error.set('Si è verificato un errore durante la ricerca. Riprova.');
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

  formatStepUrl(url: string): string {
    if (!url) return '(inizio)';
    return url.replace(/_/g, ' ');
  }
}
