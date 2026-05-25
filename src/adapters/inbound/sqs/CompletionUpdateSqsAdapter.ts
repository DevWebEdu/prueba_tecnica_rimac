import { SQSEvent } from 'aws-lambda';
import { ICompleteAppointmentUseCase } from '../../../core/ports/inbound/ICompleteAppointmentUseCase';

/**
 * Adaptador primario SQS para recibir confirmaciones de EventBridge.
 *
 * Cuando los Lambdas de pais (PE/CL) terminan de procesar, publican un evento
 * a EventBridge que llega aqui via SQS. Este adaptador extrae el appointmentId
 * del evento y le pide al caso de uso que actualice DynamoDB a "completed".
 */
export class CompletionUpdateSqsAdapter {
  constructor(private readonly completeAppointmentUseCase: ICompleteAppointmentUseCase) {}

  /**
   * Procesa cada registro SQS del lote.
   * El body del registro es el evento de EventBridge serializado como JSON.
   *
   * @param event - Evento SQS con los registros de confirmacion
   */
  async handle(event: SQSEvent): Promise<void> {
    for (const sqsRecord of event.Records) {
      // El body del SQS es el evento de EventBridge directamente
      const eventBridgeEvent = JSON.parse(sqsRecord.body);
      const { appointmentId } = eventBridgeEvent.detail;
      await this.completeAppointmentUseCase.execute(appointmentId);
    }
  }
}
