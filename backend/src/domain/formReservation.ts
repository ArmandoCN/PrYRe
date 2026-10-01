export type ReservationStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export interface FormReservation {
  id: string;
  form_identifier: string;
  status: ReservationStatus;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface FormReservationRepository {
  create(form_identifier: string, expires_at: Date): Promise<FormReservation>;
  findById(id: string): Promise<FormReservation | null>;
  countActiveReservations(form_identifier: string): Promise<number>;
  markAsCompleted(id: string): Promise<void>;
  markAsExpired(id: string): Promise<void>;
}
