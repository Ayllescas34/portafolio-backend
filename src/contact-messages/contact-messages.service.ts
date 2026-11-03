import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ContactMessage, ContactMessageStatus, Prisma } from '@prisma/client';
import { pageArgs, PaginatedResult, resolveOrderBy } from '../common/pagination/paginated-result';
import { ensureFound } from '../common/utils/ordering';
import { PrismaService } from '../prisma/prisma.service';
import { ContactMessageListQueryDto, CreateContactMessageDto, UpdateContactMessageDto } from './contact-messages.dto';

const SORTABLE = ['createdAt', 'status', 'name', 'email'] as const;

@Injectable()
export class ContactMessagesService {
  private readonly logger = new Logger(ContactMessagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Stores a message locally. No email is sent in this phase. */
  async submit(dto: CreateContactMessageDto): Promise<void> {
    const settings = await this.prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { contactFormEnabled: true },
    });
    if (settings && !settings.contactFormEnabled) {
      throw new ServiceUnavailableException('El formulario de contacto no está disponible en este momento');
    }
    const { website, ...message } = dto;
    if (website) {
      // Honeypot filled: answer as if accepted so bots learn nothing.
      this.logger.warn('Mensaje de contacto descartado por el filtro anti-spam');
      return;
    }
    await this.prisma.contactMessage.create({ data: message });
  }

  async list(query: ContactMessageListQueryDto): Promise<PaginatedResult<ContactMessage>> {
    const where: Prisma.ContactMessageWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { subject: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: resolveOrderBy(query.sortBy, query.sortOrder, SORTABLE, [{ createdAt: 'desc' }]),
        ...pageArgs(query),
      }),
      this.prisma.contactMessage.count({ where }),
    ]);
    return PaginatedResult.of(items, total, query);
  }

  async get(id: string): Promise<ContactMessage> {
    return ensureFound(await this.prisma.contactMessage.findUnique({ where: { id } }), 'Mensaje');
  }

  countUnread(): Promise<number> {
    return this.prisma.contactMessage.count({ where: { status: ContactMessageStatus.NEW } });
  }

  async updateStatus(id: string, dto: UpdateContactMessageDto): Promise<ContactMessage> {
    const current = await this.get(id);
    const readAt = dto.status === ContactMessageStatus.NEW ? null : (current.readAt ?? new Date());
    return this.prisma.contactMessage.update({ where: { id }, data: { status: dto.status, readAt } });
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.prisma.contactMessage.delete({ where: { id } });
  }
}
