import { CustomViewRepository, CustomView } from '../../domain/customView';

export class PrismaCustomViewRepository implements CustomViewRepository {
  constructor(private prismaClient: any) {}

  async save(customView: CustomView): Promise<void> {
    await this.prismaClient.customView.create({
      data: {
        id: customView.id,
        name: customView.name,
        form_identifier: customView.form_identifier,
        columns: customView.columns,
        filters: customView.filters,
        created_at: customView.created_at,
        updated_at: customView.updated_at,
        deleted_at: customView.deleted_at
      }
    });
  }

  async findById(id: string): Promise<CustomView | null> {
    return await this.prismaClient.customView.findUnique({
      where: { id, deleted_at: null }
    });
  }

  async findByFormIdentifier(formIdentifier: string): Promise<CustomView[]> {
    return await this.prismaClient.customView.findMany({
      where: { form_identifier: formIdentifier, deleted_at: null }
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prismaClient.customView.update({
      where: { id },
      data: { deleted_at: new Date() }
    });
  }
}
