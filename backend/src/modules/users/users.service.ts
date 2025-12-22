import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import * as bcrypt from 'bcrypt';

export interface CreateUserDto {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role?: 'ADMIN' | 'MANAGER' | 'CLINICIAN';
  auth0Id?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: 'ADMIN' | 'MANAGER' | 'CLINICIAN';
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateUserDto, currentUser: AuthenticatedUser) {
    // Only admins can create users
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create users');
    }

    // Check if email exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 12)
      : null;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || 'CLINICIAN',
        clinicId: currentUser.clinicId,
        auth0Id: dto.auth0Id,
      },
      select: this.userSelect,
    });

    await this.auditService.log({
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      description: `User ${user.email} created`,
      userId: currentUser.id,
    });

    return user;
  }

  async findAll(currentUser: AuthenticatedUser) {
    return this.prisma.user.findMany({
      where: { clinicId: currentUser.clinicId },
      select: this.userSelect,
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(id: string, currentUser: AuthenticatedUser) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        clinicId: currentUser.clinicId,
      },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, currentUser: AuthenticatedUser) {
    // Only admins can update other users
    if (id !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update other users');
    }

    // Verify user exists in same clinic
    const existing = await this.findOne(id, currentUser);

    // Prevent role changes by non-admins
    if (dto.role && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can change roles');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.role && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: this.userSelect,
    });

    await this.auditService.log({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      description: `User ${user.email} updated`,
      previousValue: existing,
      newValue: dto,
      userId: currentUser.id,
    });

    return user;
  }

  async deactivate(id: string, currentUser: AuthenticatedUser) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can deactivate users');
    }

    if (id === currentUser.id) {
      throw new ForbiddenException('Cannot deactivate yourself');
    }

    const user = await this.findOne(id, currentUser);

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditService.log({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      description: `User ${user.email} deactivated`,
      userId: currentUser.id,
    });

    return { message: 'User deactivated' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentUser: AuthenticatedUser,
  ) {
    // Users can only change their own password
    if (userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Cannot change other users passwords');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found');
    }

    // Verify current password (skip for admin)
    if (userId === currentUser.id) {
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new ForbiddenException('Current password is incorrect');
      }
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await this.auditService.log({
      action: 'UPDATE',
      entityType: 'User',
      entityId: userId,
      description: 'Password changed',
      userId: currentUser.id,
    });

    return { message: 'Password updated' };
  }

  private readonly userSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    isActive: true,
    clinicId: true,
    createdAt: true,
    lastLoginAt: true,
  };
}
