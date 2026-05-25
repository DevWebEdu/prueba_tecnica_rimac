import { Appointment } from '../../domain/entities/Appointment';

/**
 * Puerto de entrada para procesar un agendamiento por pais.
 * Es invocado por los adaptadores SQS de Peru y Chile tras recibir el mensaje de SNS.
 */
export interface IProcessAppointmentUseCase {
  /**
   * Persiste el agendamiento en la base de datos MySQL del pais correspondiente
   * y notifica la conformidad a traves de EventBridge.
   *
   * @param appointment - Datos del agendamiento a procesar
   */
  execute(appointment: Appointment): Promise<void>;
}
