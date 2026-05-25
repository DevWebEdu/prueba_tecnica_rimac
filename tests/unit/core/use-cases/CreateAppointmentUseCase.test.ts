import { CreateAppointmentUseCase } from '../../../../src/core/use-cases/CreateAppointmentUseCase';
import { IAppointmentDynamoRepository } from '../../../../src/core/ports/outbound/IAppointmentDynamoRepository';
import { ISnsPublisher } from '../../../../src/core/ports/outbound/ISnsPublisher';

const mockDynamoRepository: jest.Mocked<IAppointmentDynamoRepository> = {
  save: jest.fn(),
  findByInsuredId: jest.fn(),
  updateStatus: jest.fn(),
};

const mockSnsPublisher: jest.Mocked<ISnsPublisher> = {
  publishAppointment: jest.fn(),
};

describe('CreateAppointmentUseCase', () => {
  let useCase: CreateAppointmentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateAppointmentUseCase(mockDynamoRepository, mockSnsPublisher);
  });

  describe('ejecucion exitosa', () => {
    beforeEach(() => {
      mockDynamoRepository.save.mockResolvedValue(undefined);
      mockSnsPublisher.publishAppointment.mockResolvedValue(undefined);
    });

    it('debe crear el agendamiento con estado "pending"', async () => {
      const result = await useCase.execute({ insuredId: '00123', scheduleId: 100, countryISO: 'PE' });

      expect(result.status).toBe('pending');
      expect(result.insuredId).toBe('00123');
      expect(result.scheduleId).toBe(100);
      expect(result.countryISO).toBe('PE');
    });

    it('debe generar un appointmentId UUID unico', async () => {
      const result1 = await useCase.execute({ insuredId: '00123', scheduleId: 100, countryISO: 'PE' });
      const result2 = await useCase.execute({ insuredId: '00123', scheduleId: 100, countryISO: 'PE' });

      expect(result1.appointmentId).toBeDefined();
      expect(result1.appointmentId).not.toBe(result2.appointmentId);
    });

    it('debe persistir en DynamoDB antes de publicar a SNS', async () => {
      const callOrder: string[] = [];
      mockDynamoRepository.save.mockImplementation(async () => { callOrder.push('dynamo'); });
      mockSnsPublisher.publishAppointment.mockImplementation(async () => { callOrder.push('sns'); });

      await useCase.execute({ insuredId: '00123', scheduleId: 100, countryISO: 'PE' });

      expect(callOrder).toEqual(['dynamo', 'sns']);
    });

    it('debe publicar a SNS con el countryISO correcto para el filtro', async () => {
      const result = await useCase.execute({ insuredId: '00123', scheduleId: 100, countryISO: 'CL' });

      expect(mockSnsPublisher.publishAppointment).toHaveBeenCalledWith(
        result.appointmentId, '00123', 100, 'CL',
      );
    });

    it('debe aceptar insuredId con ceros al inicio', async () => {
      const result = await useCase.execute({ insuredId: '00001', scheduleId: 1, countryISO: 'PE' });
      expect(result.insuredId).toBe('00001');
    });
  });

  describe('validaciones de entrada', () => {
    it('debe lanzar error si insuredId tiene menos de 5 digitos', async () => {
      await expect(
        useCase.execute({ insuredId: '123', scheduleId: 100, countryISO: 'PE' }),
      ).rejects.toThrow('insuredId must be a 5-digit string');
    });

    it('debe lanzar error si insuredId tiene mas de 5 digitos', async () => {
      await expect(
        useCase.execute({ insuredId: '123456', scheduleId: 100, countryISO: 'PE' }),
      ).rejects.toThrow('insuredId must be a 5-digit string');
    });

    it('debe lanzar error si insuredId contiene letras', async () => {
      await expect(
        useCase.execute({ insuredId: 'AB123', scheduleId: 100, countryISO: 'PE' }),
      ).rejects.toThrow('insuredId must be a 5-digit string');
    });

    it('debe lanzar error si countryISO no es PE ni CL', async () => {
      await expect(
        useCase.execute({ insuredId: '00123', scheduleId: 100, countryISO: 'BR' as any }),
      ).rejects.toThrow('countryISO must be PE or CL');
    });

    it('debe lanzar error si scheduleId es undefined', async () => {
      await expect(
        useCase.execute({ insuredId: '00123', scheduleId: undefined as any, countryISO: 'PE' }),
      ).rejects.toThrow('scheduleId must be a number');
    });

    it('no debe llamar a dynamo ni sns si la validacion falla', async () => {
      await expect(
        useCase.execute({ insuredId: '123', scheduleId: 100, countryISO: 'PE' }),
      ).rejects.toThrow();

      expect(mockDynamoRepository.save).not.toHaveBeenCalled();
      expect(mockSnsPublisher.publishAppointment).not.toHaveBeenCalled();
    });
  });
});
