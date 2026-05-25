import { CompleteAppointmentUseCase } from '../../../../src/core/use-cases/CompleteAppointmentUseCase';
import { IAppointmentDynamoRepository } from '../../../../src/core/ports/outbound/IAppointmentDynamoRepository';

const mockDynamoRepository: jest.Mocked<IAppointmentDynamoRepository> = {
  save: jest.fn(),
  findByInsuredId: jest.fn(),
  updateStatus: jest.fn(),
};

describe('CompleteAppointmentUseCase', () => {
  let useCase: CompleteAppointmentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CompleteAppointmentUseCase(mockDynamoRepository);
  });

  it('debe actualizar el estado a "completed" en DynamoDB', async () => {
    mockDynamoRepository.updateStatus.mockResolvedValue(undefined);

    await useCase.execute('uuid-1');

    expect(mockDynamoRepository.updateStatus).toHaveBeenCalledWith('uuid-1', 'completed');
    expect(mockDynamoRepository.updateStatus).toHaveBeenCalledTimes(1);
  });

  it('debe lanzar error si el appointmentId esta vacio', async () => {
    await expect(useCase.execute('')).rejects.toThrow('appointmentId is required');
    expect(mockDynamoRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe propagar el error si DynamoDB falla', async () => {
    mockDynamoRepository.updateStatus.mockRejectedValue(new Error('DynamoDB connection error'));

    await expect(useCase.execute('uuid-1')).rejects.toThrow('DynamoDB connection error');
  });
});
