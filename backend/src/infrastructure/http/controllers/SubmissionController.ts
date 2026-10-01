import { Request, Response } from 'express';
import { SubmitFormUseCase } from '../../../application/SubmitFormUseCase';
import { SoftDeleteSubmissionUseCase } from '../../../application/SoftDeleteSubmissionUseCase';
import { GetSubmissionsUseCase } from '../../../application/GetSubmissionsUseCase';
import { User } from '../../../domain/user';

export class SubmissionController {
  constructor(
    private submitFormUseCase: SubmitFormUseCase,
    private softDeleteUseCase: SoftDeleteSubmissionUseCase,
    private getSubmissionsUseCase: GetSubmissionsUseCase
  ) {}

  async getSubmissions(req: Request, res: Response) {
    try {
      const { form_identifier } = req.params;
      const submissions = await this.getSubmissionsUseCase.execute(form_identifier);
      return res.status(200).json({ success: true, data: submissions });
    } catch (error: any) {
      if (error.message === 'Form configuration not found') {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: error.message } });
      }
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  async submit(req: Request, res: Response) {
    try {
      const { form_identifier } = req.params;
      const { public_password, data } = req.body;
      const user = (req as any).user as User | undefined;

      const submission = await this.submitFormUseCase.execute(form_identifier, data, user, public_password);

      return res.status(201).json({
        success: true,
        data: submission
      });
    } catch (error: any) {
      if (error.message === 'Form configuration not found') {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: error.message } });
      }
      if (error.message.includes('password') || error.message.includes('inactive')) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: error.message } });
      }
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  async softDelete(req: Request, res: Response) {
    try {
      const { form_identifier, submission_id } = req.params;
      const user = (req as any).user as User;

      await this.softDeleteUseCase.execute(user, form_identifier, submission_id);

      return res.status(200).json({ success: true, data: { message: 'Soft deleted successfully' } });
    } catch (error: any) {
      if (error.message.includes('Forbidden')) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: error.message } });
      }
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }
}
