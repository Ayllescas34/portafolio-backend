import { BadRequestException, Injectable, OnModuleInit, PayloadTooLargeException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AppConfigService } from '../config/app-config.service';

export type MediaKind = 'image' | 'document';

interface Signature {
  ext: string;
  mime: string;
  kind: MediaKind;
  matches: (b: Buffer) => boolean;
}

/**
 * The declared MIME type is not trusted: files are identified by their magic
 * bytes. SVG is deliberately not accepted (it can carry scripts).
 */
const SIGNATURES: Signature[] = [
  {
    ext: 'png',
    mime: 'image/png',
    kind: 'image',
    matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  { ext: 'jpg', mime: 'image/jpeg', kind: 'image', matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: 'webp',
    mime: 'image/webp',
    kind: 'image',
    matches: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
  { ext: 'pdf', mime: 'application/pdf', kind: 'document', matches: (b) => b.toString('ascii', 0, 5) === '%PDF-' },
];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export interface StoredMedia {
  url: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class MediaService implements OnModuleInit {
  constructor(private readonly config: AppConfigService) {}

  async onModuleInit(): Promise<void> {
    await mkdir(this.config.uploadsDir, { recursive: true });
  }

  detect(buffer: Buffer): Signature | undefined {
    return SIGNATURES.find((s) => buffer.length >= 12 && s.matches(buffer));
  }

  async store(buffer: Buffer | undefined, expected: MediaKind): Promise<StoredMedia> {
    if (!buffer?.length) throw new BadRequestException('Selecciona un archivo');
    const signature = this.detect(buffer);
    if (!signature || signature.kind !== expected) {
      throw new BadRequestException(
        expected === 'image' ? 'Solo se admiten imágenes PNG, JPEG o WebP' : 'Solo se admiten documentos PDF',
      );
    }
    if (signature.kind === 'image' && buffer.length > MAX_IMAGE_BYTES) {
      throw new PayloadTooLargeException('La imagen supera el máximo de 2 MB');
    }
    const name = `${randomUUID()}.${signature.ext}`;
    await writeFile(join(this.config.uploadsDir, name), buffer, { flag: 'wx' });
    return { url: `/uploads/${name}`, mimeType: signature.mime, size: buffer.length };
  }
}
