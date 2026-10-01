import { Request, Response } from 'express';
import { ManageFormConfigUseCase } from '../../../application/ManageFormConfigUseCase';
import { GetFormConfigUseCase } from '../../../application/GetFormConfigUseCase';
import { GetFormsUseCase } from '../../../application/GetFormsUseCase';
import { User } from '../../../domain/user';

export class FormConfigController {
  constructor(
    private manageFormConfigUseCase: ManageFormConfigUseCase,
    private getFormConfigUseCase: GetFormConfigUseCase,
    private getFormsUseCase: GetFormsUseCase
  ) {}

  async getAll(req: Request, res: Response) {
    try {
      const forms = await this.getFormsUseCase.execute();
      return res.status(200).json({
        success: true,
        data: forms
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  async getPublicList(req: Request, res: Response) {
    try {
      const forms = await this.getFormsUseCase.execute();
      const publicForms = forms
        .filter(f => f.is_active && f.is_listed)
        .map(f => ({
          id: f.id,
          form_identifier: f.form_identifier
        }));
        
      return res.status(200).json({
        success: true,
        data: publicForms
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  async getConfig(req: Request, res: Response) {
    try {
      const { form_identifier } = req.params;
      const config = await this.getFormConfigUseCase.execute(form_identifier);
      
      const safeConfig = {
        id: config.id,
        form_identifier: config.form_identifier,
        is_active: config.is_active,
        requires_password: !!config.public_password,
        confirmation_mode: config.confirmation_mode,
        created_at: config.created_at,
        updated_at: config.updated_at
      };

      return res.status(200).json({
        success: true,
        data: safeConfig
      });
    } catch (error: any) {
      if (error.message === 'Form configuration not found') {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: error.message } });
      }
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  async updateConfig(req: Request, res: Response) {
    try {
      const user = (req as any).user as User;
      const { form_identifier } = req.params;
      const updates = req.body;

      const updatedConfig = await this.manageFormConfigUseCase.execute(user, form_identifier, updates);

      return res.status(200).json({
        success: true,
        data: updatedConfig
      });
    } catch (error: any) {
      if (error.message === 'Forbidden: Only ADMIN can manage form configurations') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message
          }
        });
      }

      if (error.message === 'Form configuration not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  }
}
