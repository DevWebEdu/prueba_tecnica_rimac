import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent } from 'aws-lambda';

import { CreateAppointmentUseCase } from '../../core/use-cases/CreateAppointmentUseCase';
import { GetAppointmentsByInsuredUseCase } from '../../core/use-cases/GetAppointmentsByInsuredUseCase';
import { CompleteAppointmentUseCase } from '../../core/use-cases/CompleteAppointmentUseCase';

import { DynamoAppointmentRepository } from '../../adapters/outbound/dynamo/DynamoAppointmentRepository';
import { SnsPublisher } from '../../adapters/outbound/sns/SnsPublisher';

import { CreateAppointmentHttpAdapter } from '../../adapters/inbound/http/CreateAppointmentHttpAdapter';
import { GetAppointmentsHttpAdapter } from '../../adapters/inbound/http/GetAppointmentsHttpAdapter';
import { CompletionUpdateSqsAdapter } from '../../adapters/inbound/sqs/CompletionUpdateSqsAdapter';

import { httpResponse } from '../../shared/helpers/HttpResponse';

/**
 * Composition root del Lambda "appointment".
 *
 * Aqui se ensamblan los puertos y adaptadores. Las instancias se crean fuera
 * del handler para reutilizarlas en los "warm starts" de Lambda.
 *
 * Este Lambda atiende tres tipos de eventos:
 * - POST /appointments → crea agendamiento en DynamoDB y publica a SNS
 * - GET /appointments/{insuredId} → consulta agendamientos del asegurado
 * - SQS (completion queue) → actualiza estado a "completed" en DynamoDB
 */

// Outbound adapters
const dynamoRepository = new DynamoAppointmentRepository();
const snsPublisher = new SnsPublisher();

// Use cases
const createAppointmentUseCase = new CreateAppointmentUseCase(dynamoRepository, snsPublisher);
const getAppointmentsUseCase = new GetAppointmentsByInsuredUseCase(dynamoRepository);
const completeAppointmentUseCase = new CompleteAppointmentUseCase(dynamoRepository);

// Inbound adapters
const createAdapter = new CreateAppointmentHttpAdapter(createAppointmentUseCase);
const getAdapter = new GetAppointmentsHttpAdapter(getAppointmentsUseCase);
const completionAdapter = new CompletionUpdateSqsAdapter(completeAppointmentUseCase);

type LambdaEvent = APIGatewayProxyEvent | SQSEvent;

/** Determina si el evento proviene de SQS en lugar de API Gateway */
function isSqsEvent(event: LambdaEvent): event is SQSEvent {
  return (
    'Records' in event &&
    Array.isArray((event as SQSEvent).Records) &&
    (event as SQSEvent).Records[0]?.eventSource === 'aws:sqs'
  );
}

/** Punto de entrada del Lambda — enruta al adaptador correcto segun el tipo de evento */
export const main = async (event: LambdaEvent): Promise<APIGatewayProxyResult | void> => {
  if (isSqsEvent(event)) {
    return completionAdapter.handle(event);
  }

  const apiEvent = event as APIGatewayProxyEvent;

  if (apiEvent.httpMethod === 'POST') return createAdapter.handle(apiEvent);
  if (apiEvent.httpMethod === 'GET') return getAdapter.handle(apiEvent);

  return httpResponse(405, { message: 'Method not allowed' });
};
