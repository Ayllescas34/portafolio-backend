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
import { ApiConflictResponse, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { ReorderDto } from '../common/dto/reorder.dto';
import {
  CreateSkillCategoryDto,
  CreateSkillDto,
  SkillListQueryDto,
  UpdateSkillCategoryDto,
  UpdateSkillDto,
} from './skills.dto';
import { SkillsService } from './skills.service';

@ApiTags('admin · skill categories')
@ApiCookieAuth('session')
@Controller('admin/skill-categories')
export class SkillCategoriesController {
  constructor(private readonly service: SkillsService) {}

  @Get()
  @ApiOperation({ summary: 'Categorías de habilidades con número de habilidades' })
  list(@Query() query: ListQueryDto) {
    return this.service.listCategories(query);
  }

  @Put('order')
  @HttpCode(HttpStatus.NO_CONTENT)
  reorder(@Body() dto: ReorderDto) {
    return this.service.reorderCategories(dto.ids);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getCategory(id);
  }

  @Post()
  create(@Body() dto: CreateSkillCategoryDto) {
    return this.service.createCategory(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSkillCategoryDto) {
    return this.service.updateCategory(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConflictResponse({ description: 'La categoría contiene habilidades' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeCategory(id);
  }
}

@ApiTags('admin · skills')
@ApiCookieAuth('session')
@Controller('admin/skills')
export class SkillsController {
  constructor(private readonly service: SkillsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista paginada de habilidades (filtrable por categoría)' })
  list(@Query() query: SkillListQueryDto) {
    return this.service.listSkills(query);
  }

  @Put('order')
  @HttpCode(HttpStatus.NO_CONTENT)
  reorder(@Body() dto: ReorderDto) {
    return this.service.reorderSkills(dto.ids);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getSkill(id);
  }

  @Post()
  create(@Body() dto: CreateSkillDto) {
    return this.service.createSkill(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSkillDto) {
    return this.service.updateSkill(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeSkill(id);
  }
}
