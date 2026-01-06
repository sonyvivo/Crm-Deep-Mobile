import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  // Forgot Password State
  showForgotPassword = false;
  recoveryKey = '';
  newPassword = '';
  resetMessage = '';
  resetError = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  doLogin() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter username and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = result.error || 'Invalid Username or Password';
          this.password = '';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Unexpected error occurred.';
        console.error('Login error:', err);
      }
    });
  }

  toggleForgotPassword() {
    this.showForgotPassword = !this.showForgotPassword;
    this.errorMessage = '';
    this.resetMessage = '';
    this.resetError = '';
    this.recoveryKey = '';
    this.newPassword = '';
  }

  doReset() {
    if (!this.username || !this.recoveryKey || !this.newPassword) {
      this.resetError = 'All fields are required';
      return;
    }

    if (this.newPassword.length < 6) {
      this.resetError = 'Password must be at least 6 characters';
      return;
    }

    this.isLoading = true;
    this.resetError = '';
    this.resetMessage = '';

    this.authService.resetPassword(this.username, this.recoveryKey, this.newPassword).subscribe({
      next: (response: { success: boolean, message?: string, error?: string }) => {
        this.isLoading = false;
        if (response.success) {
          this.resetMessage = response.message || 'Password reset successful!';
          this.password = ''; // Clear login password field
          setTimeout(() => {
            this.toggleForgotPassword();
            this.errorMessage = 'Please login with your new password';
          }, 2000);
        } else {
          this.resetError = response.error || 'Failed to reset password';
        }
      },
      error: () => {
        this.isLoading = false;
        this.resetError = 'Connection error. Please try again.';
      }
    });
  }
}
