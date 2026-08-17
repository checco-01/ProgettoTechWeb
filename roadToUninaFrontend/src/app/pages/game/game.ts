import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { WikipediaService } from '../../services/wikipedia.service';
import { GameService, StepRequest } from '../../services/game.service';
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

  readonly targetPage = signal(this.wikiService.getTargetPage());
  readonly currentTitle = signal<string>('');
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

  ngOnInit(): void {
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
      error: (err) =>
        this.handleApiError(err, 'Impossibile creare la partita sul server'),
    });
  }
  private handleApiError(err: any, fallbackMessage: string): void {
    if (err.status === 401 || err.status === 403) {
      this.authService.logout();
      window.location.href = '/?auth=login';
      return;
    }
    this.errorMessage.set(
      fallbackMessage + (err.status ? ` (HTTP ${err.status})` : ''),
    );
    this.loading.set(false);
  }

  loadPage(title: string): void {
    this.loading.set(true);
    this.wikiService.getPage(title).subscribe({
      next: (page) => {
        this.currentTitle.set(page.title);
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
        this.loading.set(false);
        this.loadPage(title);
      },
    });
  }

  onContentClick(event: Event): void {
    if (this.hasWon()) return;

    const target = event.target as HTMLElement;
    const anchor = target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('./wiki/')) return;

    event.preventDefault();

    const title = decodeURIComponent(href.replace('./wiki/', ''));
    if (title && this.links().includes(title)) {
      this.moveCount.update((c) => c + 1);
      this.recordStep(title);
      this.loadPage(title);
    }
  }

  private recordStep(toTitle: string): void {
    if (!this.gameId) return;

    const stepReq: StepRequest = {
      urlFrom: this.currentTitle(),
      urlTo: toTitle,
    };

    this.gameService.recordStep(this.gameId, stepReq).subscribe({
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          window.location.href = '/?auth=login';
        }
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
      this.gameService
        .completeGame(this.gameId, {
          totalSteps: this.moveCount(),
          totalTime: this.getElapsedSeconds(),
        })
        .subscribe({
          error: (err) => {
            if (err.status === 401 || err.status === 403) {
              this.authService.logout();
              window.location.href = '/?auth=login';
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
            this.authService.logout();
          }
        },
      });
    }
    window.location.href = '/';
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

  restart(): void {
    this.moveCount.set(0);
    this.hasWon.set(false);
    this.loading.set(true);
    this.errorMessage.set('');
    this.elapsedTime.set('0:00');
    this.gameId = null;
    this.gameCreatedAt = null;

    this.wikiService.getRandomStart().subscribe((title) => {
      this.startTitle.set(title);
      this.startGameAndLoad(title);
    });
  }
}
