import { FormReservationRepository, FormReservation, ReservationStatus } from '../../domain/formReservation';

export class PrismaFormReservationRepository implements FormReservationRepository {
  constructor(private prismaClient: any) {}

  async create(form_identifier: string, expires_at: Date): Promise<FormReservation> {
    const reservation = await this.prismaClient.formReservation.create({
      data: {
        form_identifier,
        expires_at,
        status: 'PENDING'
      }
    });
    return reservation as FormReservation;
  }

  async findById(id: string): Promise<FormReservation | null> {
    const reservation = await this.prismaClient.formReservation.findUnique({
      where: { id }
    });
    return reservation as FormReservation | null;
  }

  async countActiveReservations(form_identifier: string): Promise<number> {
    const now = new Date();
    // Count reservations that are PENDING and not yet expired
    const count = await this.prismaClient.formReservation.count({
      where: {
        form_identifier,
        status: 'PENDING',
        expires_at: {
          gt: now
        }
      }
    });
    return count;
  }

  async markAsCompleted(id: string): Promise<void> {
    await this.prismaClient.formReservation.update({
      where: { id },
      data: { status: 'COMPLETED' }
    });
  }

  async markAsExpired(id: string): Promise<void> {
    await this.prismaClient.formReservation.update({
      where: { id },
      data: { status: 'EXPIRED' }
    });
  }
}
