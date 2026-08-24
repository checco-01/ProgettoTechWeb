import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  username: string;
  message: string;
}

export interface SessionResponse {
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private currentUser = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  register(data: AuthRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(tap((response) => this.currentUser.set(response.username)));
  }

  login(data: AuthRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(tap((response) => this.currentUser.set(response.username)));
  }

  logout(): void {
    this.currentUser.set(null);
    // Il cookie httpOnly viene eliminato dal backend: il JS non può cancellarlo da solo.
    this.http.post<void>(`${this.apiUrl}/logout`, {}).subscribe({ error: () => {} });
  }

  /** Verifica la sessione sul backend (/me): il token è nel cookie httpOnly, non nel JS. */
  checkSession(): Observable<boolean> {
    return this.http.get<SessionResponse>(`${this.apiUrl}/me`).pipe(
      tap((response) => this.currentUser.set(response.username)),
      map(() => true),
      catchError(() => {
        this.currentUser.set(null);
        return of(false);
      }),
    );
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  getUsername(): string | null {
    return this.currentUser();
  }
}
