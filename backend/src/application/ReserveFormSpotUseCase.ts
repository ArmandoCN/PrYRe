import { FormConfigRepository } from '../domain/formConfig';
import { FormReservationRepository } from '../domain/formReservation';
import { SubmissionRepository } from '../domain/submission';

export class ReserveFormSpotUseCase {
  constructor(
    private formConfigRepository: FormConfigRepository,
    private formReservationRepository: FormReservationRepository,
    private submissionRepository: SubmissionRepository
  ) {}

  async execute(formIdentifier: string) {
    const config = await this.formConfigRepository.findByIdentifier(formIdentifier);

    if (!config) {
      throw new Error('Form configuration not found');
    }

    if (!config.is_active) {
      throw new Error('This form is currently inactive');
    }

    // Check if there's a limit
    if (config.max_submissions !== null && config.max_submissions !== undefined) {
      const completedCount = await this.submissionRepository.count(formIdentifier);
      const pendingReservations = await this.formReservationRepository.countActiveReservations(formIdentifier);
      
      const totalOccupied = completedCount + pendingReservations;
      
      if (totalOccupied >= config.max_submissions) {
        throw new Error('LIMIT_REACHED');
      }
    }

    // Create reservation
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.reservation_window_minutes);
    
    const reservation = await this.formReservationRepository.create(formIdentifier, expiresAt);
    
    return {
      reservation_token: reservation.id,
      expires_at: reservation.expires_at,
      reservation_window_minutes: config.reservation_window_minutes
    };
  }
}
