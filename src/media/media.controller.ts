import { Controller, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsIn, IsOptional } from 'class-validator';
import { MAX_UPLOAD_BYTES, MediaService } from './media.service';
import type { MediaKind, StoredMedia } from './media.service';

class UploadQueryDto {
  @IsOptional()
  @IsIn(['image', 'document'])
  kind: MediaKind = 'image';
}

@ApiTags('admin · media')
@ApiCookieAuth('session')
@Controller('admin/media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @ApiOperation({ summary: 'Sube una imagen (PNG/JPEG/WebP, 2 MB) o un PDF (5 MB) al almacenamiento local' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'kind', enum: ['image', 'document'], required: false })
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  // No `dest` configured: Multer keeps the file in memory until it is validated.
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }))
  upload(@UploadedFile() file: Express.Multer.File | undefined, @Query() query: UploadQueryDto): Promise<StoredMedia> {
    return this.media.store(file?.buffer, query.kind);
  }
}
