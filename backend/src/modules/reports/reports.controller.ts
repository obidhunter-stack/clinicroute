import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard statistics' })
  async getDashboardStats(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getDashboardStats(user);
  }

  @Get('weekly-trend')
  @ApiOperation({ summary: 'Get weekly case trend' })
  @ApiQuery({ name: 'weeks', required: false, type: Number, example: 4 })
  @ApiResponse({ status: 200, description: 'Returns weekly case volume' })
  async getWeeklyTrend(
    @CurrentUser() user: AuthenticatedUser,
    @Query('weeks') weeks?: number,
  ) {
    return this.reportsService.getWeeklyTrend(user, weeks || 4);
  }

  @Get('insurer-performance')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get insurer performance metrics' })
  @ApiResponse({ status: 200, description: 'Returns insurer performance data' })
  async getInsurerPerformance(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getInsurerPerformance(user);
  }

  @Get('sla-compliance')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get SLA compliance report' })
  @ApiResponse({ status: 200, description: 'Returns SLA compliance metrics' })
  async getSlaCompliance(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getSlaComplianceReport(user);
  }

  @Get('user-productivity')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get user productivity report' })
  @ApiResponse({ status: 200, description: 'Returns user productivity metrics' })
  async getUserProductivity(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getUserProductivity(user);
  }
}
