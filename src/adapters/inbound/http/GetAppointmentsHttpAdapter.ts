import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IGetAppointmentsByInsuredUseCase } from '../../../core/ports/inbound/IGetAppointmentsByInsuredUseCase';
import { httpResponse } from '../../../shared/helpers/HttpResponse';

/**
 * Adaptador primario HTTP para el endpoint GET /appointments/{insuredId}.
 * Extrae el path parameter insuredId del evento de API Gateway y delega
 * la consulta al caso de uso correspondiente.
 */
export class GetAppointmentsHttpAdapter {
  constructor(private readonly getAppointmentsUseCase: IGetAppointmentsByInsuredUseCase) {}

  /**
   * Procesa la consulta de agendamientos por asegurado.
   *
   * @param event - Evento de API Gateway con pathParameters
   * @returns Lista de agendamientos del asegurado o mensaje de error
   */
  async handle(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const { insuredId } = event.pathParameters || {};
      if (!insuredId) {
        return httpResponse(400, { message: 'insuredId es requerido en la URL' });
      }

      const appointments = await this.getAppointmentsUseCase.execute(insuredId);
      return httpResponse(200, { appointments });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return httpResponse(errorMessage.includes('must') ? 400 : 500, { message: errorMessage });
    }
  }
}
