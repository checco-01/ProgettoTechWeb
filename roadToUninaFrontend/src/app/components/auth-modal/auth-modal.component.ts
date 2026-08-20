import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss',
})
export class AuthModalComponent implements OnChanges {
  @Input() mode: 'login' | 'register' = 'login';
  @Output() close = new EventEmitter<void>();
  @Output() authenticated = new EventEmitter<void>();

  authForm!: FormGroup;
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode']) {
      this.buildForm();
      this.errorMessage.set('');
    }
  }

  switchMode(newMode: 'login' | 'register'): void {
    this.mode = newMode;
  }

  get isLogin(): boolean {
    return this.mode === 'login';
  }

  private buildForm(): void {
    if (this.mode === 'login') {
      this.authForm = this.fb.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
      });
    } else {
      this.authForm = this.fb.group(
        {
          username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
          password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
          confirmPassword: ['', [Validators.required]],
        },
        { validators: this.passwordMatchValidator },
      );
    }
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.authForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    if (this.mode === 'login') {
      this.authService.login(this.authForm.value).subscribe({
        next: () => this.authenticated.emit(),
        error: (err) => {
          this.errorMessage.set(err.error?.error || 'Login fallito. Riprova.');
          this.isLoading.set(false);
        },
      });
    } else {
      const { confirmPassword, ...authData } = this.authForm.value;
      this.authService.register(authData).subscribe({
        next: () => this.authenticated.emit(),
        error: (err) => {
          this.errorMessage.set(err.error?.error || 'Registrazione fallita. Riprova.');
          this.isLoading.set(false);
        },
      });
    }
  }
}
