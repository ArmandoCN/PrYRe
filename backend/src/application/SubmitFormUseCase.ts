import { FormConfigRepository } from '../domain/formConfig';
import { SubmissionRepository, BaseSubmission } from '../domain/submission';
import { FormReservationRepository } from '../domain/formReservation';
import { User } from '../domain/user';
import bcrypt from 'bcrypt';
import { FolioGeneratorService } from './FolioGeneratorService';

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
      
      // Mark as completed
      await this.formReservationRepository.markAsCompleted(reservationToken);
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

    // Generate Folio
    const currentCount = await this.submissionRepository.count(formIdentifier);
    const folio = await FolioGeneratorService.generate(config.folio_strategy, config.folio_prefix, currentCount);
    
    // Inject folio into payload
    payload.folio = folio;

    return this.submissionRepository.save(formIdentifier, payload);
  }
}
