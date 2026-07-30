import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss'
})
export class AuthPageComponent implements OnInit {
  authForm!: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  isLogin: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const path = this.route.snapshot.routeConfig?.path;
    this.isLogin = path === 'login';
    this.buildForm();
  }

  private buildForm(): void {
    if (this.isLogin) {
      this.authForm = this.fb.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(6)]]
      });
    } else {
      this.authForm = this.fb.group({
        username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
        password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
        confirmPassword: ['', [Validators.required]]
      }, { validators: this.passwordMatchValidator });
    }
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.authForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    if (this.isLogin) {
      this.authService.login(this.authForm.value).subscribe({
        next: () => this.router.navigate(['/game']),
        error: (err) => {
          this.errorMessage = err.error?.error || 'Login fallito. Riprova.';
          this.isLoading = false;
        }
      });
    } else {
      const { confirmPassword, ...authData } = this.authForm.value;
      this.authService.register(authData).subscribe({
        next: () => this.router.navigate(['/game']),
        error: (err) => {
          this.errorMessage = err.error?.error || 'Registrazione fallita. Riprova.';
          this.isLoading = false;
        }
      });
    }
  }
}
