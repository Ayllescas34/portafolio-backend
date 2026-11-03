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
import { CreateSocialLinkDto, UpdateSocialLinkDto } from './social-links.dto';
import { SocialLinksService } from './social-links.service';

@ApiTags('admin · social links')
@ApiCookieAuth('session')
@Controller('admin/social-links')
export class SocialLinksController {
  constructor(private readonly service: SocialLinksService) {}

  @Get()
  @ApiOperation({ summary: 'Lista paginada de enlaces sociales' })
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
  create(@Body() dto: CreateSocialLinkDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSocialLinkDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
