import { v4 as uuidv4 } from 'uuid';
import { Appointment, CreateAppointmentInput } from '../domain/entities/Appointment';
import { ICreateAppointmentUseCase } from '../ports/inbound/ICreateAppointmentUseCase';
import { IAppointmentDynamoRepository } from '../ports/outbound/IAppointmentDynamoRepository';
import { ISnsPublisher } from '../ports/outbound/ISnsPublisher';

/**
 * Caso de uso: Crear un agendamiento medico.
 *
 * Orquesta la validacion de datos, la persistencia inicial en DynamoDB (estado "pending")
 * y la publicacion al topico SNS para el procesamiento asincrono por pais.
 */
export class CreateAppointmentUseCase implements ICreateAppointmentUseCase {
  constructor(
    private readonly dynamoRepository: IAppointmentDynamoRepository,
    private readonly snsPublisher: ISnsPublisher,
  ) {}

  /**
   * Valida el input, construye la entidad, la persiste y notifica al SNS.
   * Lanza un error si la validacion falla — el adaptador HTTP convierte ese
   * error en una respuesta 400 sin que el caso de uso conozca HTTP.
   */
  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    this.validateInput(input);

    const now = new Date().toISOString();
    const newAppointment: Appointment = {
      appointmentId: uuidv4(),
      insuredId: input.insuredId,
      scheduleId: input.scheduleId,
      countryISO: input.countryISO,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamoRepository.save(newAppointment);
    await this.snsPublisher.publishAppointment(
      newAppointment.appointmentId,
      newAppointment.insuredId,
      newAppointment.scheduleId,
      newAppointment.countryISO,
    );

    return newAppointment;
  }

  /** Reglas de negocio sobre los datos de entrada del agendamiento */
  private validateInput(input: CreateAppointmentInput): void {
    if (!input.insuredId || !/^\d{5}$/.test(input.insuredId)) {
      throw new Error('insuredId must be a 5-digit string');
    }
    if (input.scheduleId === undefined || input.scheduleId === null || typeof input.scheduleId !== 'number') {
      throw new Error('scheduleId must be a number');
    }
    if (!['PE', 'CL'].includes(input.countryISO)) {
      throw new Error('countryISO must be PE or CL');
    }
  }
}
