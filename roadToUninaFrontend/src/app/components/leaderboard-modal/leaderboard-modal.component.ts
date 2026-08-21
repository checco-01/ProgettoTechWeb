import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { GameService, LeaderboardEntryResponse } from '../../services/game.service';

@Component({
  selector: 'app-leaderboard-modal',
  standalone: true,
  templateUrl: './leaderboard-modal.component.html',
  styleUrl: './leaderboard-modal.component.scss',
})
export class LeaderboardModalComponent {
  @Output() close = new EventEmitter<void>();

  private gameService = inject(GameService);

  entries = signal<LeaderboardEntryResponse[]>([]);
  isLoading = signal(true);
  error = signal('');

  constructor() {
    this.gameService.getLeaderboard().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.isLoading.set(false);
      },
      error: () => {
        this.entries.set([]);
        this.isLoading.set(false);
        this.error.set('Impossibile caricare la classifica. Riprova più tardi.');
      },
    });
  }

  medalClass(position: number): string {
    if (position === 1) return 'leaderboard-medal--gold';
    if (position === 2) return 'leaderboard-medal--silver';
    if (position === 3) return 'leaderboard-medal--bronze';
    return '';
  }

  formatAverageSteps(steps: number): string {
    if (steps == null) return '—';
    return (Math.round(steps * 10) / 10).toString().replace('.', ',');
  }
}
