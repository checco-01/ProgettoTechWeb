import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthModalComponent } from './auth-modal.component';
import { AuthService } from '../../services/auth.service';

describe('AuthModalComponent', () => {
  let fixture: ComponentFixture<AuthModalComponent>;
  let component: AuthModalComponent;
  let authService: { login: ReturnType<typeof vi.fn>; register: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = {
      login: vi.fn(),
      register: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AuthModalComponent],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should invalidate a username shorter than 3 characters', () => {
    component.authForm.patchValue({ username: 'ab', password: 'secret1' });
    expect(component.authForm.valid).toBe(false);
    expect(component.authForm.get('username')?.hasError('minlength')).toBe(true);
  });

  it('should invalidate a password shorter than 6 characters', () => {
    component.authForm.patchValue({ username: 'mario', password: '12345' });
    expect(component.authForm.valid).toBe(false);
    expect(component.authForm.get('password')?.hasError('minlength')).toBe(true);
  });

  it('should be valid with correct login credentials', () => {
    component.authForm.patchValue({ username: 'mario', password: 'secret1' });
    expect(component.authForm.valid).toBe(true);
  });

  it('should switch to register mode and rebuild the form with confirmPassword', () => {
    component.switchMode('register');
    expect(component.isLogin).toBe(false);
    expect(component.authForm.get('confirmPassword')).toBeTruthy();
    expect(component.errorMessage()).toBe('');
  });

  it('should reject the register form when passwords do not match', () => {
    component.switchMode('register');
    component.authForm.patchValue({
      username: 'mario',
      password: 'secret1',
      confirmPassword: 'different',
    });
    expect(component.authForm.valid).toBe(false);
    expect(component.authForm.hasError('mismatch')).toBe(true);
  });

  it('should accept the register form when passwords match', () => {
    component.switchMode('register');
    component.authForm.patchValue({
      username: 'mario',
      password: 'secret1',
      confirmPassword: 'secret1',
    });
    expect(component.authForm.valid).toBe(true);
  });

  it('should not call the service when the form is invalid', () => {
    component.authForm.patchValue({ username: '', password: '' });
    component.onSubmit();
    expect(authService.login).not.toHaveBeenCalled();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should emit authenticated on successful login', () => {
    authService.login.mockReturnValue(of({ username: 'mario', message: 'ok' }));
    const spy = vi.fn();
    component.authenticated.subscribe(spy);

    component.authForm.patchValue({ username: 'mario', password: 'secret1' });
    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({ username: 'mario', password: 'secret1' });
    expect(spy).toHaveBeenCalled();
  });

  it('should set the error message on failed login', () => {
    authService.login.mockReturnValue(
      throwError(() => ({ error: { error: 'Credenziali non valide' } })),
    );

    component.authForm.patchValue({ username: 'mario', password: 'wrong1' });
    component.onSubmit();

    expect(component.errorMessage()).toBe('Credenziali non valide');
    expect(component.isLoading()).toBe(false);
  });

  it('should use a fallback error message when the server does not provide one', () => {
    authService.login.mockReturnValue(throwError(() => ({})));

    component.authForm.patchValue({ username: 'mario', password: 'wrong1' });
    component.onSubmit();

    expect(component.errorMessage()).toBe('Login fallito. Riprova.');
  });

  it('should set the error message on failed registration', () => {
    authService.register.mockReturnValue(
      throwError(() => ({ error: { error: 'Username già in uso' } })),
    );

    component.switchMode('register');
    component.authForm.patchValue({
      username: 'mario',
      password: 'secret1',
      confirmPassword: 'secret1',
    });
    component.onSubmit();

    expect(component.errorMessage()).toBe('Username già in uso');
    expect(component.isLoading()).toBe(false);
  });

  it('should disable the submit button while the form is invalid', () => {
    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    component.authForm.patchValue({ username: 'mario', password: 'secret1' });
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
  });

  it('should emit close when clicking the overlay', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);

    const overlay = fixture.nativeElement.querySelector('.modal-overlay') as HTMLElement;
    overlay.click();

    expect(spy).toHaveBeenCalled();
  });
});
