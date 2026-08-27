import { Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { WikipediaService } from '../../services/wikipedia.service';
import { GameService } from '../../services/game.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  private wikiService = inject(WikipediaService);
  private gameService = inject(GameService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  readonly targetPage = signal(this.wikiService.getTargetPage());
  readonly currentHtml = signal<string>('');
  readonly moveCount = signal(0);
  readonly hasWon = signal(false);
  readonly loading = signal(true);
  readonly startTitle = signal<string>('');
  readonly links = signal<string[]>([]);
  readonly elapsedTime = signal('0:00');
  readonly errorMessage = signal<string>('');

  private gameId: number | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private gameCreatedAt: Date | null = null;
  private loadPageAttempts = 0;

  ngOnInit(): void {
    // La pagina di gioco dipende da API browser (timer, DOM, chiamate HTTP):
    // se viene eseguita lato server (prerender/SSR) non facciamo nulla.
    if (!isPlatformBrowser(this.platformId)) return;

    const gameIdParam = this.route.snapshot.queryParamMap.get('gameId');
    if (gameIdParam) {
      this.resumeGame(Number(gameIdParam));
    } else {
      this.wikiService.getRandomStart().subscribe((startTitle) => {
        this.startTitle.set(startTitle);
        this.startGameAndLoad(startTitle);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private resumeGame(gameId: number): void {
    forkJoin({
      step: this.gameService.getLastGameStep(gameId),
      game: this.gameService.getGame(gameId),
    }).subscribe({
      next: ({ step, game }) => {
        this.gameId = gameId;
        this.startTitle.set(step.url);
        this.moveCount.set(step.stepNumber);
        this.gameCreatedAt = new Date(game.createdAt);
        this.startTimer();
        this.loadPage(step.url);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set(
          'Impossibile riprendere la partita: non esiste o non appartiene al tuo account.',
        );
      },
    });
  }

  private startGameAndLoad(title: string): void {
    this.gameService.startGame(title).subscribe({
      next: (res) => {
        this.gameId = res.gameId;
        this.gameCreatedAt = new Date();
        this.startTimer();
        this.loadPage(title);
      },
      error: (err) => this.handleApiError(err, 'Impossibile creare la partita sul server'),
    });
  }
  private handleApiError(err: any, fallbackMessage: string): void {
    if (err.status === 401 || err.status === 403) {
      this.handleAuthError();
      return;
    }
    this.errorMessage.set(fallbackMessage + (err.status ? ` (HTTP ${err.status})` : ''));
    this.loading.set(false);
  }

  private handleAuthError(): void {
    this.authService.logout();
    this.router.navigate(['/'], { queryParams: { auth: 'login' } });
  }

  loadPage(title: string): void {
    this.loading.set(true);
    this.wikiService.getPage(title).subscribe({
      next: (page) => {
        this.loadPageAttempts = 0;
        this.currentHtml.set(page.html);
        this.links.set(page.links);
        this.loading.set(false);

        const normalizedTitle = page.title.replace(/_/g, ' ');
        const normalizedTarget = this.targetPage().replace(/_/g, ' ');
        if (normalizedTitle === normalizedTarget) {
          this.onWin();
        }
      },
      error: () => {
        this.loadPageAttempts++;
        this.loading.set(false);
        if (this.loadPageAttempts >= 3) {
          this.errorMessage.set(`Impossibile caricare la pagina "${title}" da Wikipedia.`);
          return;
        }
        this.loadPage(title);
      },
    });
  }

  onContentClick(event: Event): void {
    if (this.hasWon()) return;

    const target = event.target as HTMLElement;
    const anchor = target.closest('a');
    if (!anchor) return;

    // Blocca sempre la navigazione di default: nessun click su un link
    // (anche esterno, es. fonti/bibliografia) deve aprire un'altra pagina
    event.preventDefault();

    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('./wiki/')) return;

    const title = decodeURIComponent(href.replace('./wiki/', ''));
    if (title && this.links().includes(title)) {
      this.moveCount.update((c) => c + 1);
      this.recordStep(title);
      this.loadPage(title);
    }
  }

  private recordStep(toTitle: string): void {
    if (!this.gameId) return;

    this.gameService.recordStep(this.gameId, toTitle).subscribe({
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.handleAuthError();
          return;
        }
        // Rollback: lo step non è stato salvato dal backend, il contatore
        // frontend deve restare allineato a numberOfSteps.
        this.moveCount.update((c) => Math.max(0, c - 1));
      },
    });
  }

  private onWin(): void {
    this.hasWon.set(true);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.gameId) {
      this.gameService.completeGame(this.gameId).subscribe({
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            this.handleAuthError();
          }
        },
      });
    }
  }

  abandon(): void {
    if (this.gameId) {
      this.gameService.abandonGame(this.gameId).subscribe({
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            this.handleAuthError();
          }
        },
      });
    }
    this.router.navigate(['/']);
  }

  /**
   * Torna alla home senza abbandonare la partita: la partita resta in corso
   * sul backend e potrà essere ripresa dalla modale di ripresa in home.
   */
  backToHome(): void {
    this.router.navigate(['/']);
  }

  private startTimer(): void {
    if (this.timerInterval) return;
    this.updateElapsedTime();
    this.timerInterval = setInterval(() => {
      this.updateElapsedTime();
    }, 1000);
  }

  private updateElapsedTime(): void {
    this.elapsedTime.set(this.formatSeconds(this.getElapsedSeconds()));
  }

  private getElapsedSeconds(): number {
    if (!this.gameCreatedAt) return 0;
    return Math.floor((Date.now() - this.gameCreatedAt.getTime()) / 1000);
  }

  private formatSeconds(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  startNewGame(): void {
    this.moveCount.set(0);
    this.hasWon.set(false);
    this.loading.set(true);
    this.errorMessage.set('');
    this.elapsedTime.set('0:00');
    this.gameId = null;
    this.gameCreatedAt = null;
    this.loadPageAttempts = 0;

    this.wikiService.getRandomStart().subscribe((title) => {
      this.startTitle.set(title);
      this.startGameAndLoad(title);
    });
  }
}
