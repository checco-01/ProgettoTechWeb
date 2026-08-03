import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthModalComponent } from '../../components/auth-modal/auth-modal.component';

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

  showSearchModal = false;
  showLeaderboardModal = false;
  showAuthModal = false;
  authMode: 'login' | 'register' = 'login';

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
      // Pulisci il query param senza ricaricare
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
    this.showAuthModal = false;
  }

  onAuthenticated(): void {
    this.showAuthModal = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
