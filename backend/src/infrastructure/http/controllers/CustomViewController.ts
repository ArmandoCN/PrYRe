import { Request, Response } from 'express';
import { ManageCustomViewUseCase } from '../../../application/ManageCustomViewUseCase';
import { GetCustomViewsUseCase } from '../../../application/GetCustomViewsUseCase';
import { User } from '../../../domain/user';

export class CustomViewController {
  constructor(
    private manageCustomViewUseCase: ManageCustomViewUseCase,
    private getCustomViewsUseCase: GetCustomViewsUseCase
  ) {}

  async getCustomViews(req: Request, res: Response) {
    try {
      const { form_identifier } = req.params;
      const views = await this.getCustomViewsUseCase.execute(form_identifier);
      
      return res.status(200).json({
        success: true,
        data: views
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user as User;
      const { name, form_identifier, columns, filters } = req.body;

      const customView = await this.manageCustomViewUseCase.execute(user, { name, form_identifier, columns, filters });

      return res.status(201).json({
        success: true,
        data: customView
      });
    } catch (error: any) {
      if (error.message.includes('Forbidden')) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: error.message } });
      }
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }
}
