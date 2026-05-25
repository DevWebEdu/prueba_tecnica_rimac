/**
 * Puerto de salida para emitir eventos de conformidad a traves de EventBridge.
 * El evento generado es capturado por una regla que lo enruta al SQS de completion,
 * donde el Lambda principal lo recoge para actualizar DynamoDB a "completed".
 */
export interface IEventBridgePublisher {
  /**
   * Emite un evento AppointmentCompleted al bus de EventBridge.
   *
   * @param appointmentId - UUID del agendamiento procesado
   * @param insuredId - Codigo del asegurado
   * @param countryISO - Pais donde se proceso el agendamiento
   */
  publishAppointmentCompleted(
    appointmentId: string,
    insuredId: string,
    countryISO: string,
  ): Promise<void>;
}
