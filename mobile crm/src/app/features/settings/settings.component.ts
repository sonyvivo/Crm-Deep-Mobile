import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { GDriveService } from '../../services/gdrive.service';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  // PIN Form
  oldPin = '';
  newPin = '';

  // Data Form
  importFile: File | null = null;

  // Confirm State
  isConfirmClearOpen = false;

  // Toast
  toastMessage = '';
  toastType = '';

  // Google Drive
  isGoogleSignedIn = false;
  isGoogleLoading = false;
  googleEmail = '';
  autoBackupEnabled = false;
  lastBackupTime: string | null = null;
  backupFiles: any[] = [];
  showBackupList = false;
  isRestoreConfirmOpen = false;
  selectedBackupId = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private gdriveService: GDriveService
  ) { }

  ngOnInit() {
    // Initialize Google API
    this.gdriveService.initGoogleApi();

    // Subscribe to Google Drive status
    this.subscriptions.push(
      this.gdriveService.isSignedIn$.subscribe(signedIn => {
        this.isGoogleSignedIn = signedIn;
      }),
      this.gdriveService.isLoading$.subscribe(loading => {
        this.isGoogleLoading = loading;
      }),
      this.gdriveService.userEmail$.subscribe(email => {
        this.googleEmail = email;
      })
    );

    // Load auto-backup setting
    this.autoBackupEnabled = this.gdriveService.isAutoBackupEnabled();
    this.lastBackupTime = this.gdriveService.getLastBackupTime();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // --- PIN Methods ---
  updatePin() {
    if (this.authService.changePin(this.oldPin, this.newPin)) {
      this.showToast('PIN Updated Successfully', 'success');
      this.oldPin = '';
      this.newPin = '';
    } else {
      this.showToast('Incorrect Old PIN', 'error');
    }
  }

  // --- Local Backup Methods ---
  downloadBackup() {
    const json = this.dataService.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DeepMobileBackup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    this.showToast('Backup Downloaded', 'success');
  }

  onFileSelected(event: any) {
    this.importFile = event.target.files[0];
  }

  restoreData() {
    if (this.importFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.dataService.importData(e.target.result)) {
          this.showToast('Data Restored Successfully', 'success');
          this.importFile = null;
        } else {
          this.showToast('Invalid Backup File', 'error');
        }
      };
      reader.readAsText(this.importFile);
    }
  }

  confirmClear() {
    this.isConfirmClearOpen = true;
  }

  onClearConfirmed() {
    this.dataService.clearAllData();
    this.isConfirmClearOpen = false;
    this.showToast('All Data Cleared', 'success');
  }

  // --- Google Drive Methods ---
  connectGoogleDrive() {
    this.gdriveService.signIn();
  }

  disconnectGoogleDrive() {
    this.gdriveService.signOut();
    this.autoBackupEnabled = false;
    this.showToast('Disconnected from Google Drive', 'success');
  }

  toggleAutoBackup() {
    this.gdriveService.setAutoBackupEnabled(this.autoBackupEnabled);
    if (this.autoBackupEnabled) {
      this.showToast('Auto-backup enabled', 'success');
      // Trigger immediate backup
      this.backupToGoogleDrive();
    } else {
      this.showToast('Auto-backup disabled', 'success');
    }
  }

  async backupToGoogleDrive() {
    if (!this.isGoogleSignedIn) {
      this.showToast('Please connect Google Drive first', 'error');
      return;
    }

    const jsonData = this.dataService.exportData();
    const result = await this.gdriveService.uploadBackup(jsonData);

    if (result.success) {
      this.gdriveService.setLastBackupTime();
      this.lastBackupTime = this.gdriveService.getLastBackupTime();
      this.showToast(result.message, 'success');
    } else {
      this.showToast(result.message, 'error');
    }
  }

  async loadBackupList() {
    this.showBackupList = !this.showBackupList;
    if (this.showBackupList) {
      this.backupFiles = await this.gdriveService.listBackups();
    }
  }

  selectBackupForRestore(fileId: string) {
    this.selectedBackupId = fileId;
    this.isRestoreConfirmOpen = true;
  }

  async onRestoreFromDriveConfirmed() {
    this.isRestoreConfirmOpen = false;

    if (!this.selectedBackupId) return;

    const jsonData = await this.gdriveService.downloadBackup(this.selectedBackupId);

    if (jsonData) {
      if (this.dataService.importData(jsonData)) {
        this.showToast('Data restored from Google Drive!', 'success');
        this.showBackupList = false;
      } else {
        this.showToast('Invalid backup file format', 'error');
      }
    } else {
      this.showToast('Failed to download backup', 'error');
    }

    this.selectedBackupId = '';
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleString();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // --- Toast ---
  showToast(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
    }, 3000);
  }
}
