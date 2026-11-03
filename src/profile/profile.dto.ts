import { PartialType } from '@nestjs/swagger';
import { HighlightKind, ThemePreference } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { NormalizedEmail, NullableText, NullableUrl, SanitizedText } from '../common/transformers/text.transformers';
import { IsMediaUrl } from '../common/validators/url.validators';

export class UpdateProfileDto {
  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  professionalTitle!: string;

  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(400)
  shortBio!: string;

  /** Complementary hero line (e.g. technologies and delivery scope). */
  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(300)
  tagline?: string | null;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(5000)
  longBio?: string | null;

  /** City and country only. Never a street address. */
  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(120)
  location?: string | null;

  @IsOptional()
  @NormalizedEmail()
  @NullableText()
  @IsEmail()
  @MaxLength(254)
  publicEmail?: string | null;

  @IsOptional()
  @NullableText()
  @Matches(/^\+?[0-9 ()-]{7,40}$/, { message: '$property debe ser un teléfono válido' })
  phone?: string | null;

  @IsOptional()
  @IsBoolean()
  isPhonePublic?: boolean;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(160)
  availability?: string | null;

  @IsOptional()
  @NullableUrl()
  @IsMediaUrl()
  profileImageUrl?: string | null;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(200)
  profileImageAlt?: string | null;

  @IsOptional()
  @NullableUrl()
  @IsMediaUrl()
  cvFileUrl?: string | null;
}

export class UpdateSiteSettingsDto {
  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  siteTitle!: string;

  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  siteDescription!: string;

  @IsOptional()
  @NullableUrl()
  @IsMediaUrl()
  ogImageUrl?: string | null;

  @IsOptional()
  @IsEnum(ThemePreference)
  defaultTheme?: ThemePreference;

  /** Only Spanish content exists today; the column is ready for "en". */
  @IsOptional()
  @IsIn(['es', 'en'])
  defaultLocale?: string;

  @IsOptional()
  @IsBoolean()
  contactFormEnabled?: boolean;
}

export class CreateHighlightDto {
  @IsEnum(HighlightKind)
  kind!: HighlightKind;

  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(600)
  description!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateHighlightDto extends PartialType(CreateHighlightDto) {}
