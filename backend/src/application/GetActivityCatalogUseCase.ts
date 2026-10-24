import { SubmissionRepository, ActivityCatalogItem, BaseSubmission } from '../domain/submission';

export interface GetActivityCatalogResult {
  activities: ActivityCatalogItem[];
  latest_activity: ActivityCatalogItem | null;
}

export class GetActivityCatalogUseCase {
  constructor(private submissionRepository: SubmissionRepository) {}

  async execute(): Promise<GetActivityCatalogResult> {
    const activities = await this.submissionRepository.getActivitiesCatalog();
    return {
      activities,
      latest_activity: activities[0] || null
    };
  }

  async getParticipantsByActivity(activityId: string): Promise<BaseSubmission[]> {
    return await this.submissionRepository.getParticipantsByActivity(activityId);
  }

  async updateActivity(
    activityId: string,
    updates: {
      activity_date?: string | Date;
      total_capacity?: number;
      reserved_capacity?: number;
      real_capacity?: number;
    }
  ): Promise<BaseSubmission> {
    return await this.submissionRepository.updateActivityCatalog(activityId, updates);
  }

  async deleteParticipants(activityId: string, participantIds: string[]): Promise<number> {
    return await this.submissionRepository.deleteActivityParticipants(activityId, participantIds);
  }
}
