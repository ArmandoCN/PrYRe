import { FileStorageService } from '../../domain/asset';
import fs from 'fs/promises';
import path from 'path';

export class LocalFileStorageService implements FileStorageService {
  private basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_BASE_PATH || path.join(__dirname, '../../../../uploads');
    
    // Ensure directory exists
    fs.mkdir(this.basePath, { recursive: true }).catch(console.error);
  }

  async saveFile(id: string, buffer: Buffer): Promise<void> {
    const filePath = path.join(this.basePath, id);
    await fs.writeFile(filePath, buffer);
  }

  async deleteFile(id: string): Promise<void> {
    const filePath = path.join(this.basePath, id);
    await fs.unlink(filePath).catch(() => {});
  }

  async getFile(id: string): Promise<Buffer | null> {
    const filePath = path.join(this.basePath, id);
    try {
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }
}
