import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { GameService } from './game.service';

describe('GameService', () => {
  let service: GameService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GameService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start a game with the given startUrl', () => {
    let result: unknown;
    service.startGame('Napoli').subscribe((r) => (result = r));

    const req = httpMock.expectOne('http://localhost:8080/api/game/start');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ startUrl: 'Napoli' });
    req.flush({ gameId: 1, startUrl: 'Napoli' });

    expect(result).toEqual({ gameId: 1, startUrl: 'Napoli' });
  });

  it('should record a step for a game', () => {
    service.recordStep(5, 'Italia').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/game/5/step');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ urlTo: 'Italia' });
    req.flush(null);
  });

  it('should complete a game', () => {
    let result: unknown;
    service.completeGame(5).subscribe((r) => (result = r));

    const req = httpMock.expectOne('http://localhost:8080/api/game/5/complete');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 5 });

    expect(result).toEqual({ id: 5 });
  });

  it('should abandon a game', () => {
    service.abandonGame(5).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/game/5/abandon');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ id: 5 });
  });

  it('should get the in-progress games', () => {
    service.getInProgressGames().subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/game/in-progress');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get the user games', () => {
    service.getMyGames().subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/game/my-games');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should search games passing the query param', () => {
    service.searchGames('mario').subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === 'http://localhost:8080/api/game/search' &&
        r.params.get('query') === 'mario',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get the leaderboard', () => {
    service.getLeaderboard().subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/game/leaderboard');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get the steps of a game', () => {
    service.getGameSteps(5).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/game/5/steps');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get the last step of a game', () => {
    let result: unknown;
    service.getLastGameStep(5).subscribe((r) => (result = r));

    const req = httpMock.expectOne('http://localhost:8080/api/game/5/last-step');
    expect(req.request.method).toBe('GET');
    req.flush({ url: 'Napoli', stepNumber: 3 });

    expect(result).toEqual({ url: 'Napoli', stepNumber: 3 });
  });

  it('should get a single game by id', () => {
    service.getGame(5).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/game/5');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 5 });
  });
});
