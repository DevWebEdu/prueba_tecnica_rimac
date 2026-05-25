import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { IEventBridgePublisher } from '../../../core/ports/outbound/IEventBridgePublisher';

/**
 * Adaptador secundario para emitir eventos al bus personalizado de EventBridge.
 * El evento AppointmentCompleted es capturado por la regla que lo reenvía al
 * SQS de completion, donde el Lambda principal cierra el ciclo actualizando DynamoDB.
 */
export class EventBridgePublisher implements IEventBridgePublisher {
  private readonly eventBridgeClient: EventBridgeClient;
  private readonly eventBusName: string;

  constructor() {
    this.eventBridgeClient = new EventBridgeClient({});
    this.eventBusName = process.env.EVENT_BUS_NAME || '';
  }

  async publishAppointmentCompleted(
    appointmentId: string,
    insuredId: string,
    countryISO: string,
  ): Promise<void> {
    const eventDetail = { appointmentId, insuredId, countryISO };

    await this.eventBridgeClient.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: this.eventBusName,
            Source: 'appointment.processing',
            DetailType: 'AppointmentCompleted',
            Detail: JSON.stringify(eventDetail),
          },
        ],
      }),
    );
  }
}
