import { Request, Response } from 'express';
import { UploadAssetUseCase } from '../../../application/UploadAssetUseCase';
import { User } from '../../../domain/user';

export class AssetController {
  constructor(private uploadAssetUseCase: UploadAssetUseCase) {}

  async upload(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } });
      }

      const user = (req as any).user as User | undefined;
      const buffer = req.file.buffer;
      const originalName = req.file.originalname;
      const mimeType = req.file.mimetype;
      const sizeBytes = req.file.size;

      const asset = await this.uploadAssetUseCase.execute(buffer, originalName, mimeType, sizeBytes, user);

      return res.status(201).json({
        success: true,
        data: asset
      });
    } catch (error: any) {
      if (error.message.includes('Unsupported file type')) {
        return res.status(415).json({ success: false, error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: error.message } });
      }
      if (error.message.includes('File size exceeds')) {
        return res.status(413).json({ success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: error.message } });
      }
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }
}
