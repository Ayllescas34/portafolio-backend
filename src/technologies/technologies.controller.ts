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
  Query,
} from '@nestjs/common';
import { ApiConflictResponse, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { CreateTechnologyDto, UpdateTechnologyDto } from './technologies.dto';
import { TechnologiesService } from './technologies.service';

@ApiTags('admin · technologies')
@ApiCookieAuth('session')
@Controller('admin/technologies')
export class TechnologiesController {
  constructor(private readonly service: TechnologiesService) {}

  @Get()
  @ApiOperation({ summary: 'Tecnologías con su número de usos' })
  list(@Query() query: ListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() dto: CreateTechnologyDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTechnologyDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConflictResponse({ description: 'La tecnología está en uso' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
