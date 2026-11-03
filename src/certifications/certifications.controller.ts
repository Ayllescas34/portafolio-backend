import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { ReorderDto } from '../common/dto/reorder.dto';
import { CreateCertificationDto, UpdateCertificationDto } from './certifications.dto';
import { CertificationsService } from './certifications.service';

@ApiTags('admin · certifications')
@ApiCookieAuth('session')
@Controller('admin/certifications')
export class CertificationsController {
  constructor(private readonly service: CertificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista paginada de certificaciones y cursos' })
  list(@Query() query: ListQueryDto) {
    return this.service.list(query);
  }

  @Put('order')
  @HttpCode(HttpStatus.NO_CONTENT)
  reorder(@Body() dto: ReorderDto) {
    return this.service.reorder(dto.ids);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() dto: CreateCertificationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCertificationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
