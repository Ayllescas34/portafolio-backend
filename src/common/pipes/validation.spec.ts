import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { CreateContactMessageDto } from '../../contact-messages/contact-messages.dto';
import { CreateProjectDto } from '../../projects/projects.dto';
import { CreateSkillDto } from '../../skills/skills.dto';
import { createValidationPipe } from './validation';

const pipe = createValidationPipe();
const meta = (metatype: ArgumentMetadata['metatype']): ArgumentMetadata => ({ type: 'body', metatype });

async function errorsOf(metatype: ArgumentMetadata['metatype'], value: unknown) {
  try {
    await pipe.transform(value, meta(metatype));
  } catch (error) {
    if (error instanceof BadRequestException) {
      return (error.getResponse() as { details: { field: string; errors: string[] }[] }).details;
    }
    throw error;
  }
  return [];
}

describe('validation pipe', () => {
  it('sanitizes and normalizes valid contact messages', async () => {
    const result = (await pipe.transform(
      { name: '  Ana <b>López</b> ', email: ' ANA@Example.COM ', subject: 'Hola', message: 'Me interesa tu perfil.' },
      meta(CreateContactMessageDto),
    )) as CreateContactMessageDto;
    expect(result.name).toBe('Ana López');
    expect(result.email).toBe('ana@example.com');
  });

  it('reports every invalid field with Spanish messages', async () => {
    const details = await errorsOf(CreateContactMessageDto, {
      name: '',
      email: 'no-es-correo',
      subject: 'Hi',
      message: 'corto',
    });
    const fields = details.map((d) => d.field).sort();
    expect(fields).toEqual(['email', 'message', 'name', 'subject']);
    expect(details.find((d) => d.field === 'email')?.errors).toContain('debe ser un correo electrónico válido');
  });

  it('rejects unknown properties (mass assignment)', async () => {
    const details = await errorsOf(CreateContactMessageDto, {
      name: 'Ana',
      email: 'ana@example.com',
      subject: 'Hola',
      message: 'Mensaje suficientemente largo',
      status: 'READ',
    });
    expect(details).toEqual([{ field: 'status', errors: ['no es un campo permitido'] }]);
  });

  it('rejects dangerous URL schemes and invalid media paths', async () => {
    const details = await errorsOf(CreateProjectDto, {
      title: 'Proyecto',
      shortDescription: 'Descripción',
      repositoryUrl: 'javascript:alert(1)',
      coverImageUrl: '/uploads/../../etc/passwd',
    });
    expect(details.map((d) => d.field).sort()).toEqual(['coverImageUrl', 'repositoryUrl']);
  });

  it('validates nested project images', async () => {
    const details = await errorsOf(CreateProjectDto, {
      title: 'Proyecto',
      shortDescription: 'Descripción',
      images: [{ imageUrl: 'https://example.com/a.png', altText: '' }],
    });
    expect(details[0].field).toBe('images.0.altText');
  });

  it('does not accept percentages as proficiency', async () => {
    const details = await errorsOf(CreateSkillDto, {
      categoryId: '0b9d0f0e-6a1b-4c51-9a35-5f6d2f8a0001',
      name: 'Inglés',
      proficiencyLabel: '45%',
    });
    expect(details).toEqual([{ field: 'proficiencyLabel', errors: ['proficiencyLabel no admite porcentajes'] }]);
  });
});
