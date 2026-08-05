import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WikipediaService } from '../../services/wikipedia.service';
import {
  GameService,
  StepRequest,
} from '../../services/game.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  private wikiService = inject(WikipediaService);
  private gameApi = inject(GameService);

  readonly targetPage = signal(this.wikiService.getTargetPage());
  readonly currentTitle = signal<string>('');
  readonly currentHtml = signal<string>('');
  readonly moveCount = signal(0);
  readonly hasWon = signal(false);
  readonly loading = signal(true);
  readonly startTitle = signal<string>('');
  readonly links = signal<string[]>([]);
  readonly elapsedSeconds = signal(0);

  private gameId: number | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private previousTitle: string = '';

  ngOnInit(): void {
    this.wikiService.getRandomStart().subscribe((startTitle) => {
      this.startTitle.set(startTitle);
      this.startGameAndLoad(startTitle);
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private startGameAndLoad(title: string): void {
    this.gameApi.startGame(title).subscribe({
      next: (res) => {
        this.gameId = res.gameId;
        this.startTimer();
        this.loadPage(title);
      },
      error: () => {
        this.loadPage(title);
      },
    });
  }

  loadPage(title: string): void {
    this.loading.set(true);
    this.wikiService.getPage(title).subscribe({
      next: (page) => {
        this.previousTitle = this.currentTitle();
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
      urlFrom: this.previousTitle || this.currentTitle(),
      urlTo: toTitle,
    };

    this.gameApi.recordStep(this.gameId, stepReq).subscribe({
      error: () => {
        /* backend non essenziale, ignora errori */
      },
    });
  }

  private onWin(): void {
    this.hasWon.set(true);
    this.stopTimer();

    if (this.gameId) {
      this.gameApi
        .completeGame(this.gameId, {
          totalSteps: this.moveCount(),
          timeElapsedSeconds: this.elapsedSeconds(),
        })
        .subscribe({
          error: () => {
            /* backend non essenziale */
          },
        });
    }
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds.update((s) => s + 1);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  get formattedTime(): string {
    const secs = this.elapsedSeconds();
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  restart(): void {
    this.moveCount.set(0);
    this.hasWon.set(false);
    this.loading.set(true);
    this.elapsedSeconds.set(0);
    this.gameId = null;
    this.previousTitle = '';

    this.wikiService.getRandomStart().subscribe((title) => {
      this.startTitle.set(title);
      this.startGameAndLoad(title);
    });
  }
}
