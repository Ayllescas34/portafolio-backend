import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators';
import { PublicProjectQueryDto } from './public.dto';
import { PublicService } from './public.service';

@ApiTags('public')
@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly service: PublicService) {}

  @Get('portfolio')
  @ApiOperation({ summary: 'Contenido publicado del portafolio en una sola respuesta' })
  portfolio() {
    return this.service.portfolio();
  }

  @Get('projects')
  @ApiOperation({ summary: 'Proyectos publicados, filtrables por tecnología o categoría' })
  projects(@Query() query: PublicProjectQueryDto) {
    return this.service.projects(query);
  }

  @Get('projects/:slug')
  @ApiOperation({ summary: 'Detalle de un proyecto publicado' })
  @ApiNotFoundResponse()
  project(@Param('slug') slug: string) {
    return this.service.project(slug);
  }
}
