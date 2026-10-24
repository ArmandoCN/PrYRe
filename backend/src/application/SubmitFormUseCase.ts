import { FormConfigRepository } from '../domain/formConfig';
import { SubmissionRepository, BaseSubmission } from '../domain/submission';
import { FormReservationRepository } from '../domain/formReservation';
import { User } from '../domain/user';
import bcrypt from 'bcrypt';
import { FolioGeneratorService } from './FolioGeneratorService';
import { activityCatalogBackendSchema } from '../shared/validation/activityCatalog.schema';
import { activityParticipantBackendSchema } from '../shared/validation/activityParticipant.schema';

export class SubmitFormUseCase {
  constructor(
    private formConfigRepository: FormConfigRepository,
    private submissionRepository: SubmissionRepository,
    private formReservationRepository: FormReservationRepository
  ) {}

  async execute(formIdentifier: string, payload: any, user?: User, publicPassword?: string, reservationToken?: string): Promise<BaseSubmission> {
    const config = await this.formConfigRepository.findByIdentifier(formIdentifier);

    if (!config) {
      throw new Error('Form configuration not found');
    }

    if (!config.is_active) {
      throw new Error('This form is currently inactive');
    }

    // Check reservation if limits exist
    if (config.max_submissions !== null && config.max_submissions !== undefined) {
      if (!reservationToken) {
        throw new Error('RESERVATION_REQUIRED');
      }
      
      const reservation = await this.formReservationRepository.findById(reservationToken);
      if (!reservation || reservation.form_identifier !== formIdentifier) {
        throw new Error('INVALID_RESERVATION');
      }
      if (reservation.status !== 'PENDING') {
        throw new Error('RESERVATION_NOT_PENDING');
      }
      if (new Date() > reservation.expires_at) {
        await this.formReservationRepository.markAsExpired(reservationToken);
        throw new Error('RESERVATION_EXPIRED');
      }
    }

    // Public password check
    if (!user && config.public_password) {
      if (!publicPassword) {
        throw new Error('Invalid or missing public password for this form');
      }
      const isMatch = await bcrypt.compare(publicPassword, config.public_password);
      if (!isMatch) {
        throw new Error('Invalid or missing public password for this form');
      }
    }

    // Validate payload structure
    if (formIdentifier === 'ActivityCatalog') {
      const parseResult = activityCatalogBackendSchema.safeParse(payload);
      if (!parseResult.success) {
        const message = (parseResult.error.issues || []).map((e: any) => (e.path && e.path.length > 0) ? `${e.path.join('.')}: ${e.message}` : e.message).join(', ') || parseResult.error.message;
        throw new Error('VALIDATION_ERROR: ' + message);
      }
      payload.total_capacity = Number(payload.total_capacity);
      payload.reserved_capacity = Number(payload.reserved_capacity || 0);
      payload.real_capacity = Math.max(0, payload.total_capacity - payload.reserved_capacity);
      if (typeof payload.activity_date === 'string') {
        payload.activity_date = new Date(payload.activity_date);
      }
    } else if (formIdentifier === 'ActivityParticipant') {
      const parseResult = activityParticipantBackendSchema.safeParse(payload);
      if (!parseResult.success) {
        const message = (parseResult.error.issues || []).map((e: any) => (e.path && e.path.length > 0) ? `${e.path.join('.')}: ${e.message}` : e.message).join(', ') || parseResult.error.message;
        throw new Error('VALIDATION_ERROR: ' + message);
      }
      if (typeof payload.birthdate === 'string') {
        payload.birthdate = new Date(payload.birthdate);
      }
      payload.tutor_name = payload.tutor_name?.trim() || null;
      payload.secondary_phone = payload.secondary_phone?.trim() || null;
      payload.notes = payload.notes?.trim() || null;
    }

    // Generate Folio using maximum sequence across all records (including soft-deleted)
    const currentSequence = await this.submissionRepository.getNextFolioSequence(formIdentifier);
    const folio = await FolioGeneratorService.generate(config.folio_strategy, config.folio_prefix, currentSequence);
    
    // Inject folio into payload
    payload.folio = folio;

    // Save submission
    const saved = await this.submissionRepository.save(formIdentifier, payload);

    // CRITICAL BUG FIX: Mark reservation as completed AFTER successful save
    if (config.max_submissions !== null && config.max_submissions !== undefined && reservationToken) {
      await this.formReservationRepository.markAsCompleted(reservationToken);
    }

    return saved;
  }
}
