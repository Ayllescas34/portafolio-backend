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
import { CreateExperienceDto, UpdateExperienceDto } from './experiences.dto';
import { ExperiencesService } from './experiences.service';

@ApiTags('admin · experiences')
@ApiCookieAuth('session')
@Controller('admin/experiences')
export class ExperiencesController {
  constructor(private readonly service: ExperiencesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista paginada de experiencias laborales' })
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
  @ApiOperation({ summary: 'Crea una experiencia con responsabilidades, logros y tecnologías (transacción)' })
  create(@Body() dto: CreateExperienceDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza una experiencia; las listas enviadas reemplazan a las existentes' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExperienceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
