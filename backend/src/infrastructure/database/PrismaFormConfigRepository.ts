import { FormConfigRepository, FormConfig } from '../../domain/formConfig';

export class PrismaFormConfigRepository implements FormConfigRepository {
  constructor(private prismaClient: any) {}

  async findByIdentifier(identifier: string): Promise<FormConfig | null> {
    const config = await this.prismaClient.formConfig.findUnique({
      where: { form_identifier: identifier, deleted_at: null }
    });

    if (!config) return null;

    return {
      id: config.id,
      form_identifier: config.form_identifier,
      is_active: config.is_active,
      is_listed: config.is_listed,
      public_password: config.public_password,
      confirmation_mode: config.confirmation_mode,
      folio_strategy: config.folio_strategy,
      folio_prefix: config.folio_prefix,
      max_submissions: config.max_submissions,
      reservation_window_minutes: config.reservation_window_minutes,
      created_at: config.created_at,
      updated_at: config.updated_at,
      deleted_at: config.deleted_at
    };
  }

  async findAll(): Promise<FormConfig[]> {
    const configs = await this.prismaClient.formConfig.findMany({
      where: { deleted_at: null }
    });

    return configs.map((config: any) => ({
      id: config.id,
      form_identifier: config.form_identifier,
      is_active: config.is_active,
      is_listed: config.is_listed,
      public_password: config.public_password,
      confirmation_mode: config.confirmation_mode,
      folio_strategy: config.folio_strategy,
      folio_prefix: config.folio_prefix,
      max_submissions: config.max_submissions,
      reservation_window_minutes: config.reservation_window_minutes,
      created_at: config.created_at,
      updated_at: config.updated_at,
      deleted_at: config.deleted_at
    }));
  }

  async save(formConfig: FormConfig): Promise<void> {
    await this.prismaClient.formConfig.upsert({
      where: { id: formConfig.id },
      update: {
        is_active: formConfig.is_active,
        is_listed: formConfig.is_listed,
        public_password: formConfig.public_password,
        confirmation_mode: formConfig.confirmation_mode,
        folio_strategy: formConfig.folio_strategy,
        folio_prefix: formConfig.folio_prefix,
        max_submissions: formConfig.max_submissions,
        reservation_window_minutes: formConfig.reservation_window_minutes,
        updated_at: formConfig.updated_at,
        deleted_at: formConfig.deleted_at
      },
      create: {
        id: formConfig.id,
        form_identifier: formConfig.form_identifier,
        is_active: formConfig.is_active,
        is_listed: formConfig.is_listed,
        public_password: formConfig.public_password,
        confirmation_mode: formConfig.confirmation_mode,
        folio_strategy: formConfig.folio_strategy,
        folio_prefix: formConfig.folio_prefix,
        max_submissions: formConfig.max_submissions,
        reservation_window_minutes: formConfig.reservation_window_minutes,
        created_at: formConfig.created_at,
        updated_at: formConfig.updated_at,
        deleted_at: formConfig.deleted_at
      }
    });
  }
}
