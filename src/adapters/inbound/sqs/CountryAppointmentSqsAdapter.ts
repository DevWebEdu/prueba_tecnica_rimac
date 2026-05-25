import { SQSEvent } from 'aws-lambda';
import { Appointment } from '../../../core/domain/entities/Appointment';
import { IProcessAppointmentUseCase } from '../../../core/ports/inbound/IProcessAppointmentUseCase';

/**
 * Adaptador primario SQS compartido por los Lambdas de Peru y Chile.
 *
 * Cuando SNS entrega un mensaje a SQS, lo envuelve en un envelope con la forma:
 * { "Type": "Notification", "Message": "<JSON del agendamiento>", ... }
 * Este adaptador desenvuelve ese envelope antes de llamar al caso de uso.
 *
 * La diferencia entre PE y CL no esta en el adaptador sino en la base de datos
 * RDS a la que apunta el repositorio inyectado (variable RDS_DATABASE por Lambda).
 */
export class CountryAppointmentSqsAdapter {
  constructor(private readonly processAppointmentUseCase: IProcessAppointmentUseCase) {}

  /**
   * Procesa cada registro SQS del lote.
   * Desenvuelve el envelope de SNS y reconstruye la entidad Appointment.
   *
   * @param event - Evento SQS proveniente de SQS_PE o SQS_CL
   */
  async handle(event: SQSEvent): Promise<void> {
    for (const sqsRecord of event.Records) {
      // SNS envuelve el mensaje en un envelope al entregar a SQS
      const snsEnvelope = JSON.parse(sqsRecord.body);
      const appointmentData = JSON.parse(snsEnvelope.Message);

      const appointment: Appointment = {
        appointmentId: appointmentData.appointmentId,
        insuredId: appointmentData.insuredId,
        scheduleId: appointmentData.scheduleId,
        countryISO: appointmentData.countryISO,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.processAppointmentUseCase.execute(appointment);
    }
  }
}
