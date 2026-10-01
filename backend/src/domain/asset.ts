export interface Asset {
  id: string; // UUID
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface AssetRepository {
  save(asset: Asset): Promise<void>;
  findById(id: string): Promise<Asset | null>;
  softDelete(id: string): Promise<void>;
}

export interface FileStorageService {
  saveFile(id: string, buffer: Buffer): Promise<void>;
  deleteFile(id: string): Promise<void>;
  getFile(id: string): Promise<Buffer | null>;
}
