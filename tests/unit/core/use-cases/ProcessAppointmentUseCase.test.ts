import { ProcessAppointmentUseCase } from '../../../../src/core/use-cases/ProcessAppointmentUseCase';
import { IAppointmentRdsRepository } from '../../../../src/core/ports/outbound/IAppointmentRdsRepository';
import { IEventBridgePublisher } from '../../../../src/core/ports/outbound/IEventBridgePublisher';
import { Appointment } from '../../../../src/core/domain/entities/Appointment';

const mockRdsRepository: jest.Mocked<IAppointmentRdsRepository> = {
  save: jest.fn(),
};

const mockEventBridgePublisher: jest.Mocked<IEventBridgePublisher> = {
  publishAppointmentCompleted: jest.fn(),
};

const mockAppointment: Appointment = {
  appointmentId: 'uuid-1',
  insuredId: '00123',
  scheduleId: 100,
  countryISO: 'PE',
  status: 'pending',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('ProcessAppointmentUseCase', () => {
  let useCase: ProcessAppointmentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ProcessAppointmentUseCase(mockRdsRepository, mockEventBridgePublisher);
  });

  it('debe persistir el agendamiento en RDS', async () => {
    mockRdsRepository.save.mockResolvedValue(undefined);
    mockEventBridgePublisher.publishAppointmentCompleted.mockResolvedValue(undefined);

    await useCase.execute(mockAppointment);

    expect(mockRdsRepository.save).toHaveBeenCalledWith(mockAppointment);
  });

  it('debe publicar la conformidad a EventBridge despues de guardar en RDS', async () => {
    const callOrder: string[] = [];
    mockRdsRepository.save.mockImplementation(async () => { callOrder.push('rds'); });
    mockEventBridgePublisher.publishAppointmentCompleted.mockImplementation(async () => { callOrder.push('eventbridge'); });

    await useCase.execute(mockAppointment);

    expect(callOrder).toEqual(['rds', 'eventbridge']);
  });

  it('debe publicar a EventBridge con los datos correctos del agendamiento', async () => {
    mockRdsRepository.save.mockResolvedValue(undefined);
    mockEventBridgePublisher.publishAppointmentCompleted.mockResolvedValue(undefined);

    await useCase.execute(mockAppointment);

    expect(mockEventBridgePublisher.publishAppointmentCompleted).toHaveBeenCalledWith(
      'uuid-1', '00123', 'PE',
    );
  });

  it('debe propagar el error si RDS falla y no publicar a EventBridge', async () => {
    mockRdsRepository.save.mockRejectedValue(new Error('RDS connection error'));

    await expect(useCase.execute(mockAppointment)).rejects.toThrow('RDS connection error');
    expect(mockEventBridgePublisher.publishAppointmentCompleted).not.toHaveBeenCalled();
  });
});
