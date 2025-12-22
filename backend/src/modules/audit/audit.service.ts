import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';

export interface AuditLogInput {
  action: keyof typeof AuditAction;
  entityType: string;
  entityId: string;
  description: string;
  previousValue?: any;
  newValue?: any;
  userId?: string;
  caseId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQueryParams {
  entityType?: string;
  entityId?: string;
  userId?: string;
  caseId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: input.action as AuditAction,
          entityType: input.entityType,
          entityId: input.entityId,
          description: input.description,
          previousValue: input.previousValue ? JSON.parse(JSON.stringify(input.previousValue)) : undefined,
          newValue: input.newValue ? JSON.parse(JSON.stringify(input.newValue)) : undefined,
          userId: input.userId,
          caseId: input.caseId,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch (error) {
      // Don't throw - audit logging should never break the main flow
      this.logger.error('Failed to create audit log', error);
    }
  }

  async query(params: AuditQueryParams) {
    const {
      entityType,
      entityId,
      userId,
      caseId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = params;

    const where: Prisma.AuditLogWhereInput = {};

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (caseId) where.caseId = caseId;
    if (action) where.action = action;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          case: {
            select: {
              id: true,
              referenceNumber: true,
              patientFirstName: true,
              patientLastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getByCase(caseId: string) {
    return this.prisma.auditLog.findMany({
      where: { caseId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByUser(userId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      include: {
        case: {
          select: {
            id: true,
            referenceNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // GDPR: Export all audit logs for a specific entity
  async exportForGdpr(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
