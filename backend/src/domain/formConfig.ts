export interface FormConfig {
  id: string;
  form_identifier: string;
  is_active: boolean;
  is_listed: boolean;
  public_password: string | null;
  confirmation_mode: 'SIMPLE' | 'CODE' | 'TICKET';
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface FormConfigRepository {
  findByIdentifier(identifier: string): Promise<FormConfig | null>;
  findAll(): Promise<FormConfig[]>;
  save(formConfig: FormConfig): Promise<void>;
}
