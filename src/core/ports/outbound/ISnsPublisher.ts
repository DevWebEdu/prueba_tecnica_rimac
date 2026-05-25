/**
 * Puerto de salida para publicar mensajes al topico SNS de agendamientos.
 * El topico usa un filtro por countryISO para enrutar cada mensaje
 * al SQS del pais correspondiente (SQS_PE o SQS_CL).
 */
export interface ISnsPublisher {
  /**
   * Publica los datos del agendamiento al topico SNS con el atributo
   * countryISO como MessageAttribute para que el filtro de suscripcion funcione.
   *
   * @param appointmentId - UUID del agendamiento creado
   * @param insuredId - Codigo del asegurado
   * @param scheduleId - ID del espacio de cita
   * @param countryISO - Pais destino (usado como clave de filtro en SNS)
   */
  publishAppointment(
    appointmentId: string,
    insuredId: string,
    scheduleId: number,
    countryISO: string,
  ): Promise<void>;
}
