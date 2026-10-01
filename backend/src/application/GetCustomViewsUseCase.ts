import { CustomViewRepository, CustomView } from '../domain/customView';

export class GetCustomViewsUseCase {
  constructor(private customViewRepository: CustomViewRepository) {}

  async execute(formIdentifier: string): Promise<CustomView[]> {
    return await this.customViewRepository.findByFormIdentifier(formIdentifier);
  }
}
