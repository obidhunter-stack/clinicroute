import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CLINICIAN = 'CLINICIAN',
}

export class LoginDto {
  @ApiProperty({
    example: 'emma.thompson@clinic.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    example: 'emma.thompson@clinic.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password (min 8 chars, must contain uppercase, lowercase, number)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, and a number or special character',
  })
  password: string;

  @ApiProperty({
    example: 'Emma',
    description: 'First name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    example: 'Thompson',
    description: 'Last name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    example: 'clinic-uuid-here',
    description: 'Clinic ID to associate user with',
  })
  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.CLINICIAN,
    description: 'User role (defaults to CLINICIAN)',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: UserRole })
  role: string;

  @ApiProperty()
  clinicId: string;

  @ApiProperty()
  clinicName: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'Bearer',
    description: 'Token type',
  })
  tokenType: string;

  @ApiProperty({
    example: '24h',
    description: 'Token expiration time',
  })
  expiresIn: string;

  @ApiProperty({
    type: AuthUserDto,
    description: 'User information',
  })
  user: AuthUserDto;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Current access token',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
