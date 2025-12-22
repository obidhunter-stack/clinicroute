import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService, AuditQueryParams } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Query audit logs' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'caseId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated audit logs',
  })
  async query(@Query() params: AuditQueryParams) {
    return this.auditService.query(params);
  }

  @Get('case/:caseId')
  @ApiOperation({ summary: 'Get audit logs for a specific case' })
  @ApiResponse({
    status: 200,
    description: 'Returns all audit logs for the specified case',
  })
  async getByCaseId(@Param('caseId') caseId: string) {
    return this.auditService.getByCase(caseId);
  }

  @Get('user/:userId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  @ApiResponse({
    status: 200,
    description: 'Returns recent audit logs for the specified user',
  })
  async getByUserId(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getByUser(userId, limit);
  }

  @Get('my-activity')
  @ApiOperation({ summary: 'Get current user activity log' })
  @ApiResponse({
    status: 200,
    description: 'Returns audit logs for the current user',
  })
  async getMyActivity(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getByUser(user.id, limit);
  }

  @Get('export/:entityType/:entityId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export audit logs for GDPR compliance' })
  @ApiResponse({
    status: 200,
    description: 'Returns complete audit trail for the specified entity',
  })
  async exportForGdpr(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.exportForGdpr(entityType, entityId);
  }
}
