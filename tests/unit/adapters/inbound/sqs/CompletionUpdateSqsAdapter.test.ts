import { SQSEvent } from 'aws-lambda';
import { CompletionUpdateSqsAdapter } from '../../../../../src/adapters/inbound/sqs/CompletionUpdateSqsAdapter';
import { ICompleteAppointmentUseCase } from '../../../../../src/core/ports/inbound/ICompleteAppointmentUseCase';

const mockUseCase: jest.Mocked<ICompleteAppointmentUseCase> = {
  execute: jest.fn(),
};

const buildSqsEvent = (appointmentId: string): SQSEvent => ({
  Records: [
    {
      messageId: 'msg-1',
      receiptHandle: 'receipt',
      // El body es el evento de EventBridge tal como llega desde el SQS de completion
      body: JSON.stringify({
        source: 'appointment.processing',
        'detail-type': 'AppointmentCompleted',
        detail: { appointmentId, insuredId: '00123', countryISO: 'PE' },
      }),
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1',
        SenderId: 'test',
        ApproximateFirstReceiveTimestamp: '1',
      },
      messageAttributes: {},
      md5OfBody: '',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-east-1:123:completion',
      awsRegion: 'us-east-1',
    },
  ],
});

describe('CompletionUpdateSqsAdapter', () => {
  let adapter: CompletionUpdateSqsAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new CompletionUpdateSqsAdapter(mockUseCase);
  });

  it('debe extraer el appointmentId del evento de EventBridge y completar el agendamiento', async () => {
    mockUseCase.execute.mockResolvedValue(undefined);

    await adapter.handle(buildSqsEvent('uuid-1'));

    expect(mockUseCase.execute).toHaveBeenCalledWith('uuid-1');
  });

  it('debe procesar multiples registros en un mismo lote SQS', async () => {
    mockUseCase.execute.mockResolvedValue(undefined);

    const batchEvent: SQSEvent = {
      Records: [
        ...buildSqsEvent('uuid-1').Records,
        ...buildSqsEvent('uuid-2').Records,
      ],
    };

    await adapter.handle(batchEvent);

    expect(mockUseCase.execute).toHaveBeenCalledTimes(2);
    expect(mockUseCase.execute).toHaveBeenCalledWith('uuid-1');
    expect(mockUseCase.execute).toHaveBeenCalledWith('uuid-2');
  });

  it('debe propagar el error si el caso de uso falla', async () => {
    mockUseCase.execute.mockRejectedValue(new Error('DynamoDB error'));

    await expect(adapter.handle(buildSqsEvent('uuid-1'))).rejects.toThrow('DynamoDB error');
  });
});
