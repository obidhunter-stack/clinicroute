import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { v4 as uuidv4 } from 'uuid';

export interface UploadDocumentDto {
  caseId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  documentType?: string;
  base64Data?: string; // For direct upload
}

@Injectable()
export class DocumentsService {
  private readonly s3Bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {
    this.s3Bucket = configService.get<string>('S3_BUCKET_NAME') || 'clinicroute-documents';
  }

  async upload(dto: UploadDocumentDto, user: AuthenticatedUser) {
    // Verify case exists and user has access
    const caseData = await this.prisma.case.findFirst({
      where: {
        id: dto.caseId,
        clinicId: user.clinicId,
      },
    });

    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(dto.mimeType)) {
      throw new BadRequestException('File type not allowed');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (dto.sizeBytes > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Generate S3 key
    const s3Key = `${user.clinicId}/${dto.caseId}/${uuidv4()}-${dto.filename}`;

    // In production, upload to S3 here
    // For now, we'll just store the metadata

    const document = await this.prisma.document.create({
      data: {
        caseId: dto.caseId,
        filename: dto.filename,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        s3Bucket: this.s3Bucket,
        s3Key,
        documentType: (dto.documentType as any) || 'OTHER',
        uploadedById: user.id,
      },
    });

    await this.auditService.log({
      action: 'DOCUMENT_UPLOAD',
      entityType: 'Document',
      entityId: document.id,
      description: `Document ${dto.originalName} uploaded to case ${caseData.referenceNumber}`,
      userId: user.id,
      caseId: dto.caseId,
    });

    return document;
  }

  async findByCaseId(caseId: string, user: AuthenticatedUser) {
    // Verify case access
    const caseData = await this.prisma.case.findFirst({
      where: {
        id: caseId,
        clinicId: user.clinicId,
      },
    });

    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    return this.prisma.document.findMany({
      where: {
        caseId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        case: {
          select: {
            id: true,
            clinicId: true,
            referenceNumber: true,
          },
        },
      },
    });

    if (!document || document.case.clinicId !== user.clinicId) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async getDownloadUrl(id: string, user: AuthenticatedUser) {
    const document = await this.findOne(id, user);

    // Log download
    await this.auditService.log({
      action: 'DOCUMENT_DOWNLOAD',
      entityType: 'Document',
      entityId: id,
      description: `Document ${document.originalName} downloaded`,
      userId: user.id,
      caseId: document.caseId,
    });

    // In production, generate a presigned S3 URL
    // For now, return a placeholder
    return {
      url: `https://${this.s3Bucket}.s3.amazonaws.com/${document.s3Key}`,
      expiresIn: 3600,
    };
  }

  async delete(id: string, user: AuthenticatedUser) {
    const document = await this.findOne(id, user);

    // Soft delete
    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      action: 'DOCUMENT_DELETE',
      entityType: 'Document',
      entityId: id,
      description: `Document ${document.originalName} deleted`,
      userId: user.id,
      caseId: document.caseId,
    });

    return { message: 'Document deleted' };
  }

  // Get document types for dropdown
  getDocumentTypes() {
    return [
      { value: 'REFERRAL_LETTER', label: 'Referral Letter' },
      { value: 'CLINICAL_NOTES', label: 'Clinical Notes' },
      { value: 'INSURANCE_FORM', label: 'Insurance Form' },
      { value: 'AUTHORIZATION', label: 'Authorisation' },
      { value: 'LAB_RESULTS', label: 'Lab Results' },
      { value: 'IMAGING', label: 'Imaging' },
      { value: 'CONSENT_FORM', label: 'Consent Form' },
      { value: 'CORRESPONDENCE', label: 'Correspondence' },
      { value: 'OTHER', label: 'Other' },
    ];
  }
}
