export interface CustomView {
  id: string; // UUID
  name: string;
  form_identifier: string;
  columns: any; // JSON
  filters: any; // JSON
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CustomViewRepository {
  save(customView: CustomView): Promise<void>;
  findById(id: string): Promise<CustomView | null>;
  findByFormIdentifier(formIdentifier: string): Promise<CustomView[]>;
  softDelete(id: string): Promise<void>;
}
