import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login and store the username', () => {
    let result: unknown;
    service.login({ username: 'mario', password: 'secret1' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'mario', password: 'secret1' });
    req.flush({ username: 'mario', message: 'ok' });

    expect(result).toEqual({ username: 'mario', message: 'ok' });
    expect(service.getUsername()).toBe('mario');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should register and store the username', () => {
    let result: unknown;
    service.register({ username: 'anna', password: 'secret1' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('http://localhost:8080/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'anna', password: 'secret1' });
    req.flush({ username: 'anna', message: 'ok' });

    expect(result).toEqual({ username: 'anna', message: 'ok' });
    expect(service.getUsername()).toBe('anna');
  });

  it('should logout and clear the current user', () => {
    service.login({ username: 'mario', password: 'secret1' }).subscribe();
    httpMock
      .expectOne('http://localhost:8080/api/auth/login')
      .flush({ username: 'mario', message: 'ok' });
    expect(service.isLoggedIn()).toBe(true);

    service.logout();
    httpMock.expectOne('http://localhost:8080/api/auth/logout').flush(null);

    expect(service.isLoggedIn()).toBe(false);
    expect(service.getUsername()).toBeNull();
  });

  it('should checkSession return true and restore the user when the session is valid', () => {
    let result: boolean | undefined;
    service.checkSession().subscribe((r) => (result = r));

    const req = httpMock.expectOne('http://localhost:8080/api/auth/me');
    expect(req.request.method).toBe('GET');
    req.flush({ username: 'mario' });

    expect(result).toBe(true);
    expect(service.getUsername()).toBe('mario');
  });

  it('should checkSession return false and clear the user when the session is invalid', () => {
    let result: boolean | undefined;
    service.checkSession().subscribe((r) => (result = r));

    httpMock
      .expectOne('http://localhost:8080/api/auth/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(result).toBe(false);
    expect(service.getUsername()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });
});
