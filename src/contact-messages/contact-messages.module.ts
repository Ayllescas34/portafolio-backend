import { Module } from '@nestjs/common';
import { ContactMessagesController, PublicContactController } from './contact-messages.controller';
import { ContactMessagesService } from './contact-messages.service';

@Module({
  controllers: [PublicContactController, ContactMessagesController],
  providers: [ContactMessagesService],
})
export class ContactMessagesModule {}
