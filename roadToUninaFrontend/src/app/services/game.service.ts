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
  stepNumber: number;
  target: boolean;
}

export interface CompleteGameRequest {
  totalSteps: number;
  timeElapsedSeconds: number;
}

export interface GameSummaryResponse {
  id: number;
  startUrl: string;
  numberOfSteps: number;
  timeElapsedSeconds: number;
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

  recordStep(
    gameId: number,
    request: StepRequest
  ): Observable<StepResponse> {
    return this.http.post<StepResponse>(
      `${this.apiUrl}/${gameId}/step`,
      request
    );
  }

  completeGame(
    gameId: number,
    request: CompleteGameRequest
  ): Observable<GameSummaryResponse> {
    return this.http.post<GameSummaryResponse>(
      `${this.apiUrl}/${gameId}/complete`,
      request
    );
  }

  getActiveGame(): Observable<GameSummaryResponse | null> {
    return this.http.get<GameSummaryResponse>(`${this.apiUrl}/active`);
  }
}
