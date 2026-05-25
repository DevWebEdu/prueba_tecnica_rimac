import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ICreateAppointmentUseCase } from '../../../core/ports/inbound/ICreateAppointmentUseCase';
import { httpResponse } from '../../../shared/helpers/HttpResponse';

/**
 * Adaptador primario HTTP para el endpoint POST /appointments.
 *
 * Responsabilidad: traducir la peticion de API Gateway al formato del caso de uso
 * y convertir la respuesta (o error) en una respuesta HTTP valida.
 * El caso de uso no sabe nada de HTTP; este adaptador no sabe nada de negocio.
 */
export class CreateAppointmentHttpAdapter {
  constructor(private readonly createAppointmentUseCase: ICreateAppointmentUseCase) {}

  /**
   * Procesa la peticion de creacion de agendamiento.
   * Retorna 202 (Accepted) porque el procesamiento real es asincrono.
   *
   * @param event - Evento de API Gateway con el body JSON
   * @returns Respuesta HTTP con appointmentId o mensaje de error
   */
  async handle(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const requestBody = JSON.parse(event.body || '{}');
      const createdAppointment = await this.createAppointmentUseCase.execute({
        insuredId: requestBody.insuredId,
        scheduleId: requestBody.scheduleId,
        countryISO: requestBody.countryISO,
      });

      return httpResponse(202, {
        message: 'El agendamiento esta en proceso',
        appointmentId: createdAppointment.appointmentId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      const isValidationError = errorMessage.includes('must') || errorMessage.includes('required');
      return httpResponse(isValidationError ? 400 : 500, { message: errorMessage });
    }
  }
}
