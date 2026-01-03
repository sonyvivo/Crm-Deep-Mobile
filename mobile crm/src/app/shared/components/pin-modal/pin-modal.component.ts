import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-pin-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pin-modal.component.html',
  styles: [`
    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; align-items: center; justify-content: center; }
    .modal.show { display: flex; }
    .modal-content { background: white; padding: 20px; border-radius: 10px; width: 90%; max-width: 320px; text-align: center; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6c757d; }
    .modal-footer { margin-top: 15px; }
  `]
})
export class PinModalComponent {
  @Input() isVisible = false;
  @Output() verified = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  pin = '';
  error = '';
  isLoading = false;
  showResetForm = false;
  resetPassword = '';

  constructor(private authService: AuthService) { }

  verify() {
    if (!this.pin) {
      this.error = 'Please enter PIN';
      return;
    }

    this.isLoading = true;
    this.error = '';

    // Use async API verification
    this.authService.verifyPinAsync(this.pin).subscribe({
      next: (valid) => {
        this.isLoading = false;
        if (valid) {
          this.verified.emit(this.pin);
          this.reset();
        } else {
          this.error = 'Invalid PIN';
        }
      },
      error: () => {
        this.isLoading = false;
        // Fallback to sync verification
        if (this.authService.verifyPin(this.pin)) {
          this.verified.emit(this.pin);
          this.reset();
        } else {
          this.error = 'Invalid PIN';
        }
      }
    });
  }

  close() {
    this.cancel.emit();
    this.reset();
  }

  reset() {
    this.pin = '';
    this.error = '';
    this.showResetForm = false;
    this.resetPassword = '';
    this.isLoading = false;
  }

  forgotPin() {
    this.showResetForm = true;
    this.error = '';
  }

  resetPin() {
    if (!this.resetPassword) {
      this.error = 'Please enter your login password';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.authService.resetPinAsync(this.resetPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.error = '';
          this.showResetForm = false;
          this.resetPassword = '';
          alert('PIN has been reset to: ' + (response.pin || '1234'));
        } else {
          this.error = response.error || 'Failed to reset PIN';
        }
      },
      error: () => {
        this.isLoading = false;
        this.error = 'Failed to reset PIN. Please try again.';
      }
    });
  }

  cancelReset() {
    this.showResetForm = false;
    this.resetPassword = '';
    this.error = '';
  }
}

