import { Appointment } from '../../../core/domain/entities/Appointment';
import { IAppointmentRdsRepository } from '../../../core/ports/outbound/IAppointmentRdsRepository';
import { getRdsConnection } from './RdsConnection';

/**
 * Adaptador secundario que implementa la persistencia en Amazon RDS (MySQL).
 * La base de datos destino (appointments_pe o appointments_cl) es determinada
 * por la variable RDS_DATABASE configurada en el Lambda del pais correspondiente.
 */
export class RdsAppointmentRepository implements IAppointmentRdsRepository {
  /** Inserta el agendamiento en la tabla appointments del pais correspondiente */
  async save(appointment: Appointment): Promise<void> {
    const connection = await getRdsConnection();

    const insertQuery = `
      INSERT INTO appointments
        (appointment_id, insured_id, schedule_id, country_iso, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(insertQuery, [
      appointment.appointmentId,
      appointment.insuredId,
      appointment.scheduleId,
      appointment.countryISO,
      appointment.status,
      appointment.createdAt,
      appointment.updatedAt,
    ]);
  }
}
