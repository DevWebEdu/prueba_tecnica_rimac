import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { ISnsPublisher } from '../../../core/ports/outbound/ISnsPublisher';

/**
 * Adaptador secundario para publicar mensajes al topico SNS de agendamientos.
 *
 * El atributo MessageAttribute "countryISO" es requerido por la FilterPolicy
 * configurada en las suscripciones de SNS para enrutar el mensaje al SQS correcto.
 */
export class SnsPublisher implements ISnsPublisher {
  private readonly snsClient: SNSClient;
  private readonly topicArn: string;

  constructor() {
    this.snsClient = new SNSClient({});
    this.topicArn = process.env.SNS_TOPIC_ARN || '';
  }

  async publishAppointment(
    appointmentId: string,
    insuredId: string,
    scheduleId: number,
    countryISO: string,
  ): Promise<void> {
    const messagePayload = { appointmentId, insuredId, scheduleId, countryISO };

    await this.snsClient.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Message: JSON.stringify(messagePayload),
        // El MessageAttribute es la clave de filtro en la suscripcion SNS → SQS
        MessageAttributes: {
          countryISO: {
            DataType: 'String',
            StringValue: countryISO,
          },
        },
      }),
    );
  }
}
