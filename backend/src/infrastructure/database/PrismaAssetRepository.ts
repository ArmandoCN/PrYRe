import { AssetRepository, Asset } from '../../domain/asset';

export class PrismaAssetRepository implements AssetRepository {
  constructor(private prismaClient: any) {}

  async save(asset: Asset): Promise<void> {
    await this.prismaClient.asset.create({
      data: {
        id: asset.id,
        original_name: asset.original_name,
        mime_type: asset.mime_type,
        size_bytes: asset.size_bytes,
        uploaded_by: asset.uploaded_by,
        created_at: asset.created_at,
        updated_at: asset.updated_at,
        deleted_at: asset.deleted_at
      }
    });
  }

  async findById(id: string): Promise<Asset | null> {
    const asset = await this.prismaClient.asset.findUnique({
      where: { id, deleted_at: null }
    });
    
    if (!asset) return null;
    
    return {
      id: asset.id,
      original_name: asset.original_name,
      mime_type: asset.mime_type,
      size_bytes: asset.size_bytes,
      uploaded_by: asset.uploaded_by,
      created_at: asset.created_at,
      updated_at: asset.updated_at,
      deleted_at: asset.deleted_at
    };
  }

  async softDelete(id: string): Promise<void> {
    await this.prismaClient.asset.update({
      where: { id },
      data: { deleted_at: new Date() }
    });
  }
}
