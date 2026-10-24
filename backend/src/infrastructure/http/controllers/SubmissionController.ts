import { Request, Response } from 'express';
import { SubmitFormUseCase } from '../../../application/SubmitFormUseCase';
import { SoftDeleteSubmissionUseCase } from '../../../application/SoftDeleteSubmissionUseCase';
import { GetSubmissionsUseCase } from '../../../application/GetSubmissionsUseCase';
import { ReserveFormSpotUseCase } from '../../../application/ReserveFormSpotUseCase';
import { GetActivityCatalogUseCase } from '../../../application/GetActivityCatalogUseCase';
import { User } from '../../../domain/user';

export class SubmissionController {
  constructor(
    private submitFormUseCase: SubmitFormUseCase,
    private softDeleteUseCase: SoftDeleteSubmissionUseCase,
    private getSubmissionsUseCase: GetSubmissionsUseCase,
    private reserveFormSpotUseCase: ReserveFormSpotUseCase,
    private getActivityCatalogUseCase?: GetActivityCatalogUseCase
  ) {}

  async getActivitiesCatalog(req: Request, res: Response) {
    try {
      if (!this.getActivityCatalogUseCase) {
        return res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'GetActivityCatalogUseCase is not configured' }
        });
      }
      const result = await this.getActivityCatalogUseCase.execute();
      return res.status(200).json({
        success: true,
        data: result.activities,
        meta: {
          latest_activity: result.latest_activity
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
      });
    }
  }

  async getActivityParticipants(req: Request, res: Response) {
    try {
      if (!this.getActivityCatalogUseCase) {
        return res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'GetActivityCatalogUseCase is not configured' }
        });
      }
      const activity_id = req.params.activity_id as string;
      const participants = await this.getActivityCatalogUseCase.getParticipantsByActivity(activity_id);
      return res.status(200).json({
        success: true,
        data: participants
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
      });
    }
  }

  async updateActivity(req: Request, res: Response) {
    try {
      if (!this.getActivityCatalogUseCase) {
        return res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'GetActivityCatalogUseCase is not configured' }
        });
      }
      const activity_id = req.params.activity_id as string;
      const { activity_date, total_capacity, reserved_capacity, real_capacity } = req.body || {};
      const updated = await this.getActivityCatalogUseCase.updateActivity(activity_id, {
        activity_date,
        total_capacity,
        reserved_capacity,
        real_capacity
      });
      return res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error: any) {
      if (error.message === 'ACTIVITY_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: { code: 'ACTIVITY_NOT_FOUND', message: 'La actividad no existe.' }
        });
      }
      if (error.message?.startsWith('VALIDATION_ERROR:')) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message.replace('VALIDATION_ERROR: ', '') }
        });
      }
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
      });
    }
  }

  async deleteActivityParticipants(req: Request, res: Response) {
    try {
      if (!this.getActivityCatalogUseCase) {
        return res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'GetActivityCatalogUseCase is not configured' }
        });
      }
      const activity_id = req.params.activity_id as string;
      const { ids } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Debes seleccionar al menos un registro para borrar.' }
        });
      }
      const deletedCount = await this.getActivityCatalogUseCase.deleteParticipants(activity_id, ids);
      return res.status(200).json({
        success: true,
        data: { deleted_count: deletedCount }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
      });
    }
  }

  async reserve(req: Request, res: Response) {
    try {
      const form_identifier = req.params.form_identifier as string;
      const reservation = await this.reserveFormSpotUseCase.execute(form_identifier);
      return res.status(200).json({ success: true, data: reservation });
    } catch (error: any) {
      if (error.message === 'LIMIT_REACHED') {
        return res.status(403).json({ success: false, error: { code: 'LIMIT_REACHED', message: 'El cupo para este formulario se ha agotado o está reservado temporalmente.' } });
      }
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  async getSubmissions(req: Request, res: Response) {
    try {
      const form_identifier = req.params.form_identifier as string;
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
      const form_identifier = req.params.form_identifier as string;
      const { public_password, reservation_token, data } = req.body;
      const user = (req as any).user as User | undefined;

      const submission = await this.submitFormUseCase.execute(form_identifier, data, user, public_password, reservation_token);

      return res.status(201).json({
        success: true,
        data: submission
      });
    } catch (error: any) {
      if (error.message === 'Form configuration not found') {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: error.message } });
      }
      if (error.message === 'ACTIVITY_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACTIVITY_NOT_FOUND',
            message: 'La actividad seleccionada no existe o fue eliminada.'
          }
        });
      }
      if (error.message.startsWith('VALIDATION_ERROR:')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message.replace('VALIDATION_ERROR: ', '')
          }
        });
      }
      if (error.message === 'ACTIVITY_FULL') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ACTIVITY_FULL',
            message: 'Esta actividad ya alcanzó el límite de su cupo real disponible.'
          }
        });
      }
      if (error.message.includes('password') || error.message.includes('inactive')) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: error.message } });
      }
      if (error.message.includes('RESERVATION') || error.message === 'LIMIT_REACHED') {
        return res.status(400).json({ success: false, error: { code: 'RESERVATION_ERROR', message: error.message } });
      }
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  async softDelete(req: Request, res: Response) {
    try {
      const form_identifier = req.params.form_identifier as string;
      const submission_id = req.params.submission_id as string;
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
