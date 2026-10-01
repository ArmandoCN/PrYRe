import { CustomViewRepository, CustomView } from '../domain/customView';
import { User, Role } from '../domain/user';
import * as crypto from 'crypto';

export class ManageCustomViewUseCase {
  constructor(private repository: CustomViewRepository) {}

  async execute(user: User, payload: { name: string, form_identifier: string, columns: any, filters: any }): Promise<CustomView> {
    if (user.role !== Role.ADMIN) {
      throw new Error('Forbidden: Only ADMIN can manage custom views');
    }

    const view: CustomView = {
      id: crypto.randomUUID(),
      name: payload.name,
      form_identifier: payload.form_identifier,
      columns: payload.columns,
      filters: payload.filters,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null
    };

    await this.repository.save(view);

    return view;
  }
}
