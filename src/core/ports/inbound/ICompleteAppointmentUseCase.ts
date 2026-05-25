/**
 * Puerto de entrada para marcar un agendamiento como completado.
 * Es invocado por el adaptador SQS que recibe la confirmacion de EventBridge.
 */
export interface ICompleteAppointmentUseCase {
  /**
   * Actualiza el estado del agendamiento a "completed" en DynamoDB.
   *
   * @param appointmentId - UUID del agendamiento a completar
   * @throws Error si el appointmentId esta vacio
   */
  execute(appointmentId: string): Promise<void>;
}
