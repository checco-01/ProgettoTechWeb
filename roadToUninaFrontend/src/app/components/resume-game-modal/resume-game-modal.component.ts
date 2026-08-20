import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameSummaryResponse } from '../../services/game.service';

@Component({
  selector: 'app-resume-game-modal',
  standalone: true,
  templateUrl: './resume-game-modal.component.html',
  styleUrl: './resume-game-modal.component.scss',
})
export class ResumeGameModalComponent {
  @Input() games: GameSummaryResponse[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() resume = new EventEmitter<number>();
  @Output() abandon = new EventEmitter<GameSummaryResponse>();
  @Output() newGame = new EventEmitter<void>();

  getElapsedTime(createdAt: string): string {
    if (!createdAt) return '0s';
    const created = new Date(createdAt);
    const elapsed = Math.floor((Date.now() - created.getTime()) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
