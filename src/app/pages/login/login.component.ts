import { Component, inject } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { LoadingComponent } from '../../components/loading/loading.component';
import { AuthNotificationService } from '../../service/auth-notification.service';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, LoadingComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly notifications = inject(AuthNotificationService);

  isLoading = false;
  showPassword = false;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.isLoading) {
      return;
    }

    this.notifications.clear();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.notifications.show(this.validationMessage());
      return;
    }

    this.isLoading = true;
    this.authService.login(this.form.getRawValue()).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (error: unknown) => this.notifications.show(this.loginErrorMessage(error))
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private validationMessage(): string {
    const email = this.form.controls.email;
    if (email.hasError('required')) {
      return 'Email is required.';
    }
    if (email.hasError('email')) {
      return 'Enter a valid email address.';
    }
    return 'Password is required.';
  }

  private loginErrorMessage(error: unknown): string {
    if (!(error instanceof FirebaseError)) {
      return 'Unable to sign in. Please try again.';
    }

    switch (error.code) {
      case 'auth/invalid-email':
        return 'Enter a valid email address.';
      case 'auth/missing-password':
        return 'Password is required.';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password.';
      case 'auth/user-disabled':
        return 'This administrator account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many sign-in attempts. Please wait and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      default:
        return 'Unable to sign in. Please try again.';
    }
  }
}
