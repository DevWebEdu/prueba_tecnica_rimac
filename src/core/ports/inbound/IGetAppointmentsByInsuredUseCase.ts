import { Appointment } from '../../domain/entities/Appointment';

/**
 * Puerto de entrada para consultar los agendamientos de un asegurado.
 * Permite a los adaptadores HTTP recuperar el historial con su estado actual.
 */
export interface IGetAppointmentsByInsuredUseCase {
  /**
   * Retorna todos los agendamientos registrados para el asegurado indicado.
   *
   * @param insuredId - Codigo del asegurado de 5 digitos
   * @returns Lista de agendamientos con su estado (pending / completed)
   * @throws Error si el insuredId no tiene el formato correcto
   */
  execute(insuredId: string): Promise<Appointment[]>;
}
