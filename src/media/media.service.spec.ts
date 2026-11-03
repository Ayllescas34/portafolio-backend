import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppConfigService } from '../config/app-config.service';
import { UPLOAD_PATH_PATTERN } from '../common/validators/url.validators';
import { MediaService } from './media.service';

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(16)]);
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

describe('MediaService', () => {
  let dir: string;
  let service: MediaService;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'media-'));
    service = new MediaService({ uploadsDir: dir } as AppConfigService);
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('stores a PNG under a random name that the validators accept', async () => {
    const stored = await service.store(PNG, 'image');
    expect(stored.mimeType).toBe('image/png');
    expect(stored.url).toMatch(UPLOAD_PATH_PATTERN);
    expect(await readdir(dir)).toHaveLength(1);
  });

  it('identifies files by content, not by declared type', async () => {
    await expect(service.store(PDF, 'image')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.store(PDF, 'document')).resolves.toMatchObject({ mimeType: 'application/pdf' });
  });

  it('rejects SVG (scriptable) files', async () => {
    await expect(service.store(SVG, 'image')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces the 2 MB image limit', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]);
    await expect(service.store(big, 'image')).rejects.toBeInstanceOf(PayloadTooLargeException);
  });

  it('requires a file', async () => {
    await expect(service.store(undefined, 'image')).rejects.toBeInstanceOf(BadRequestException);
  });
});
