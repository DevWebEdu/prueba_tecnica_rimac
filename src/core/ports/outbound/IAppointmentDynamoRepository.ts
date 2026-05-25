import { Appointment, AppointmentStatus } from '../../domain/entities/Appointment';

/**
 * Puerto de salida (outbound port) para la persistencia de agendamientos en DynamoDB.
 *
 * El nucleo de la aplicacion depende de esta interfaz, nunca de la implementacion
 * concreta de AWS. Esto permite sustituir DynamoDB sin tocar ningun caso de uso.
 */
export interface IAppointmentDynamoRepository {
  /**
   * Inserta un nuevo agendamiento en la tabla de DynamoDB.
   * @param appointment - Entidad completa a persistir
   */
  save(appointment: Appointment): Promise<void>;

  /**
   * Consulta todos los agendamientos de un asegurado usando el indice secundario.
   * @param insuredId - Codigo de 5 digitos del asegurado
   * @returns Lista de agendamientos encontrados (puede ser vacia)
   */
  findByInsuredId(insuredId: string): Promise<Appointment[]>;

  /**
   * Actualiza el campo status de un agendamiento existente.
   * @param appointmentId - UUID del agendamiento
   * @param status - Nuevo estado a asignar
   */
  updateStatus(appointmentId: string, status: AppointmentStatus): Promise<void>;
}
