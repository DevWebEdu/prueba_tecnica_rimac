import { ICompleteAppointmentUseCase } from '../ports/inbound/ICompleteAppointmentUseCase';
import { IAppointmentDynamoRepository } from '../ports/outbound/IAppointmentDynamoRepository';

/**
 * Caso de uso: Marcar un agendamiento como completado.
 * Es ejecutado cuando el adaptador SQS recibe la conformidad desde EventBridge,
 * cerrando el ciclo asincrono del flujo de agendamiento.
 */
export class CompleteAppointmentUseCase implements ICompleteAppointmentUseCase {
  constructor(private readonly dynamoRepository: IAppointmentDynamoRepository) {}

  async execute(appointmentId: string): Promise<void> {
    if (!appointmentId) {
      throw new Error('appointmentId is required');
    }
    await this.dynamoRepository.updateStatus(appointmentId, 'completed');
  }
}
