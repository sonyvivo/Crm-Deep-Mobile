import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare const gapi: any;
declare const google: any;

@Injectable({
    providedIn: 'root'
})
export class GDriveService {
    // Google Cloud OAuth Client ID
    private readonly CLIENT_ID = '838463418090-sdr31fad7olt7916fu4n7j8g3fnuoejt.apps.googleusercontent.com';
    private readonly API_KEY = ''; // Optional: Add if using API key
    private readonly DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
    private readonly SCOPES = 'https://www.googleapis.com/auth/drive.file';
    private readonly BACKUP_PREFIX = 'DeepMobileCRM_Backup_';
    private readonly RETENTION_DAYS = 30; // Keep backups for 30 days

    private tokenClient: any = null;
    private gapiInited = false;
    private gisInited = false;
    private accessToken: string | null = null;

    private isSignedInSubject = new BehaviorSubject<boolean>(false);
    private isLoadingSubject = new BehaviorSubject<boolean>(false);
    private userEmailSubject = new BehaviorSubject<string>('');

    isSignedIn$ = this.isSignedInSubject.asObservable();
    isLoading$ = this.isLoadingSubject.asObservable();
    userEmail$ = this.userEmailSubject.asObservable();

    constructor() {
        this.loadStoredToken();
    }

    private loadStoredToken() {
        const stored = localStorage.getItem('gdrive_token');
        const email = localStorage.getItem('gdrive_email');
        if (stored) {
            this.accessToken = stored;
            this.isSignedInSubject.next(true);
            if (email) this.userEmailSubject.next(email);
        }
    }

    async initGoogleApi(): Promise<boolean> {
        return new Promise((resolve) => {
            // Check if scripts are loaded
            if (typeof gapi === 'undefined' || typeof google === 'undefined') {
                console.warn('Google API scripts not loaded yet');
                // Retry after a short delay
                setTimeout(() => this.initGoogleApi().then(resolve), 500);
                return;
            }

            // Initialize GAPI
            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: this.API_KEY,
                        discoveryDocs: this.DISCOVERY_DOCS,
                    });
                    this.gapiInited = true;
                    this.maybeEnableButtons(resolve);
                } catch (err) {
                    console.error('Error initializing GAPI:', err);
                    resolve(false);
                }
            });

            // Initialize GIS (Google Identity Services)
            try {
                this.tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: this.CLIENT_ID,
                    scope: this.SCOPES,
                    callback: (tokenResponse: any) => {
                        if (tokenResponse.access_token) {
                            this.accessToken = tokenResponse.access_token;
                            localStorage.setItem('gdrive_token', this.accessToken!);
                            this.isSignedInSubject.next(true);
                            this.isLoadingSubject.next(false);
                            this.getUserEmail();
                        }
                    },
                });
                this.gisInited = true;
                this.maybeEnableButtons(resolve);
            } catch (err) {
                console.error('Error initializing GIS:', err);
                resolve(false);
            }
        });
    }

    private maybeEnableButtons(resolve: (value: boolean) => void) {
        if (this.gapiInited && this.gisInited) {
            resolve(true);
        }
    }

    private async getUserEmail() {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${this.accessToken}` }
            });
            const data = await response.json();
            if (data.email) {
                this.userEmailSubject.next(data.email);
                localStorage.setItem('gdrive_email', data.email);
            }
        } catch (err) {
            console.error('Error getting user email:', err);
        }
    }

    signIn() {
        if (!this.tokenClient) {
            console.error('Token client not initialized');
            return;
        }
        this.isLoadingSubject.next(true);

        if (this.accessToken) {
            // Token exists, try to use it
            gapi.client.setToken({ access_token: this.accessToken });
            this.isSignedInSubject.next(true);
            this.isLoadingSubject.next(false);
        } else {
            // Request new token
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        }
    }

    signOut() {
        if (this.accessToken) {
            google.accounts.oauth2.revoke(this.accessToken);
            this.accessToken = null;
            localStorage.removeItem('gdrive_token');
            localStorage.removeItem('gdrive_email');
            this.isSignedInSubject.next(false);
            this.userEmailSubject.next('');
            gapi.client.setToken(null);
        }
    }

    isSignedIn(): boolean {
        return this.isSignedInSubject.value;
    }

    // Generate timestamped backup filename
    private generateBackupFilename(): string {
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/[:.]/g, '-')
            .slice(0, 19); // Format: 2026-01-03T02-56-22
        return `${this.BACKUP_PREFIX}${timestamp}.json`;
    }

    async uploadBackup(jsonData: string): Promise<{ success: boolean; message: string }> {
        if (!this.accessToken) {
            return { success: false, message: 'Not signed in to Google Drive' };
        }

        this.isLoadingSubject.next(true);

        try {
            // Set the access token for gapi
            gapi.client.setToken({ access_token: this.accessToken });

            // Create new backup file with timestamp
            const filename = this.generateBackupFilename();
            const metadata = {
                name: filename,
                mimeType: 'application/json',
            };

            const form = new FormData();
            const blob = new Blob([jsonData], { type: 'application/json' });
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', blob);

            const response = await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                    body: form,
                }
            );

            if (response.ok) {
                // Clean up old backups after successful upload
                await this.deleteOldBackups();

                this.isLoadingSubject.next(false);
                return { success: true, message: `Backup created: ${filename}` };
            } else {
                throw new Error('Failed to create backup');
            }
        } catch (error: any) {
            console.error('Backup upload error:', error);
            this.isLoadingSubject.next(false);

            // Check if token expired
            if (error.status === 401) {
                this.signOut();
                return { success: false, message: 'Session expired. Please sign in again.' };
            }

            return { success: false, message: error.message || 'Backup failed' };
        }
    }

    // Delete backups older than 30 days
    private async deleteOldBackups(): Promise<void> {
        try {
            const allBackups = await this.listBackups();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

            for (const file of allBackups) {
                const fileDate = new Date(file.modifiedTime);
                if (fileDate < cutoffDate) {
                    await this.deleteFile(file.id);
                    console.log(`Deleted old backup: ${file.name}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning up old backups:', error);
        }
    }

    // Delete a file from Google Drive
    private async deleteFile(fileId: string): Promise<boolean> {
        try {
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                }
            );
            return response.ok;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    async listBackups(): Promise<any[]> {
        if (!this.accessToken) {
            return [];
        }

        try {
            gapi.client.setToken({ access_token: this.accessToken });

            const response = await gapi.client.drive.files.list({
                q: `name contains '${this.BACKUP_PREFIX}' and mimeType='application/json' and trashed=false`,
                fields: 'files(id, name, modifiedTime, size)',
                orderBy: 'modifiedTime desc',
                spaces: 'drive',
            });

            return response.result.files || [];
        } catch (error) {
            console.error('Error listing backups:', error);
            return [];
        }
    }

    async downloadBackup(fileId: string): Promise<string | null> {
        if (!this.accessToken) {
            return null;
        }

        try {
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                }
            );

            if (response.ok) {
                return await response.text();
            }
            return null;
        } catch (error) {
            console.error('Error downloading backup:', error);
            return null;
        }
    }

    // Auto backup settings
    isAutoBackupEnabled(): boolean {
        return localStorage.getItem('gdrive_auto_backup') === 'true';
    }

    setAutoBackupEnabled(enabled: boolean) {
        localStorage.setItem('gdrive_auto_backup', enabled ? 'true' : 'false');
    }

    getLastBackupTime(): string | null {
        return localStorage.getItem('gdrive_last_backup');
    }

    setLastBackupTime() {
        localStorage.setItem('gdrive_last_backup', new Date().toISOString());
    }
}
