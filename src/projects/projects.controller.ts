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
import { ReorderDto } from '../common/dto/reorder.dto';
import { CreateProjectDto, ProjectListQueryDto, UpdateProjectDto } from './projects.dto';
import { ProjectsService } from './projects.service';

@ApiTags('admin · projects')
@ApiCookieAuth('session')
@Controller('admin/projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista paginada de proyectos con filtros' })
  list(@Query() query: ProjectListQueryDto) {
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
  @ApiOperation({ summary: 'Crea un proyecto con tecnologías, responsabilidades e imágenes (transacción)' })
  create(@Body() dto: CreateProjectDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza un proyecto; las listas enviadas reemplazan a las existentes' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
