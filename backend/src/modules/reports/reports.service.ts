import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(user: AuthenticatedUser) {
    const clinicId = user.clinicId;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalActive,
      totalOverdue,
      newToday,
      newThisWeek,
      newThisMonth,
      avgProcessingTime,
      statusBreakdown,
      insurerBreakdown,
    ] = await Promise.all([
      // Total active cases
      this.prisma.case.count({
        where: {
          clinicId,
          status: { notIn: ['CLOSED', 'CANCELLED'] },
        },
      }),

      // Overdue cases
      this.prisma.case.count({
        where: {
          clinicId,
          slaBreached: true,
          status: { notIn: ['CLOSED', 'CANCELLED'] },
        },
      }),

      // New today
      this.prisma.case.count({
        where: {
          clinicId,
          createdAt: { gte: startOfToday },
        },
      }),

      // New this week
      this.prisma.case.count({
        where: {
          clinicId,
          createdAt: { gte: startOfWeek },
        },
      }),

      // New this month
      this.prisma.case.count({
        where: {
          clinicId,
          createdAt: { gte: startOfMonth },
        },
      }),

      // Average processing time (completed cases)
      this.getAverageProcessingTime(clinicId),

      // Status breakdown
      this.prisma.case.groupBy({
        by: ['status'],
        where: { clinicId },
        _count: true,
      }),

      // Insurer breakdown
      this.prisma.case.groupBy({
        by: ['insurerId'],
        where: { clinicId },
        _count: true,
      }),
    ]);

    // Get insurer names
    const insurerIds = insurerBreakdown.map((i) => i.insurerId);
    const insurers = await this.prisma.insurer.findMany({
      where: { id: { in: insurerIds } },
      select: { id: true, name: true },
    });

    const insurerMap = insurers.reduce(
      (acc, i) => ({ ...acc, [i.id]: i.name }),
      {} as Record<string, string>,
    );

    return {
      summary: {
        totalActive,
        totalOverdue,
        newToday,
        newThisWeek,
        newThisMonth,
        avgProcessingDays: avgProcessingTime,
      },
      byStatus: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      byInsurer: insurerBreakdown.map((i) => ({
        insurerId: i.insurerId,
        insurerName: insurerMap[i.insurerId] || 'Unknown',
        count: i._count,
      })),
    };
  }

  async getWeeklyTrend(user: AuthenticatedUser, weeks = 4) {
    const clinicId = user.clinicId;
    const data = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const [received, completed] = await Promise.all([
        this.prisma.case.count({
          where: {
            clinicId,
            createdAt: {
              gte: weekStart,
              lt: weekEnd,
            },
          },
        }),
        this.prisma.case.count({
          where: {
            clinicId,
            completedAt: {
              gte: weekStart,
              lt: weekEnd,
            },
          },
        }),
      ]);

      data.push({
        weekStart: weekStart.toISOString().split('T')[0],
        received,
        completed,
      });
    }

    return data;
  }

  async getInsurerPerformance(user: AuthenticatedUser) {
    const clinicId = user.clinicId;

    // Get all insurers with cases
    const insurerStats = await this.prisma.case.groupBy({
      by: ['insurerId'],
      where: {
        clinicId,
        status: 'CLOSED',
      },
      _count: true,
    });

    const results = [];

    for (const stat of insurerStats) {
      const insurer = await this.prisma.insurer.findUnique({
        where: { id: stat.insurerId },
        select: { name: true },
      });

      // Calculate average processing time for this insurer
      const cases = await this.prisma.case.findMany({
        where: {
          clinicId,
          insurerId: stat.insurerId,
          status: 'CLOSED',
          completedAt: { not: null },
        },
        select: {
          createdAt: true,
          completedAt: true,
          approvedAt: true,
        },
      });

      const processingTimes = cases
        .filter((c) => c.completedAt)
        .map((c) => {
          const diff = c.completedAt!.getTime() - c.createdAt.getTime();
          return diff / (1000 * 60 * 60 * 24); // Convert to days
        });

      const avgDays =
        processingTimes.length > 0
          ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
          : 0;

      // Approval rate
      const approvedCount = await this.prisma.case.count({
        where: {
          clinicId,
          insurerId: stat.insurerId,
          status: { in: ['APPROVED', 'TREATMENT_SCHEDULED', 'CLOSED'] },
        },
      });

      const totalDecided = await this.prisma.case.count({
        where: {
          clinicId,
          insurerId: stat.insurerId,
          status: { in: ['APPROVED', 'DENIED', 'TREATMENT_SCHEDULED', 'CLOSED'] },
        },
      });

      results.push({
        insurerId: stat.insurerId,
        insurerName: insurer?.name || 'Unknown',
        totalCases: stat._count,
        avgProcessingDays: Math.round(avgDays * 10) / 10,
        approvalRate: totalDecided > 0 ? Math.round((approvedCount / totalDecided) * 100) : 0,
      });
    }

    return results.sort((a, b) => b.totalCases - a.totalCases);
  }

  async getSlaComplianceReport(user: AuthenticatedUser) {
    const clinicId = user.clinicId;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalClosed, breachedClosed] = await Promise.all([
      this.prisma.case.count({
        where: {
          clinicId,
          status: 'CLOSED',
          completedAt: { gte: startOfMonth },
        },
      }),
      this.prisma.case.count({
        where: {
          clinicId,
          status: 'CLOSED',
          slaBreached: true,
          completedAt: { gte: startOfMonth },
        },
      }),
    ]);

    const complianceRate =
      totalClosed > 0
        ? Math.round(((totalClosed - breachedClosed) / totalClosed) * 100)
        : 100;

    return {
      period: 'Current Month',
      totalCompleted: totalClosed,
      onTime: totalClosed - breachedClosed,
      breached: breachedClosed,
      complianceRate,
    };
  }

  async getUserProductivity(user: AuthenticatedUser) {
    const clinicId = user.clinicId;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const users = await this.prisma.user.findMany({
      where: { clinicId, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });

    const results = [];

    for (const u of users) {
      const [assigned, completed] = await Promise.all([
        this.prisma.case.count({
          where: {
            assignedToId: u.id,
            createdAt: { gte: startOfMonth },
          },
        }),
        this.prisma.case.count({
          where: {
            assignedToId: u.id,
            status: 'CLOSED',
            completedAt: { gte: startOfMonth },
          },
        }),
      ]);

      results.push({
        userId: u.id,
        userName: `${u.firstName} ${u.lastName}`,
        casesAssigned: assigned,
        casesCompleted: completed,
      });
    }

    return results.sort((a, b) => b.casesCompleted - a.casesCompleted);
  }

  private async getAverageProcessingTime(clinicId: string): Promise<number> {
    const completedCases = await this.prisma.case.findMany({
      where: {
        clinicId,
        status: 'CLOSED',
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
      take: 100, // Last 100 cases for average
      orderBy: { completedAt: 'desc' },
    });

    if (completedCases.length === 0) return 0;

    const totalDays = completedCases.reduce((sum, c) => {
      const diff = c.completedAt!.getTime() - c.createdAt.getTime();
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0);

    return Math.round((totalDays / completedCases.length) * 10) / 10;
  }
}
