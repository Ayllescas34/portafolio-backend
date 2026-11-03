import { ArgumentsHost, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ThrottlerException } from '@nestjs/throttler';
import { AllExceptionsFilter, ErrorBody } from './all-exceptions.filter';

function prismaError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError('db error', { code, clientVersion: 'test', meta });
}

function run(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'GET', path: '/api/test' }),
    }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter().catch(exception, host);
  const body = json.mock.calls[0][0] as ErrorBody;
  return { status: (status.mock.calls[0] as unknown[])[0], body };
}

describe('AllExceptionsFilter', () => {
  beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => undefined));

  it('keeps validation details from BadRequestException', () => {
    const { status, body } = run(
      new BadRequestException({ message: 'Datos inválidos', details: [{ field: 'email', errors: ['x'] }] }),
    );
    expect(status).toBe(400);
    expect(body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Datos inválidos',
      details: [{ field: 'email', errors: ['x'] }],
      path: '/api/test',
    });
  });

  it('maps unique violations (P2002) to 409 with the fields', () => {
    const { status, body } = run(prismaError('P2002', { target: ['slug'] }));
    expect(status).toBe(409);
    expect(body.error.details).toEqual([{ field: 'slug', errors: ['debe ser único'] }]);
  });

  it('maps foreign key violations (P2003) to 409', () => {
    expect(run(prismaError('P2003')).status).toBe(409);
  });

  it('maps record not found (P2025) to 404', () => {
    expect(run(prismaError('P2025')).status).toBe(404);
  });

  it('translates throttling and generic auth messages', () => {
    expect(run(new ThrottlerException()).body.error.message).toMatch(/Demasiadas solicitudes/);
    expect(run(new UnauthorizedException()).body.error.message).toBe('No autorizado');
    expect(run(new NotFoundException('Proyecto no encontrado')).body.error.message).toBe('Proyecto no encontrado');
  });

  it('hides internals of unexpected errors', () => {
    const { status, body } = run(new Error('connection string postgres://secret'));
    expect(status).toBe(500);
    expect(body.error.message).toBe('Error interno del servidor');
    expect(JSON.stringify(body)).not.toContain('secret');
  });

  it('reports malformed JSON bodies as 400', () => {
    expect(run({ type: 'entity.parse.failed', status: 400 }).body.error.message).toBe('JSON inválido');
  });
});
