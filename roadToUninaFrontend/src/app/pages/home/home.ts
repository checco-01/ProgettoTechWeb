import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthModalComponent } from '../../components/auth-modal/auth-modal.component';
import { LeaderboardModalComponent } from '../../components/leaderboard-modal/leaderboard-modal.component';
import { SearchGameModalComponent } from '../../components/search-game-modal/search-game-modal.component';
import { ResumeGameModalComponent } from '../../components/resume-game-modal/resume-game-modal.component';
import {
  GameService,
  GameSummaryResponse,
} from '../../services/game.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    AuthModalComponent,
    LeaderboardModalComponent,
    SearchGameModalComponent,
    ResumeGameModalComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private gameService = inject(GameService);

  showSearchModal = signal(false);
  showLeaderboardModal = signal(false);
  showAuthModal = signal(false);
  showResumeModal = signal(false);
  authMode = signal<'login' | 'register'>('login');
  inProgressGames = signal<GameSummaryResponse[]>([]);

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get username(): string | null {
    return this.authService.getUsername();
  }

  ngOnInit(): void {
    const mode = this.route.snapshot.queryParamMap.get('auth');
    if (mode === 'login' || mode === 'register') {
      this.authMode.set(mode);
      this.showAuthModal.set(true);
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  openSearchModal(): void {
    this.showSearchModal.set(true);
  }

  openLeaderboardModal(): void {
    this.showLeaderboardModal.set(true);
  }

  openAuthModal(mode: 'login' | 'register' = 'login'): void {
    this.authMode.set(mode);
    this.showAuthModal.set(true);
  }

  closeModals(): void {
    this.showSearchModal.set(false);
    this.showLeaderboardModal.set(false);
    this.showAuthModal.set(false);
    this.showResumeModal.set(false);
  }

  onAuthenticated(): void {
    this.showAuthModal.set(false);
  }

  startOrResumeGame(): void {
    this.gameService.getInProgressGames().subscribe({
      next: (games) => {
        this.inProgressGames.set(games);
        if (games.length > 0) {
          this.showResumeModal.set(true);
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
        this.inProgressGames.set(
          this.inProgressGames().filter((g) => g.id !== game.id),
        );
        if (this.inProgressGames().length === 0) {
          this.showResumeModal.set(false);
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

  logout(): void {
    this.authService.logout();
  }
}
