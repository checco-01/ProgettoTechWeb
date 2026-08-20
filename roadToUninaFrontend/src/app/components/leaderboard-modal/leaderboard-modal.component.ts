import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-leaderboard-modal',
  standalone: true,
  templateUrl: './leaderboard-modal.component.html',
  styleUrl: './leaderboard-modal.component.scss',
})
export class LeaderboardModalComponent {
  @Output() close = new EventEmitter<void>();
}
