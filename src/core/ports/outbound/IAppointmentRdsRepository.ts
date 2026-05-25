import { Appointment } from '../../domain/entities/Appointment';

/**
 * Puerto de salida para la persistencia de agendamientos en MySQL (RDS).
 * Cada pais tiene su propia base de datos; la seleccion se controla
 * mediante la variable de entorno RDS_DATABASE del Lambda correspondiente.
 */
export interface IAppointmentRdsRepository {
  /**
   * Inserta el agendamiento en la tabla appointments de la base de datos del pais.
   * @param appointment - Entidad a persistir en MySQL
   */
  save(appointment: Appointment): Promise<void>;
}
