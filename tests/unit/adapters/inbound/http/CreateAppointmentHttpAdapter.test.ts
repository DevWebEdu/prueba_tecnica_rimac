import { APIGatewayProxyEvent } from 'aws-lambda';
import { CreateAppointmentHttpAdapter } from '../../../../../src/adapters/inbound/http/CreateAppointmentHttpAdapter';
import { ICreateAppointmentUseCase } from '../../../../../src/core/ports/inbound/ICreateAppointmentUseCase';
import { Appointment } from '../../../../../src/core/domain/entities/Appointment';

const mockUseCase: jest.Mocked<ICreateAppointmentUseCase> = {
  execute: jest.fn(),
};

const buildEvent = (body: object | null): APIGatewayProxyEvent =>
  ({ body: body ? JSON.stringify(body) : null } as any);

const mockAppointment: Appointment = {
  appointmentId: 'uuid-1',
  insuredId: '00123',
  scheduleId: 100,
  countryISO: 'PE',
  status: 'pending',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('CreateAppointmentHttpAdapter', () => {
  let adapter: CreateAppointmentHttpAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new CreateAppointmentHttpAdapter(mockUseCase);
  });

  it('debe retornar 202 con el appointmentId cuando el caso de uso es exitoso', async () => {
    mockUseCase.execute.mockResolvedValue(mockAppointment);

    const result = await adapter.handle(buildEvent({ insuredId: '00123', scheduleId: 100, countryISO: 'PE' }));

    expect(result.statusCode).toBe(202);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('El agendamiento esta en proceso');
    expect(body.appointmentId).toBe('uuid-1');
  });

  it('debe pasar los datos del body al caso de uso correctamente', async () => {
    mockUseCase.execute.mockResolvedValue(mockAppointment);

    await adapter.handle(buildEvent({ insuredId: '00123', scheduleId: 100, countryISO: 'CL' }));

    expect(mockUseCase.execute).toHaveBeenCalledWith({
      insuredId: '00123',
      scheduleId: 100,
      countryISO: 'CL',
    });
  });

  it('debe retornar 400 cuando el caso de uso lanza error de validacion', async () => {
    mockUseCase.execute.mockRejectedValue(new Error('insuredId must be a 5-digit string'));

    const result = await adapter.handle(buildEvent({ insuredId: '123', scheduleId: 100, countryISO: 'PE' }));

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain('insuredId must be');
  });

  it('debe retornar 500 cuando ocurre un error interno inesperado', async () => {
    mockUseCase.execute.mockRejectedValue(new Error('Internal server error'));

    const result = await adapter.handle(buildEvent({ insuredId: '00123', scheduleId: 100, countryISO: 'PE' }));

    expect(result.statusCode).toBe(500);
  });

  it('debe manejar body nulo sin lanzar excepcion', async () => {
    mockUseCase.execute.mockRejectedValue(new Error('insuredId must be a 5-digit string'));

    const result = await adapter.handle(buildEvent(null));

    expect(result.statusCode).toBe(400);
  });
});
