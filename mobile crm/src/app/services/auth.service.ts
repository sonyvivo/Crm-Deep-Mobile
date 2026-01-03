import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: { id: number; username: string };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  // Privacy Mode
  private privacyModeSubject = new BehaviorSubject<boolean>(true);
  privacyMode$ = this.privacyModeSubject.asObservable();
  private currentPin = '1234';

  // Privacy Auto-Hide
  private privacyTimeout: any;
  private readonly PRIVACY_LIMIT = 60 * 1000;

  // Login Authentication
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Auto Logout
  private idleTimeout: any;
  private readonly IDLE_LIMIT = 5 * 60 * 1000;
  private eventListener = () => this.resetTimer();

  constructor(
    private router: Router,
    private zone: NgZone,
    private http: HttpClient
  ) {
    // Check for saved token
    const token = localStorage.getItem('token');
    if (token) {
      this.verifyToken().subscribe();
    }

    // Initial PIN load
    const savedPin = localStorage.getItem('appPin');
    if (savedPin) this.currentPin = savedPin;
  }

  // --- Login Logic (API-based) ---
  login(username: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(
        map(response => {
          if (response.success && response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('isLoggedIn', 'true');
            this.isAuthenticatedSubject.next(true);
            this.startIdleTimer();
            // Load PIN from server after successful login
            this.loadPinFromServer();
            return true;
          }
          return false;
        }),
        catchError(error => {
          console.error('Login error:', error);
          return of(false);
        })
      );
  }

  // Verify token with backend
  verifyToken(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      return of(false);
    }

    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map(response => {
        if (response.success) {
          this.isAuthenticatedSubject.next(true);
          this.startIdleTimer();
          return true;
        }
        this.clearAuth();
        return false;
      }),
      catchError(() => {
        this.clearAuth();
        return of(false);
      })
    );
  }

  private clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    this.isAuthenticatedSubject.next(false);
  }

  logout() {
    this.clearAuth();
    this.forcePrivacy();
    this.stopIdleTimer();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // --- Auto Logout Logic ---
  private startIdleTimer() {
    this.zone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.eventListener);
      window.addEventListener('mousedown', this.eventListener);
      window.addEventListener('keypress', this.eventListener);
      window.addEventListener('touchmove', this.eventListener);
      window.addEventListener('scroll', this.eventListener);
    });
    this.resetTimer();
  }

  private stopIdleTimer() {
    if (this.idleTimeout) clearTimeout(this.idleTimeout);
    window.removeEventListener('mousemove', this.eventListener);
    window.removeEventListener('mousedown', this.eventListener);
    window.removeEventListener('keypress', this.eventListener);
    window.removeEventListener('touchmove', this.eventListener);
    window.removeEventListener('scroll', this.eventListener);
  }

  private resetTimer() {
    if (this.idleTimeout) clearTimeout(this.idleTimeout);

    this.zone.runOutsideAngular(() => {
      this.idleTimeout = setTimeout(() => {
        this.zone.run(() => {
          this.logout();
        });
      }, this.IDLE_LIMIT);
    });
  }

  // --- Privacy Mode Logic ---
  isPrivacyEnabled() {
    return this.privacyModeSubject.value;
  }

  togglePrivacy(inputPin?: string): boolean {
    if (this.privacyModeSubject.value) {
      if (inputPin === this.currentPin) {
        this.privacyModeSubject.next(false);
        this.startPrivacyTimer();
        return true;
      }
      return false;
    } else {
      this.forcePrivacy();
      return true;
    }
  }

  forcePrivacy() {
    this.privacyModeSubject.next(true);
    this.clearPrivacyTimer();
  }

  private startPrivacyTimer() {
    this.clearPrivacyTimer();
    this.zone.runOutsideAngular(() => {
      this.privacyTimeout = setTimeout(() => {
        this.zone.run(() => {
          this.forcePrivacy();
        });
      }, this.PRIVACY_LIMIT);
    });
  }

  private clearPrivacyTimer() {
    if (this.privacyTimeout) {
      clearTimeout(this.privacyTimeout);
      this.privacyTimeout = null;
    }
  }

  // --- PIN Management (API-based) ---

  verifyPin(pin: string): boolean {
    // For synchronous check, use cached PIN from localStorage as fallback
    const cachedPin = localStorage.getItem('appPin') || '1234';
    return pin === cachedPin;
  }

  // Verify PIN via API (async)
  verifyPinAsync(pin: string): Observable<boolean> {
    return this.http.post<{ success: boolean; valid: boolean }>(`${this.apiUrl}/auth/pin/verify`, { pin })
      .pipe(
        map(response => response.success && response.valid),
        tap(valid => {
          if (valid) {
            // Cache the PIN locally for faster subsequent checks
            localStorage.setItem('appPin', pin);
            this.currentPin = pin;
          }
        }),
        catchError(() => {
          // Fallback to localStorage if API fails
          const cachedPin = localStorage.getItem('appPin') || '1234';
          return of(pin === cachedPin);
        })
      );
  }

  // Change PIN via API
  changePinAsync(oldPin: string, newPin: string): Observable<{ success: boolean; error?: string }> {
    return this.http.post<{ success: boolean; message?: string; error?: string }>(
      `${this.apiUrl}/auth/pin/change`,
      { oldPin, newPin }
    ).pipe(
      tap(response => {
        if (response.success) {
          this.currentPin = newPin;
          localStorage.setItem('appPin', newPin);
        }
      }),
      catchError(error => {
        return of({ success: false, error: error.error?.error || 'Failed to change PIN' });
      })
    );
  }

  // Reset PIN via API (requires password)
  resetPinAsync(password: string): Observable<{ success: boolean; pin?: string; error?: string }> {
    return this.http.post<{ success: boolean; pin?: string; error?: string }>(
      `${this.apiUrl}/auth/pin/reset`,
      { password }
    ).pipe(
      tap(response => {
        if (response.success && response.pin) {
          this.currentPin = response.pin;
          localStorage.setItem('appPin', response.pin);
        }
      }),
      catchError(error => {
        return of({ success: false, error: error.error?.error || 'Failed to reset PIN' });
      })
    );
  }

  // Reset Password via Recovery Key
  resetPassword(username: string, recoveryKey: string, newPassword: string): Observable<{ success: boolean; message?: string; error?: string }> {
    return this.http.post<{ success: boolean; message?: string; error?: string }>(
      `${this.apiUrl}/auth/reset-password`,
      { username, recoveryKey, newPassword }
    ).pipe(
      catchError(error => {
        return of({ success: false, error: error.error?.error || 'Failed to reset password' });
      })
    );
  }

  // Load PIN from API on login
  loadPinFromServer(): void {
    this.http.get<{ success: boolean; pin: string }>(`${this.apiUrl}/auth/pin`).subscribe({
      next: response => {
        if (response.success && response.pin) {
          this.currentPin = response.pin;
          localStorage.setItem('appPin', response.pin);
        }
      },
      error: () => {
        // Use default if API fails
        if (!localStorage.getItem('appPin')) {
          localStorage.setItem('appPin', '1234');
        }
      }
    });
  }

  // Sync method for backward compatibility
  changePin(oldPin: string, newPin: string): boolean {
    const cachedPin = localStorage.getItem('appPin') || '1234';
    if (oldPin === cachedPin) {
      this.currentPin = newPin;
      localStorage.setItem('appPin', newPin);
      // Also update on server
      this.changePinAsync(oldPin, newPin).subscribe();
      return true;
    }
    return false;
  }
}

