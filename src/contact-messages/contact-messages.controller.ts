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
import {
  ApiAcceptedResponse,
  ApiCookieAuth,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CONTACT_THROTTLE } from '../auth/auth.constants';
import { Public } from '../auth/decorators';
import { ContactMessageListQueryDto, CreateContactMessageDto, UpdateContactMessageDto } from './contact-messages.dto';
import { ContactMessagesService } from './contact-messages.service';

@ApiTags('public')
@Controller('public/contact')
export class PublicContactController {
  constructor(private readonly service: ContactMessagesService) {}

  @Public()
  @Throttle(CONTACT_THROTTLE)
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Envía un mensaje de contacto (se guarda localmente)' })
  @ApiAcceptedResponse({ description: 'Mensaje recibido' })
  @ApiTooManyRequestsResponse({ description: 'Límite de envíos alcanzado' })
  @ApiServiceUnavailableResponse({ description: 'Formulario deshabilitado' })
  async submit(@Body() dto: CreateContactMessageDto): Promise<{ received: true }> {
    await this.service.submit(dto);
    return { received: true };
  }
}

@ApiTags('admin · contact messages')
@ApiCookieAuth('session')
@Controller('admin/contact-messages')
export class ContactMessagesController {
  constructor(private readonly service: ContactMessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Mensajes recibidos (más recientes primero)' })
  list(@Query() query: ContactMessageListQueryDto) {
    return this.service.list(query);
  }

  @Get('unread-count')
  async unreadCount(): Promise<{ count: number }> {
    return { count: await this.service.countUnread() };
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Marca un mensaje como nuevo, leído o archivado' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateContactMessageDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
