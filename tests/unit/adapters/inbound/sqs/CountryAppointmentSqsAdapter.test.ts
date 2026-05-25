import { SQSEvent } from 'aws-lambda';
import { CountryAppointmentSqsAdapter } from '../../../../../src/adapters/inbound/sqs/CountryAppointmentSqsAdapter';
import { IProcessAppointmentUseCase } from '../../../../../src/core/ports/inbound/IProcessAppointmentUseCase';

const mockUseCase: jest.Mocked<IProcessAppointmentUseCase> = {
  execute: jest.fn(),
};

/**
 * Construye un evento SQS simulando la estructura que genera SNS
 * cuando entrega un mensaje a una cola SQS (envelope de notificacion).
 */
const buildSqsEventWithSnsEnvelope = (appointmentData: object): SQSEvent => ({
  Records: [
    {
      messageId: 'msg-1',
      receiptHandle: 'receipt',
      // SNS envuelve el mensaje en este envelope al entregar a SQS
      body: JSON.stringify({
        Type: 'Notification',
        MessageId: 'sns-msg-id',
        TopicArn: 'arn:aws:sns:us-east-1:123:appointment-topic',
        Message: JSON.stringify(appointmentData),
        Timestamp: '2024-01-01T00:00:00Z',
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
      eventSourceARN: 'arn:aws:sqs:us-east-1:123:SQS_PE',
      awsRegion: 'us-east-1',
    },
  ],
});

describe('CountryAppointmentSqsAdapter', () => {
  let adapter: CountryAppointmentSqsAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new CountryAppointmentSqsAdapter(mockUseCase);
  });

  it('debe desenvuelve el envelope de SNS y pasar la entidad correcta al caso de uso', async () => {
    mockUseCase.execute.mockResolvedValue(undefined);

    const sqsEvent = buildSqsEventWithSnsEnvelope({
      appointmentId: 'uuid-1',
      insuredId: '00123',
      scheduleId: 100,
      countryISO: 'PE',
    });

    await adapter.handle(sqsEvent);

    expect(mockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: 'uuid-1',
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'PE',
        status: 'pending',
      }),
    );
  });

  it('debe construir la entidad con estado "pending"', async () => {
    mockUseCase.execute.mockResolvedValue(undefined);

    const sqsEvent = buildSqsEventWithSnsEnvelope({
      appointmentId: 'uuid-1', insuredId: '00123', scheduleId: 100, countryISO: 'CL',
    });

    await adapter.handle(sqsEvent);

    const appointmentArg = mockUseCase.execute.mock.calls[0][0];
    expect(appointmentArg.status).toBe('pending');
  });

  it('debe procesar multiples registros del lote', async () => {
    mockUseCase.execute.mockResolvedValue(undefined);

    const record = buildSqsEventWithSnsEnvelope({
      appointmentId: 'uuid-1', insuredId: '00123', scheduleId: 100, countryISO: 'PE',
    }).Records[0];

    const batchEvent: SQSEvent = { Records: [record, { ...record, messageId: 'msg-2' }] };

    await adapter.handle(batchEvent);

    expect(mockUseCase.execute).toHaveBeenCalledTimes(2);
  });
});
