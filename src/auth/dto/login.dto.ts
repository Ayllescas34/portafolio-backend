import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { NormalizedEmail } from '../../common/transformers/text.transformers';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @NormalizedEmail()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ format: 'password' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class SessionAdminDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
}

export class SessionDto {
  @ApiProperty({ type: SessionAdminDto }) admin!: SessionAdminDto;
  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
}
