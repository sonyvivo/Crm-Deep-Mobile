import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { PinModalComponent } from '../../shared/components/pin-modal/pin-modal.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, PinModalComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  isSidebarOpen = false;
  isPrivacyMode = true;
  isPinModalOpen = false;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private router: Router
  ) {
    this.authService.privacyMode$.subscribe(mode => {
      this.isPrivacyMode = mode;
    });

    // Load data from API when layout loads
    this.dataService.loadAllData();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  togglePrivacy() {
    if (this.isPrivacyMode) {
      this.isPinModalOpen = true;
    } else {
      this.authService.togglePrivacy();
    }
  }

  onPinVerified(pin: string) {
    this.isPinModalOpen = false;
    this.authService.togglePrivacy(pin);
  }

  logout() {
    this.authService.logout();
  }

  navigate(path: string, openNew: boolean = false) {
    if (openNew) {
      this.router.navigate([path], { queryParams: { action: 'new' } });
    } else {
      this.router.navigate([path]);
    }
  }

  // Keyboard shortcuts for quick actions
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    // Only trigger if Ctrl key is pressed and not in input/textarea
    if (!event.ctrlKey) return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    switch (event.key.toLowerCase()) {
      case 'j': // Ctrl+J - New Job Sheet
        event.preventDefault();
        this.navigate('/job-sheets', true);
        break;
      case 'i': // Ctrl+I - New Invoice
        event.preventDefault();
        this.navigate('/billing', true);
        break;
      case 's': // Ctrl+S - New Sell
        event.preventDefault();
        this.navigate('/sales', true);
        break;
      case 'p': // Ctrl+P - New Inventory
        event.preventDefault();
        this.navigate('/purchases', true);
        break;
      case 'e': // Ctrl+E - New Expense
        event.preventDefault();
        this.navigate('/expenses', true);
        break;
    }
  }
}
