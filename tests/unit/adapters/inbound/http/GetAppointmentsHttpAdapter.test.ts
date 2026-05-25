import { APIGatewayProxyEvent } from 'aws-lambda';
import { GetAppointmentsHttpAdapter } from '../../../../../src/adapters/inbound/http/GetAppointmentsHttpAdapter';
import { IGetAppointmentsByInsuredUseCase } from '../../../../../src/core/ports/inbound/IGetAppointmentsByInsuredUseCase';
import { Appointment } from '../../../../../src/core/domain/entities/Appointment';

const mockUseCase: jest.Mocked<IGetAppointmentsByInsuredUseCase> = {
  execute: jest.fn(),
};

const buildEvent = (pathParameters: Record<string, string> | null): APIGatewayProxyEvent =>
  ({ pathParameters } as any);

const mockAppointment: Appointment = {
  appointmentId: 'uuid-1',
  insuredId: '00123',
  scheduleId: 100,
  countryISO: 'PE',
  status: 'completed',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T01:00:00Z',
};

describe('GetAppointmentsHttpAdapter', () => {
  let adapter: GetAppointmentsHttpAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new GetAppointmentsHttpAdapter(mockUseCase);
  });

  it('debe retornar 200 con la lista de agendamientos', async () => {
    mockUseCase.execute.mockResolvedValue([mockAppointment]);

    const result = await adapter.handle(buildEvent({ insuredId: '00123' }));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.appointments).toHaveLength(1);
    expect(body.appointments[0].status).toBe('completed');
  });

  it('debe pasar el insuredId correcto al caso de uso', async () => {
    mockUseCase.execute.mockResolvedValue([]);

    await adapter.handle(buildEvent({ insuredId: '00123' }));

    expect(mockUseCase.execute).toHaveBeenCalledWith('00123');
  });

  it('debe retornar 400 si insuredId no viene en los pathParameters', async () => {
    const result = await adapter.handle(buildEvent({}));

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain('insuredId es requerido');
  });

  it('debe retornar 400 si pathParameters es null', async () => {
    const result = await adapter.handle(buildEvent(null));

    expect(result.statusCode).toBe(400);
  });

  it('debe retornar 200 con arreglo vacio si el asegurado no tiene agendamientos', async () => {
    mockUseCase.execute.mockResolvedValue([]);

    const result = await adapter.handle(buildEvent({ insuredId: '00123' }));

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).appointments).toEqual([]);
  });
});
