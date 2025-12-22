import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsEmail,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum CaseStatus {
  RECEIVED = 'RECEIVED',
  SUBMITTED = 'SUBMITTED',
  AWAITING_INSURER = 'AWAITING_INSURER',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  TREATMENT_SCHEDULED = 'TREATMENT_SCHEDULED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum CasePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum CaseSource {
  PORTAL = 'PORTAL',
  EMAIL = 'EMAIL',
  API = 'API',
  PHONE = 'PHONE',
}

// ============================================
// CREATE CASE
// ============================================

export class CreateCaseDto {
  @ApiProperty({ example: 'Sarah', description: 'Patient first name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  patientFirstName: string;

  @ApiProperty({ example: 'Mitchell', description: 'Patient last name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  patientLastName: string;

  @ApiProperty({ example: '1985-03-15', description: 'Patient date of birth' })
  @IsDateString()
  @IsNotEmpty()
  patientDob: string;

  @ApiPropertyOptional({ example: '123 456 7890', description: 'NHS number' })
  @IsOptional()
  @IsString()
  patientNhsNumber?: string;

  @ApiPropertyOptional({ example: 'patient@email.com' })
  @IsOptional()
  @IsEmail()
  patientEmail?: string;

  @ApiPropertyOptional({ example: '+44 7700 900000' })
  @IsOptional()
  @IsString()
  patientPhone?: string;

  @ApiProperty({ example: 'MRI Scan', description: 'Type of referral' })
  @IsString()
  @IsNotEmpty()
  referralType: string;

  @ApiProperty({ example: 'Dr. James Wilson', description: 'Referring clinician name' })
  @IsString()
  @IsNotEmpty()
  referringClinician: string;

  @ApiPropertyOptional({ description: 'Clinical notes and additional information' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  clinicalNotes?: string;

  @ApiProperty({ description: 'Insurer UUID' })
  @IsUUID()
  @IsNotEmpty()
  insurerId: string;

  @ApiPropertyOptional({ example: 'POL123456', description: 'Insurance policy number' })
  @IsOptional()
  @IsString()
  insurerPolicyNumber?: string;

  @ApiPropertyOptional({ enum: CasePriority, default: CasePriority.MEDIUM })
  @IsOptional()
  @IsEnum(CasePriority)
  priority?: CasePriority;

  @ApiPropertyOptional({ description: 'User UUID to assign case to' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ enum: CaseSource, default: CaseSource.PORTAL })
  @IsOptional()
  @IsEnum(CaseSource)
  sourceType?: CaseSource;
}

// ============================================
// UPDATE CASE
// ============================================

export class UpdateCaseDto extends PartialType(CreateCaseDto) {
  @ApiPropertyOptional({ example: 'AUTH123456', description: 'Insurer authorisation code' })
  @IsOptional()
  @IsString()
  insurerAuthCode?: string;
}

// ============================================
// UPDATE STATUS
// ============================================

export class UpdateCaseStatusDto {
  @ApiProperty({ enum: CaseStatus, description: 'New case status' })
  @IsEnum(CaseStatus)
  @IsNotEmpty()
  status: CaseStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ============================================
// ADD NOTE
// ============================================

export class AddCaseNoteDto {
  @ApiProperty({ description: 'Note content' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ default: true, description: 'Is this an internal note?' })
  @IsOptional()
  isInternal?: boolean;
}

// ============================================
// QUERY / FILTER
// ============================================

export class QueryCasesDto {
  @ApiPropertyOptional({ enum: CaseStatus })
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @ApiPropertyOptional({ enum: CasePriority })
  @IsOptional()
  @IsEnum(CasePriority)
  priority?: CasePriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  insurerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by SLA breached status' })
  @IsOptional()
  slaBreached?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ default: 'updatedAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// RESPONSE DTOs
// ============================================

export class CaseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  referenceNumber: string;

  @ApiProperty()
  patientFirstName: string;

  @ApiProperty()
  patientLastName: string;

  @ApiProperty()
  patientDob: Date;

  @ApiProperty()
  referralType: string;

  @ApiProperty()
  referringClinician: string;

  @ApiProperty({ enum: CaseStatus })
  status: CaseStatus;

  @ApiProperty({ enum: CasePriority })
  priority: CasePriority;

  @ApiProperty()
  slaDeadline: Date;

  @ApiProperty()
  slaBreached: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CaseListResponseDto {
  @ApiProperty({ type: [CaseResponseDto] })
  items: CaseResponseDto[];

  @ApiProperty()
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
