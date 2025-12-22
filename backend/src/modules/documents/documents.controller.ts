import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService, UploadDocumentDto } from './documents.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a document' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  async upload(
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.upload(dto, user);
  }

  @Get('case/:caseId')
  @ApiOperation({ summary: 'Get all documents for a case' })
  @ApiResponse({ status: 200, description: 'Returns list of documents' })
  async findByCaseId(
    @Param('caseId') caseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.findByCaseId(caseId, user);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get document type options' })
  @ApiResponse({ status: 200, description: 'Returns document types' })
  getDocumentTypes() {
    return this.documentsService.getDocumentTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: 200, description: 'Returns the document' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.findOne(id, user);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get document download URL' })
  @ApiResponse({ status: 200, description: 'Returns presigned download URL' })
  async getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.getDownloadUrl(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document (soft delete)' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.delete(id, user);
  }
}
