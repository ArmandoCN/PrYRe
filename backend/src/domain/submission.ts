export interface BaseSubmission {
  id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  [key: string]: any; // Additional form fields
}

export interface SubmissionRepository {
  save(formIdentifier: string, payload: any): Promise<BaseSubmission>;
  softDelete(formIdentifier: string, submissionId: string): Promise<void>;
  findById(formIdentifier: string, submissionId: string): Promise<BaseSubmission | null>;
  findMany(formIdentifier: string, includeDeleted?: boolean): Promise<BaseSubmission[]>;
}
