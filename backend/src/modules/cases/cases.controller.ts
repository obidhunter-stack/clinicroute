import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CasesService } from './cases.service';
import {
  CreateCaseDto,
  UpdateCaseDto,
  UpdateCaseStatusDto,
  AddCaseNoteDto,
  QueryCasesDto,
  CaseResponseDto,
  CaseListResponseDto,
} from './dto/cases.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@ApiTags('Cases')
@ApiBearerAuth()
@Controller('cases')
@UseGuards(RolesGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  // ============================================
  // CREATE
  // ============================================

  @Post()
  @ApiOperation({ summary: 'Create a new case/referral' })
  @ApiResponse({
    status: 201,
    description: 'Case created successfully',
    type: CaseResponseDto,
  })
  async create(
    @Body() dto: CreateCaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.casesService.create(dto, user);
  }

  // ============================================
  // READ
  // ============================================

  @Get()
  @ApiOperation({ summary: 'List all cases with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of cases',
    type: CaseListResponseDto,
  })
  async findAll(
    @Query() query: QueryCasesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.casesService.findAll(query, user);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get case statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns case statistics for the clinic',
  })
  async getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.casesService.getStats(user);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get all overdue cases' })
  @ApiResponse({
    status: 200,
    description: 'Returns all cases that have breached SLA',
  })
  async getOverdue(@CurrentUser() user: AuthenticatedUser) {
    return this.casesService.getOverdueCases(user);
  }

  @Get('reference/:referenceNumber')
  @ApiOperation({ summary: 'Get case by reference number' })
  @ApiParam({ name: 'referenceNumber', example: 'REF-2024-0001' })
  @ApiResponse({
    status: 200,
    description: 'Returns the case',
    type: CaseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async findByReference(
    @Param('referenceNumber') referenceNumber: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.casesService.findByReference(referenceNumber, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get case by ID' })
  @ApiParam({ name: 'id', description: 'Case UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the case with full details',
    type: CaseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.casesService.findOne(id, user);
  }

  // ============================================
  // UPDATE
  // ============================================

  @Put(':id')
  @ApiOperation({ summary: 'Update case details' })
  @ApiParam({ name: 'id', description: 'Case UUID' })
  @ApiResponse({
    status: 200,
    description: 'Case updated successfully',
    type: CaseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.casesService.update(id, dto, user);
  }

  // ============================================
  // STATUS
  // ============================================

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update case status' })
  @ApiParam({ name: 'id', description: 'Case UUID' })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    type: CaseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCaseStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.casesService.updateStatus(id, dto, user);
  }

  // ============================================
  // ASSIGNMENT
  // ============================================

  @Patch(':id/assign')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Assign case to a user' })
  @ApiParam({ name: 'id', description: 'Case UUID' })
  @ApiResponse({
    status: 200,
    description: 'Case assigned successfully',
    type: CaseResponseDto,
  })
  async assign(
    @Param('id') id: string,
    @Body('assignedToId') assignedToId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.casesService.assign(id, assignedToId, user);
  }

  // ============================================
  // NOTES
  // ============================================

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add a note to a case' })
  @ApiParam({ name: 'id', description: 'Case UUID' })
  @ApiResponse({
    status: 201,
    description: 'Note added successfully',
  })
  async addNote(
    @Param('id') id: string,
    @Body() dto: AddCaseNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.casesService.addNote(id, dto, user);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get all notes for a case' })
  @ApiParam({ name: 'id', description: 'Case UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all notes for the case',
  })
  async getNotes(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.casesService.getNotes(id, user);
  }

  // ============================================
  // SLA CHECK (Admin/System)
  // ============================================

  @Post('sla/check')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run SLA breach check (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns count of newly breached cases',
  })
  async checkSlaBreach() {
    return this.casesService.checkSlaBreaches();
  }
}
