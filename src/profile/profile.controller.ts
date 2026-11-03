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
import { CreateHighlightDto, UpdateHighlightDto, UpdateProfileDto, UpdateSiteSettingsDto } from './profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('admin · profile')
@ApiCookieAuth('session')
@Controller('admin')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Perfil profesional (incluye datos privados como el teléfono)' })
  getProfile() {
    return this.service.getProfile();
  }

  @Put('profile')
  @ApiOperation({ summary: 'Actualiza el perfil profesional' })
  updateProfile(@Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(dto);
  }

  @Get('site-settings')
  @ApiOperation({ summary: 'Configuración básica del sitio' })
  getSettings() {
    return this.service.getSettings();
  }

  @Put('site-settings')
  updateSettings(@Body() dto: UpdateSiteSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Get('profile-highlights')
  @ApiOperation({ summary: 'Forma de trabajo, intereses y valor aportado' })
  listHighlights(@Query() query: ListQueryDto) {
    return this.service.listHighlights(query);
  }

  @Put('profile-highlights/order')
  @HttpCode(HttpStatus.NO_CONTENT)
  reorderHighlights(@Body() dto: ReorderDto) {
    return this.service.reorderHighlights(dto.ids);
  }

  @Get('profile-highlights/:id')
  getHighlight(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getHighlight(id);
  }

  @Post('profile-highlights')
  createHighlight(@Body() dto: CreateHighlightDto) {
    return this.service.createHighlight(dto);
  }

  @Patch('profile-highlights/:id')
  updateHighlight(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateHighlightDto) {
    return this.service.updateHighlight(id, dto);
  }

  @Delete('profile-highlights/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeHighlight(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeHighlight(id);
  }
}
