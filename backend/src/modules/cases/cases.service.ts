import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateCaseDto,
  UpdateCaseDto,
  UpdateCaseStatusDto,
  AddCaseNoteDto,
  QueryCasesDto,
  CaseStatus,
} from './dto/cases.dto';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { Prisma, CaseStatus as PrismaCaseStatus } from '@prisma/client';

@Injectable()
export class CasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ============================================
  // CREATE
  // ============================================

  async create(dto: CreateCaseDto, user: AuthenticatedUser) {
    // Generate reference number
    const referenceNumber = await this.generateReferenceNumber();

    // Get SLA deadline based on clinic settings
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: user.clinicId },
    });
    const slaDays = clinic?.slaDefaultDays || 5;
    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + slaDays);

    const caseData = await this.prisma.case.create({
      data: {
        referenceNumber,
        patientFirstName: dto.patientFirstName,
        patientLastName: dto.patientLastName,
        patientDob: new Date(dto.patientDob),
        patientNhsNumber: dto.patientNhsNumber,
        patientEmail: dto.patientEmail,
        patientPhone: dto.patientPhone,
        referralType: dto.referralType,
        referringClinician: dto.referringClinician,
        clinicalNotes: dto.clinicalNotes,
        insurerId: dto.insurerId,
        insurerPolicyNumber: dto.insurerPolicyNumber,
        priority: dto.priority || 'MEDIUM',
        status: 'RECEIVED',
        slaDeadline,
        clinicId: user.clinicId,
        createdById: user.id,
        assignedToId: dto.assignedToId || user.id,
        sourceType: dto.sourceType || 'PORTAL',
      },
      include: this.defaultInclude,
    });

    // Create initial status history
    await this.prisma.caseStatusHistory.create({
      data: {
        caseId: caseData.id,
        toStatus: 'RECEIVED',
        changedById: user.id,
        reason: 'Case created',
      },
    });

    // Audit log
    await this.auditService.log({
      action: 'CREATE',
      entityType: 'Case',
      entityId: caseData.id,
      description: `Case ${referenceNumber} created`,
      newValue: { referenceNumber, status: 'RECEIVED', priority: dto.priority },
      userId: user.id,
      caseId: caseData.id,
    });

    return caseData;
  }

  // ============================================
  // READ
  // ============================================

  async findAll(query: QueryCasesDto, user: AuthenticatedUser) {
    const {
      status,
      priority,
      assignedToId,
      insurerId,
      search,
      slaBreached,
      page = 1,
      limit = 20,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.CaseWhereInput = {
      clinicId: user.clinicId, // Clinic isolation
    };

    if (status) where.status = status as PrismaCaseStatus;
    if (priority) where.priority = priority as any;
    if (assignedToId) where.assignedToId = assignedToId;
    if (insurerId) where.insurerId = insurerId;
    if (slaBreached !== undefined) where.slaBreached = slaBreached;

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { patientFirstName: { contains: search, mode: 'insensitive' } },
        { patientLastName: { contains: search, mode: 'insensitive' } },
        { patientNhsNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        include: this.listInclude,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.case.count({ where }),
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

  async findOne(id: string, user: AuthenticatedUser) {
    const caseData = await this.prisma.case.findFirst({
      where: {
        id,
        clinicId: user.clinicId,
      },
      include: this.fullInclude,
    });

    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    // Log view action
    await this.auditService.log({
      action: 'VIEW',
      entityType: 'Case',
      entityId: id,
      description: `Case ${caseData.referenceNumber} viewed`,
      userId: user.id,
      caseId: id,
    });

    return caseData;
  }

  async findByReference(referenceNumber: string, user: AuthenticatedUser) {
    const caseData = await this.prisma.case.findFirst({
      where: {
        referenceNumber,
        clinicId: user.clinicId,
      },
      include: this.fullInclude,
    });

    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    return caseData;
  }

  // ============================================
  // UPDATE
  // ============================================

  async update(id: string, dto: UpdateCaseDto, user: AuthenticatedUser) {
    const existingCase = await this.findOne(id, user);

    const previousValue = {
      patientFirstName: existingCase.patientFirstName,
      patientLastName: existingCase.patientLastName,
      priority: existingCase.priority,
      assignedToId: existingCase.assignedToId,
    };

    const updatedCase = await this.prisma.case.update({
      where: { id },
      data: {
        ...(dto.patientFirstName && { patientFirstName: dto.patientFirstName }),
        ...(dto.patientLastName && { patientLastName: dto.patientLastName }),
        ...(dto.patientDob && { patientDob: new Date(dto.patientDob) }),
        ...(dto.patientNhsNumber && { patientNhsNumber: dto.patientNhsNumber }),
        ...(dto.patientEmail && { patientEmail: dto.patientEmail }),
        ...(dto.patientPhone && { patientPhone: dto.patientPhone }),
        ...(dto.referralType && { referralType: dto.referralType }),
        ...(dto.referringClinician && { referringClinician: dto.referringClinician }),
        ...(dto.clinicalNotes && { clinicalNotes: dto.clinicalNotes }),
        ...(dto.insurerId && { insurerId: dto.insurerId }),
        ...(dto.insurerPolicyNumber && { insurerPolicyNumber: dto.insurerPolicyNumber }),
        ...(dto.insurerAuthCode && { insurerAuthCode: dto.insurerAuthCode }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.assignedToId && { assignedToId: dto.assignedToId }),
      },
      include: this.defaultInclude,
    });

    // Audit log
    await this.auditService.log({
      action: 'UPDATE',
      entityType: 'Case',
      entityId: id,
      description: `Case ${existingCase.referenceNumber} updated`,
      previousValue,
      newValue: dto,
      userId: user.id,
      caseId: id,
    });

    return updatedCase;
  }

  // ============================================
  // STATUS MANAGEMENT
  // ============================================

  async updateStatus(id: string, dto: UpdateCaseStatusDto, user: AuthenticatedUser) {
    const existingCase = await this.findOne(id, user);
    const previousStatus = existingCase.status;

    // Validate status transition
    this.validateStatusTransition(previousStatus as CaseStatus, dto.status);

    const updateData: any = {
      status: dto.status,
    };

    // Set timestamps based on new status
    if (dto.status === 'SUBMITTED') {
      updateData.submittedAt = new Date();
    } else if (dto.status === 'APPROVED') {
      updateData.approvedAt = new Date();
    } else if (dto.status === 'CLOSED') {
      updateData.completedAt = new Date();
    }

    const updatedCase = await this.prisma.case.update({
      where: { id },
      data: updateData,
      include: this.defaultInclude,
    });

    // Create status history entry
    await this.prisma.caseStatusHistory.create({
      data: {
        caseId: id,
        fromStatus: previousStatus as PrismaCaseStatus,
        toStatus: dto.status as PrismaCaseStatus,
        changedById: user.id,
        reason: dto.reason,
      },
    });

    // Audit log
    await this.auditService.log({
      action: 'STATUS_CHANGE',
      entityType: 'Case',
      entityId: id,
      description: `Case ${existingCase.referenceNumber} status changed from ${previousStatus} to ${dto.status}`,
      previousValue: { status: previousStatus },
      newValue: { status: dto.status, reason: dto.reason },
      userId: user.id,
      caseId: id,
    });

    return updatedCase;
  }

  // ============================================
  // NOTES
  // ============================================

  async addNote(caseId: string, dto: AddCaseNoteDto, user: AuthenticatedUser) {
    const existingCase = await this.findOne(caseId, user);

    const note = await this.prisma.caseNote.create({
      data: {
        caseId,
        content: dto.content,
        isInternal: dto.isInternal ?? true,
        createdById: user.id,
      },
    });

    await this.auditService.log({
      action: 'NOTE_ADDED',
      entityType: 'Case',
      entityId: caseId,
      description: `Note added to case ${existingCase.referenceNumber}`,
      userId: user.id,
      caseId,
    });

    return note;
  }

  async getNotes(caseId: string, user: AuthenticatedUser) {
    await this.findOne(caseId, user); // Verify access

    return this.prisma.caseNote.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // ASSIGNMENT
  // ============================================

  async assign(caseId: string, assignedToId: string, user: AuthenticatedUser) {
    const existingCase = await this.findOne(caseId, user);
    const previousAssignee = existingCase.assignedToId;

    // Verify the assignee exists and is in the same clinic
    const assignee = await this.prisma.user.findFirst({
      where: {
        id: assignedToId,
        clinicId: user.clinicId,
        isActive: true,
      },
    });

    if (!assignee) {
      throw new BadRequestException('Invalid assignee');
    }

    const updatedCase = await this.prisma.case.update({
      where: { id: caseId },
      data: { assignedToId },
      include: this.defaultInclude,
    });

    await this.auditService.log({
      action: 'ASSIGNMENT_CHANGE',
      entityType: 'Case',
      entityId: caseId,
      description: `Case ${existingCase.referenceNumber} reassigned`,
      previousValue: { assignedToId: previousAssignee },
      newValue: { assignedToId },
      userId: user.id,
      caseId,
    });

    return updatedCase;
  }

  // ============================================
  // SLA MANAGEMENT
  // ============================================

  async checkSlaBreaches() {
    const now = new Date();

    // Find cases that have breached SLA
    const breachedCases = await this.prisma.case.updateMany({
      where: {
        slaDeadline: { lt: now },
        slaBreached: false,
        status: {
          notIn: ['CLOSED', 'CANCELLED'],
        },
      },
      data: {
        slaBreached: true,
      },
    });

    return { breachedCount: breachedCases.count };
  }

  async getOverdueCases(user: AuthenticatedUser) {
    return this.prisma.case.findMany({
      where: {
        clinicId: user.clinicId,
        slaBreached: true,
        status: {
          notIn: ['CLOSED', 'CANCELLED'],
        },
      },
      include: this.listInclude,
      orderBy: { slaDeadline: 'asc' },
    });
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getStats(user: AuthenticatedUser) {
    const clinicId = user.clinicId;

    const [
      totalCases,
      activeCases,
      overdueCases,
      todayCases,
      statusCounts,
      priorityCounts,
    ] = await Promise.all([
      this.prisma.case.count({ where: { clinicId } }),
      this.prisma.case.count({
        where: {
          clinicId,
          status: { notIn: ['CLOSED', 'CANCELLED'] },
        },
      }),
      this.prisma.case.count({
        where: {
          clinicId,
          slaBreached: true,
          status: { notIn: ['CLOSED', 'CANCELLED'] },
        },
      }),
      this.prisma.case.count({
        where: {
          clinicId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.case.groupBy({
        by: ['status'],
        where: { clinicId },
        _count: true,
      }),
      this.prisma.case.groupBy({
        by: ['priority'],
        where: { clinicId },
        _count: true,
      }),
    ]);

    return {
      totalCases,
      activeCases,
      overdueCases,
      todayCases,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byPriority: priorityCounts.reduce((acc, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private async generateReferenceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REF-${year}`;

    // Get the latest reference number for this year
    const latest = await this.prisma.case.findFirst({
      where: {
        referenceNumber: { startsWith: prefix },
      },
      orderBy: { referenceNumber: 'desc' },
    });

    let nextNumber = 1;
    if (latest) {
      const lastNumber = parseInt(latest.referenceNumber.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  }

  private validateStatusTransition(from: CaseStatus, to: CaseStatus) {
    const validTransitions: Record<CaseStatus, CaseStatus[]> = {
      [CaseStatus.RECEIVED]: [CaseStatus.SUBMITTED, CaseStatus.CANCELLED],
      [CaseStatus.SUBMITTED]: [CaseStatus.AWAITING_INSURER, CaseStatus.CANCELLED],
      [CaseStatus.AWAITING_INSURER]: [CaseStatus.APPROVED, CaseStatus.DENIED, CaseStatus.CANCELLED],
      [CaseStatus.APPROVED]: [CaseStatus.TREATMENT_SCHEDULED, CaseStatus.CANCELLED],
      [CaseStatus.DENIED]: [CaseStatus.CLOSED, CaseStatus.SUBMITTED], // Can resubmit
      [CaseStatus.TREATMENT_SCHEDULED]: [CaseStatus.CLOSED, CaseStatus.CANCELLED],
      [CaseStatus.CLOSED]: [],
      [CaseStatus.CANCELLED]: [],
    };

    if (!validTransitions[from]?.includes(to)) {
      throw new BadRequestException(
        `Invalid status transition from ${from} to ${to}`,
      );
    }
  }

  // Include configurations
  private readonly defaultInclude = {
    insurer: {
      select: { id: true, name: true, code: true },
    },
    assignedTo: {
      select: { id: true, firstName: true, lastName: true, email: true },
    },
    createdBy: {
      select: { id: true, firstName: true, lastName: true },
    },
  };

  private readonly listInclude = {
    ...this.defaultInclude,
  };

  private readonly fullInclude = {
    ...this.defaultInclude,
    clinic: {
      select: { id: true, name: true },
    },
    statusHistory: {
      orderBy: { createdAt: 'desc' as const },
      take: 10,
    },
    notes: {
      orderBy: { createdAt: 'desc' as const },
    },
    documents: {
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' as const },
    },
  };
}
