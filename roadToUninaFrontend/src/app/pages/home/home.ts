import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthModalComponent } from '../../components/auth-modal/auth-modal.component';
import {
  GameService,
  GameSummaryResponse,
} from '../../services/game.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, AuthModalComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private gameService = inject(GameService);

  showSearchModal = false;
  showLeaderboardModal = false;
  showAuthModal = false;
  showResumeModal = false;
  authMode: 'login' | 'register' = 'login';
  inProgressGames: GameSummaryResponse[] = [];

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get username(): string | null {
    return this.authService.getUsername();
  }

  ngOnInit(): void {
    const mode = this.route.snapshot.queryParamMap.get('auth');
    if (mode === 'login' || mode === 'register') {
      this.authMode = mode;
      this.showAuthModal = true;
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  openSearchModal(): void {
    this.showSearchModal = true;
  }

  openLeaderboardModal(): void {
    this.showLeaderboardModal = true;
  }

  openAuthModal(mode: 'login' | 'register' = 'login'): void {
    this.authMode = mode;
    this.showAuthModal = true;
  }

  closeModals(): void {
    this.showSearchModal = false;
    this.showLeaderboardModal = false;
    this.showAuthModal = false;
    this.showResumeModal = false;
  }

  onAuthenticated(): void {
    this.showAuthModal = false;
  }

  startOrResumeGame(): void {
    this.gameService.getInProgressGames().subscribe({
      next: (games) => {
        this.inProgressGames = games;
        if (games.length > 0) {
          this.showResumeModal = true;
        } else {
          this.router.navigate(['/game']);
        }
      },
      error: (err) => {
        // Sessione scaduta o non valida: torna al login
        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.router.navigate(['/'], { queryParams: { auth: 'login' } });
          return;
        }
        this.router.navigate(['/game']);
      },
    });
  }

  resumeGame(gameId: number): void {
    this.router.navigate(['/game'], { queryParams: { gameId } });
  }

  startNewGame(): void {
    // Non abbandona le partite in corso: restano disponibili per la ripresa
    this.router.navigate(['/game']);
  }

  abandonGame(game: GameSummaryResponse): void {
    this.gameService.abandonGame(game.id).subscribe({
      next: () => {
        this.inProgressGames = this.inProgressGames.filter((g) => g.id !== game.id);
        if (this.inProgressGames.length === 0) {
          this.showResumeModal = false;
        }
      },
      error: (err) => {
        // Sessione scaduta o non valida: torna al login
        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.router.navigate(['/'], { queryParams: { auth: 'login' } });
        }
      },
    });
  }

  getElapsedTime(createdAt: string): string {
    if (!createdAt) return '0s';
    const created = new Date(createdAt);
    const elapsed = Math.floor((Date.now() - created.getTime()) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  logout(): void {
    this.authService.logout();
  }
}
