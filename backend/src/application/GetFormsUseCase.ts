import { FormConfigRepository, FormConfig } from '../domain/formConfig';

export class GetFormsUseCase {
  constructor(private formConfigRepository: FormConfigRepository) {}

  async execute(): Promise<FormConfig[]> {
    return await this.formConfigRepository.findAll();
  }
}
