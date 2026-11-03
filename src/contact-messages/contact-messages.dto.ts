import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContactMessageStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { NormalizedEmail, SanitizedText } from '../common/transformers/text.transformers';

export class CreateContactMessageDto {
  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @NormalizedEmail()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(160)
  subject!: string;

  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;

  /** Honeypot: hidden in the UI. Bots fill it; humans leave it empty. */
  @ApiPropertyOptional({ description: 'Debe ir vacío (anti-spam)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class UpdateContactMessageDto {
  @IsEnum(ContactMessageStatus)
  status!: ContactMessageStatus;
}

export class ContactMessageListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(ContactMessageStatus)
  status?: ContactMessageStatus;
}
