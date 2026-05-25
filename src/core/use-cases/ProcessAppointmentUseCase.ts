import { Appointment } from '../domain/entities/Appointment';
import { IProcessAppointmentUseCase } from '../ports/inbound/IProcessAppointmentUseCase';
import { IAppointmentRdsRepository } from '../ports/outbound/IAppointmentRdsRepository';
import { IEventBridgePublisher } from '../ports/outbound/IEventBridgePublisher';

/**
 * Caso de uso: Procesar un agendamiento por pais.
 *
 * Compartido por los Lambdas de Peru y Chile; la diferencia entre ambos
 * es la base de datos MySQL a la que apunta su adaptador RDS (controlado
 * por la variable de entorno RDS_DATABASE de cada funcion).
 */
export class ProcessAppointmentUseCase implements IProcessAppointmentUseCase {
  constructor(
    private readonly rdsRepository: IAppointmentRdsRepository,
    private readonly eventBridgePublisher: IEventBridgePublisher,
  ) {}

  /**
   * Persiste el agendamiento en la base de datos del pais y
   * emite la conformidad a EventBridge para cerrar el ciclo.
   */
  async execute(appointment: Appointment): Promise<void> {
    await this.rdsRepository.save(appointment);
    await this.eventBridgePublisher.publishAppointmentCompleted(
      appointment.appointmentId,
      appointment.insuredId,
      appointment.countryISO,
    );
  }
}
