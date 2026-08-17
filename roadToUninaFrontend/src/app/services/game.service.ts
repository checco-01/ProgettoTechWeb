import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StartGameResponse {
  gameId: number;
  startUrl: string;
}

export interface StepRequest {
  urlFrom: string;
  urlTo: string;
}

export interface StepResponse {
  url: string;
  stepNumber: number;
}

export interface CompleteGameRequest {
  totalSteps: number;
  totalTime: number;
}

export interface GameSummaryResponse {
  id: number;
  startUrl: string;
  numberOfSteps: number;
  gameStatus: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private apiUrl = 'http://localhost:8080/api/game';

  constructor(private http: HttpClient) {}

  startGame(startUrl: string): Observable<StartGameResponse> {
    return this.http.post<StartGameResponse>(`${this.apiUrl}/start`, {
      startUrl,
    });
  }

  recordStep(gameId: number, request: StepRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${gameId}/step`, request);
  }

  completeGame(gameId: number, request: CompleteGameRequest): Observable<GameSummaryResponse> {
    return this.http.post<GameSummaryResponse>(`${this.apiUrl}/${gameId}/complete`, request);
  }

  abandonGame(gameId: number): Observable<GameSummaryResponse> {
    return this.http.post<GameSummaryResponse>(`${this.apiUrl}/${gameId}/abandon`, {});
  }

  getInProgressGames(): Observable<GameSummaryResponse[]> {
    return this.http.get<GameSummaryResponse[]>(`${this.apiUrl}/in-progress`);
  }

  getLastGameStep(gameId: number): Observable<StepResponse> {
    return this.http.get<StepResponse>(`${this.apiUrl}/${gameId}/last-step`);
  }

  getGame(gameId: number): Observable<GameSummaryResponse> {
    return this.http.get<GameSummaryResponse>(`${this.apiUrl}/${gameId}`);
  }
}
