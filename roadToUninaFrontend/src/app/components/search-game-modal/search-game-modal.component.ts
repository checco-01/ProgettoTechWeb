import { Component, EventEmitter, Output, signal } from '@angular/core';

@Component({
  selector: 'app-search-game-modal',
  standalone: true,
  templateUrl: './search-game-modal.component.html',
  styleUrl: './search-game-modal.component.scss',
})
export class SearchGameModalComponent {
  @Output() close = new EventEmitter<void>();

  searchQuery = signal('');

  onSearch(): void {
    // TODO: implementare la ricerca delle partite per codice o username
  }
}
