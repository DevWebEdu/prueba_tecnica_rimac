import { GetAppointmentsByInsuredUseCase } from '../../../../src/core/use-cases/GetAppointmentsByInsuredUseCase';
import { IAppointmentDynamoRepository } from '../../../../src/core/ports/outbound/IAppointmentDynamoRepository';
import { Appointment } from '../../../../src/core/domain/entities/Appointment';

const buildAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  appointmentId: 'uuid-1',
  insuredId: '00123',
  scheduleId: 100,
  countryISO: 'PE',
  status: 'pending',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const mockDynamoRepository: jest.Mocked<IAppointmentDynamoRepository> = {
  save: jest.fn(),
  findByInsuredId: jest.fn(),
  updateStatus: jest.fn(),
};

describe('GetAppointmentsByInsuredUseCase', () => {
  let useCase: GetAppointmentsByInsuredUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetAppointmentsByInsuredUseCase(mockDynamoRepository);
  });

  describe('consulta exitosa', () => {
    it('debe retornar todos los agendamientos del asegurado con sus estados', async () => {
      mockDynamoRepository.findByInsuredId.mockResolvedValue([
        buildAppointment({ status: 'pending' }),
        buildAppointment({ appointmentId: 'uuid-2', status: 'completed' }),
      ]);

      const result = await useCase.execute('00123');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('pending');
      expect(result[1].status).toBe('completed');
    });

    it('debe pasar el insuredId exacto al repositorio', async () => {
      mockDynamoRepository.findByInsuredId.mockResolvedValue([]);

      await useCase.execute('00123');

      expect(mockDynamoRepository.findByInsuredId).toHaveBeenCalledWith('00123');
    });

    it('debe retornar arreglo vacio si el asegurado no tiene agendamientos', async () => {
      mockDynamoRepository.findByInsuredId.mockResolvedValue([]);

      const result = await useCase.execute('00123');

      expect(result).toEqual([]);
    });
  });

  describe('validacion del insuredId', () => {
    it('debe lanzar error si insuredId tiene menos de 5 digitos', async () => {
      await expect(useCase.execute('123')).rejects.toThrow('insuredId must be a 5-digit string');
    });

    it('debe lanzar error si insuredId tiene mas de 5 digitos', async () => {
      await expect(useCase.execute('123456')).rejects.toThrow('insuredId must be a 5-digit string');
    });

    it('debe lanzar error si insuredId esta vacio', async () => {
      await expect(useCase.execute('')).rejects.toThrow('insuredId must be a 5-digit string');
    });

    it('no debe consultar dynamo si el insuredId es invalido', async () => {
      await expect(useCase.execute('abc')).rejects.toThrow();
      expect(mockDynamoRepository.findByInsuredId).not.toHaveBeenCalled();
    });
  });
});
