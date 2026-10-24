export interface BaseSubmission {
  id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  [key: string]: any; // Additional form fields
}

export interface ActivityCatalogItem {
  id: string;
  folio?: string | null;
  activity_name: string;
  activity_date: Date | string;
  total_capacity: number;
  reserved_capacity: number;
  real_capacity: number;
  registered_count: number;
  available_spots: number;
  is_full: boolean;
  created_at: Date;
  [key: string]: any;
}

export interface SubmissionRepository {
  save(formIdentifier: string, payload: any): Promise<BaseSubmission>;
  softDelete(formIdentifier: string, submissionId: string): Promise<void>;
  findById(formIdentifier: string, submissionId: string): Promise<BaseSubmission | null>;
  findMany(formIdentifier: string, includeDeleted?: boolean): Promise<BaseSubmission[]>;
  count(formIdentifier: string): Promise<number>;
  getNextFolioSequence(formIdentifier: string): Promise<number>;
  getActivitiesCatalog(): Promise<ActivityCatalogItem[]>;
  getParticipantsByActivity(activityId: string): Promise<BaseSubmission[]>;
  updateActivityCatalog(
    activityId: string,
    updates: {
      activity_date?: string | Date;
      total_capacity?: number;
      reserved_capacity?: number;
      real_capacity?: number;
    }
  ): Promise<BaseSubmission>;
  deleteActivityParticipants(activityId: string, participantIds: string[]): Promise<number>;
}

