import { AssetRepository, FileStorageService, Asset } from '../domain/asset';
import { User } from '../domain/user';
import * as crypto from 'crypto';

export class UploadAssetUseCase {
  private allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  private maxSize = 5 * 1024 * 1024; // 5MB

  constructor(
    private assetRepository: AssetRepository,
    private fileStorageService: FileStorageService
  ) {}

  async execute(buffer: Buffer, originalName: string, mimeType: string, sizeBytes: number, user?: User): Promise<Asset> {
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new Error('Unsupported file type');
    }

    if (sizeBytes > this.maxSize) {
      throw new Error('File size exceeds the 5MB limit');
    }

    const assetId = crypto.randomUUID();

    const asset: Asset = {
      id: assetId,
      original_name: originalName,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      uploaded_by: user ? user.id : null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null
    };

    // Rule: Save the file physically first
    await this.fileStorageService.saveFile(assetId, buffer);

    // Then save metadata
    await this.assetRepository.save(asset);

    return asset;
  }
}
