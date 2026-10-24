import { SubmissionRepository, BaseSubmission, ActivityCatalogItem } from '../../domain/submission';

export class PrismaSubmissionRepository implements SubmissionRepository {
  constructor(private prismaClient: any) {}

  async save(formIdentifier: string, payload: any): Promise<BaseSubmission> {
    const modelName = formIdentifier.charAt(0).toLowerCase() + formIdentifier.slice(1);
    const model = this.prismaClient[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found in database schema`);
    }

    if (formIdentifier === 'ActivityCatalog') {
      const total = Number(payload.total_capacity) || 0;
      const reserved = Number(payload.reserved_capacity) || 0;
      payload.total_capacity = total;
      payload.reserved_capacity = reserved;
      payload.real_capacity = Math.max(0, total - reserved);
      return await model.create({
        data: payload
      });
    }

    if (formIdentifier === 'ActivityParticipant') {
      return await this.prismaClient.$transaction(async (tx: any) => {
        const activity = await tx.activityCatalog.findFirst({
          where: { id: payload.activity_id, deleted_at: null }
        });
        if (!activity) {
          throw new Error('ACTIVITY_NOT_FOUND');
        }
        const registeredCount = await tx.activityParticipant.count({
          where: { activity_id: payload.activity_id, deleted_at: null }
        });
        if (registeredCount >= activity.real_capacity) {
          throw new Error('ACTIVITY_FULL');
        }
        if (!payload.activity_name) {
          payload.activity_name = activity.activity_name;
        }
        return await tx.activityParticipant.create({
          data: payload
        });
      });
    }

    return await model.create({
      data: payload
    });
  }

  async getActivitiesCatalog(): Promise<ActivityCatalogItem[]> {
    const activities = await this.prismaClient.activityCatalog.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' }
    });

    const counts = await this.prismaClient.activityParticipant.groupBy({
      by: ['activity_id'],
      where: { deleted_at: null },
      _count: { id: true }
    });

    const countMap = new Map<string, number>();
    counts.forEach((c: any) => {
      countMap.set(c.activity_id, c._count?.id || 0);
    });

    return activities.map((act: any) => {
      const registered_count = countMap.get(act.id) || 0;
      const available_spots = Math.max(0, act.real_capacity - registered_count);
      return {
        ...act,
        registered_count,
        available_spots,
        is_full: available_spots <= 0
      };
    });
  }

  async getParticipantsByActivity(activityId: string): Promise<BaseSubmission[]> {
    return await this.prismaClient.activityParticipant.findMany({
      where: { activity_id: activityId, deleted_at: null },
      orderBy: { created_at: 'desc' }
    });
  }

  async updateActivityCatalog(
    activityId: string,
    updates: {
      activity_date?: string | Date;
      total_capacity?: number;
      reserved_capacity?: number;
      real_capacity?: number;
    }
  ): Promise<BaseSubmission> {
    return await this.prismaClient.$transaction(async (tx: any) => {
      const existing = await tx.activityCatalog.findFirst({
        where: { id: activityId, deleted_at: null }
      });
      if (!existing) {
        throw new Error('ACTIVITY_NOT_FOUND');
      }

      const newDate = updates.activity_date ? new Date(updates.activity_date) : existing.activity_date;
      if (isNaN(new Date(newDate).getTime())) {
        throw new Error('VALIDATION_ERROR: Fecha de actividad inválida');
      }

      const newReserved =
        updates.reserved_capacity !== undefined
          ? Math.max(0, Math.trunc(Number(updates.reserved_capacity)))
          : existing.reserved_capacity;

      let newTotal = existing.total_capacity;
      let newReal = existing.real_capacity;

      if (updates.real_capacity !== undefined && updates.total_capacity === undefined) {
        newReal = Math.max(0, Math.trunc(Number(updates.real_capacity)));
        newTotal = Math.max(1, newReal + newReserved);
      } else if (updates.total_capacity !== undefined || updates.reserved_capacity !== undefined) {
        newTotal =
          updates.total_capacity !== undefined
            ? Math.max(1, Math.trunc(Number(updates.total_capacity)))
            : existing.total_capacity;
        if (newReserved > newTotal) {
          throw new Error('VALIDATION_ERROR: El cupo reservado no puede superar al cupo total');
        }
        newReal = Math.max(0, newTotal - newReserved);
      }

      const updated = await tx.activityCatalog.update({
        where: { id: activityId },
        data: {
          activity_date: newDate,
          total_capacity: newTotal,
          reserved_capacity: newReserved,
          real_capacity: newReal
        }
      });

      if (updates.activity_date) {
        const d = new Date(newDate);
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const yy = String(d.getUTCFullYear()).slice(-2);
        const newSnapshotLabel = `${existing.activity_name} (${dd}/${mm}/${yy})`;
        await tx.activityParticipant.updateMany({
          where: { activity_id: activityId, deleted_at: null },
          data: { activity_name: newSnapshotLabel }
        });
      }

      return updated;
    });
  }

  async deleteActivityParticipants(activityId: string, participantIds: string[]): Promise<number> {
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return 0;
    }
    const result = await this.prismaClient.activityParticipant.updateMany({
      where: {
        activity_id: activityId,
        id: { in: participantIds },
        deleted_at: null
      },
      data: {
        deleted_at: new Date()
      }
    });
    return result.count || 0;
  }

  async softDelete(formIdentifier: string, submissionId: string): Promise<void> {
    const modelName = formIdentifier.charAt(0).toLowerCase() + formIdentifier.slice(1);
    const model = this.prismaClient[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found in database schema`);
    }

    await model.update({
      where: { id: submissionId },
      data: { deleted_at: new Date() }
    });
  }

  async findById(formIdentifier: string, submissionId: string): Promise<BaseSubmission | null> {
    const modelName = formIdentifier.charAt(0).toLowerCase() + formIdentifier.slice(1);
    const model = this.prismaClient[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found in database schema`);
    }

    return await model.findFirst({
      where: { id: submissionId, deleted_at: null }
    });
  }

  async findMany(formIdentifier: string, includeDeleted = false): Promise<BaseSubmission[]> {
    const modelName = formIdentifier.charAt(0).toLowerCase() + formIdentifier.slice(1);
    const model = this.prismaClient[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found in database schema`);
    }

    const where = includeDeleted ? {} : { deleted_at: null };
    return await model.findMany({ where });
  }

  async count(formIdentifier: string): Promise<number> {
    const modelName = formIdentifier.charAt(0).toLowerCase() + formIdentifier.slice(1);
    const model = this.prismaClient[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found in database schema`);
    }
    return await model.count({ where: { deleted_at: null } });
  }

  async getNextFolioSequence(formIdentifier: string): Promise<number> {
    const modelName = formIdentifier.charAt(0).toLowerCase() + formIdentifier.slice(1);
    const model = this.prismaClient[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found in database schema`);
    }

    const rows = await model.findMany({
      select: { folio: true }
    });

    let maxSeq = rows.length;
    for (const row of rows) {
      if (typeof row.folio === 'string') {
        const match = row.folio.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }

    return maxSeq;
  }
}
