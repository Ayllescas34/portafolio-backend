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
import { CreateEducationDto, UpdateEducationDto } from './education.dto';
import { EducationService } from './education.service';

@ApiTags('admin · education')
@ApiCookieAuth('session')
@Controller('admin/education')
export class EducationController {
  constructor(private readonly service: EducationService) {}

  @Get()
  @ApiOperation({ summary: 'Lista paginada de estudios' })
  list(@Query() query: ListQueryDto) {
    return this.service.list(query);
  }

  @Put('order')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reordena los estudios' })
  reorder(@Body() dto: ReorderDto) {
    return this.service.reorder(dto.ids);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() dto: CreateEducationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEducationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
