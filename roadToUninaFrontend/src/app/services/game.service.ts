import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StartGameResponse {
  gameId: number;
  startUrl: string;
}

export interface StepResponse {
  url: string;
  stepNumber: number;
}

export interface GameSummaryResponse {
  id: number;
  username: string;
  startUrl: string;
  numberOfSteps: number;
  gameStatus: string;
  timeElapsedSeconds: number;
  createdAt: string;
}

export interface LeaderboardEntryResponse {
  position: number;
  username: string;
  completedGames: number;
  averageSteps: number;
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private apiUrl = 'http://localhost:8080/api/game';

  constructor(private http: HttpClient) {}

  startGame(): Observable<StartGameResponse> {
    return this.http.post<StartGameResponse>(`${this.apiUrl}/start`, null);
  }

  recordStep(gameId: number, urlTo: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${gameId}/step`, { urlTo });
  }

  completeGame(gameId: number): Observable<GameSummaryResponse> {
    return this.http.post<GameSummaryResponse>(`${this.apiUrl}/${gameId}/complete`, null);
  }

  abandonGame(gameId: number): Observable<GameSummaryResponse> {
    return this.http.post<GameSummaryResponse>(`${this.apiUrl}/${gameId}/abandon`, {});
  }

  getInProgressGames(): Observable<GameSummaryResponse[]> {
    return this.http.get<GameSummaryResponse[]>(`${this.apiUrl}/in-progress`);
  }

  getMyGames(): Observable<GameSummaryResponse[]> {
    return this.http.get<GameSummaryResponse[]>(`${this.apiUrl}/my-games`);
  }

  searchGames(query: string): Observable<GameSummaryResponse[]> {
    return this.http.get<GameSummaryResponse[]>(`${this.apiUrl}/search`, {
      params: { query },
    });
  }

  getLeaderboard(): Observable<LeaderboardEntryResponse[]> {
    return this.http.get<LeaderboardEntryResponse[]>(`${this.apiUrl}/leaderboard`);
  }

  getGameSteps(gameId: number): Observable<StepResponse[]> {
    return this.http.get<StepResponse[]>(`${this.apiUrl}/${gameId}/steps`);
  }

  getLastGameStep(gameId: number): Observable<StepResponse> {
    return this.http.get<StepResponse>(`${this.apiUrl}/${gameId}/last-step`);
  }

  getGame(gameId: number): Observable<GameSummaryResponse> {
    return this.http.get<GameSummaryResponse>(`${this.apiUrl}/${gameId}`);
  }
}
