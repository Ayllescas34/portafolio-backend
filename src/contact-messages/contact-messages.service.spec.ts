import { ServiceUnavailableException } from '@nestjs/common';
import { ContactMessageStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContactMessagesService } from './contact-messages.service';

const message = { name: 'Ana', email: 'ana@example.com', subject: 'Hola', message: 'Me interesa tu perfil.' };

describe('ContactMessagesService', () => {
  let prisma: {
    siteSettings: { findUnique: jest.Mock };
    contactMessage: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
  };
  let service: ContactMessagesService;

  beforeEach(() => {
    prisma = {
      siteSettings: { findUnique: jest.fn().mockResolvedValue({ contactFormEnabled: true }) },
      contactMessage: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
    service = new ContactMessagesService(prisma as unknown as PrismaService);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('stores the message without the honeypot field', async () => {
    await service.submit({ ...message, website: '' });
    expect(prisma.contactMessage.create).toHaveBeenCalledWith({ data: message });
  });

  it('silently discards messages that filled the honeypot', async () => {
    await expect(service.submit({ ...message, website: 'http://spam.example' })).resolves.toBeUndefined();
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it('refuses messages when the form is disabled', async () => {
    prisma.siteSettings.findUnique.mockResolvedValue({ contactFormEnabled: false });
    await expect(service.submit(message)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('sets readAt when marking as read and clears it when marking as new', async () => {
    prisma.contactMessage.findUnique.mockResolvedValue({ id: 'm', readAt: null });
    await service.updateStatus('m', { status: ContactMessageStatus.READ });
    expect(prisma.contactMessage.update.mock.calls[0][0].data.readAt).toBeInstanceOf(Date);

    prisma.contactMessage.findUnique.mockResolvedValue({ id: 'm', readAt: new Date() });
    await service.updateStatus('m', { status: ContactMessageStatus.NEW });
    expect(prisma.contactMessage.update.mock.calls[1][0].data.readAt).toBeNull();
  });
});
