
export interface DriveData {
  items: any[];
  imports: any[];
  blockedApps: any[];
  settings: {
    geminiApiKey?: string;
  };
}

class DriveStorageService {
  private accessToken: string | null = null;
  private fileId: string | null = null;
  private fileName = 'mindspace_data.json';

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async fetchDrive(url: string, options: RequestInit = {}) {
    if (!this.accessToken) throw new Error('No access token');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    return response;
  }

  async findDataFile(): Promise<string | null> {
    const q = encodeURIComponent(`name = '${this.fileName}' and trashed = false`);
    const response = await this.fetchDrive(`https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive`);
    const data = await response.json();
    
    if (data.files && data.files.length > 0) {
      this.fileId = data.files[0].id;
      return this.fileId;
    }
    return null;
  }

  async createDataFile(initialData: DriveData): Promise<string> {
    const metadata = {
      name: this.fileName,
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(initialData)], { type: 'application/json' }));

    const response = await this.fetchDrive('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      body: form,
    });

    const data = await response.json();
    this.fileId = data.id;
    return data.id;
  }

  async loadData(): Promise<DriveData | null> {
    if (!this.fileId) {
      await this.findDataFile();
    }
    if (!this.fileId) return null;

    const response = await this.fetchDrive(`https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`);
    return await response.json();
  }

  async saveData(data: DriveData) {
    if (!this.fileId) {
      await this.findDataFile();
    }
    
    if (!this.fileId) {
      return this.createDataFile(data);
    }

    await this.fetchDrive(`https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const driveStorage = new DriveStorageService();
