import { Appointment, CreateAppointmentInput } from '../../domain/entities/Appointment';

/**
 * Puerto de entrada (inbound port) para iniciar el flujo de agendamiento.
 *
 * Los adaptadores primarios (HTTP, CLI, etc.) dependen de esta interfaz
 * en lugar de la implementacion concreta, garantizando que el nucleo
 * permanezca independiente de cualquier framework externo.
 */
export interface ICreateAppointmentUseCase {
  /**
   * Persiste el agendamiento en estado "pending" y lo envia a procesamiento asincrono.
   *
   * @param input - Datos del agendamiento enviados por el asegurado
   * @returns El agendamiento creado con su ID generado y estado inicial
   * @throws Error si los datos de entrada no son validos
   */
  execute(input: CreateAppointmentInput): Promise<Appointment>;
}
