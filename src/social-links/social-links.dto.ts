import { PartialType } from '@nestjs/swagger';
import { SocialPlatform } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { SanitizedText } from '../common/transformers/text.transformers';
import { IsHttpUrl } from '../common/validators/url.validators';

export class CreateSocialLinkDto {
  @IsEnum(SocialPlatform)
  platform!: SocialPlatform;

  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label!: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsHttpUrl()
  url!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateSocialLinkDto extends PartialType(CreateSocialLinkDto) {}
