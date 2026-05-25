import { Appointment } from '../domain/entities/Appointment';
import { IGetAppointmentsByInsuredUseCase } from '../ports/inbound/IGetAppointmentsByInsuredUseCase';
import { IAppointmentDynamoRepository } from '../ports/outbound/IAppointmentDynamoRepository';

/**
 * Caso de uso: Recuperar los agendamientos de un asegurado.
 * Consulta DynamoDB usando el indice secundario global (GSI) por insuredId.
 */
export class GetAppointmentsByInsuredUseCase implements IGetAppointmentsByInsuredUseCase {
  constructor(private readonly dynamoRepository: IAppointmentDynamoRepository) {}

  async execute(insuredId: string): Promise<Appointment[]> {
    if (!insuredId || !/^\d{5}$/.test(insuredId)) {
      throw new Error('insuredId must be a 5-digit string');
    }
    return this.dynamoRepository.findByInsuredId(insuredId);
  }
}
