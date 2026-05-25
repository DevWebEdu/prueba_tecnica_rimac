import { SQSEvent } from 'aws-lambda';

import { ProcessAppointmentUseCase } from '../../core/use-cases/ProcessAppointmentUseCase';
import { RdsAppointmentRepository } from '../../adapters/outbound/rds/RdsAppointmentRepository';
import { EventBridgePublisher } from '../../adapters/outbound/eventbridge/EventBridgePublisher';
import { CountryAppointmentSqsAdapter } from '../../adapters/inbound/sqs/CountryAppointmentSqsAdapter';

/**
 * Composition root del Lambda "appointmentCl".
 *
 * Lee mensajes de SQS_CL (enviados por SNS con filtro countryISO=CL),
 * persiste el agendamiento en la base de datos MySQL de Chile (appointments_cl)
 * y emite la conformidad a EventBridge.
 *
 * La base de datos destino es controlada por la variable RDS_DATABASE=appointments_cl
 * configurada exclusivamente en este Lambda en serverless.yml.
 */

// Outbound adapters
const rdsRepository = new RdsAppointmentRepository();
const eventBridgePublisher = new EventBridgePublisher();

// Use case
const processAppointmentUseCase = new ProcessAppointmentUseCase(rdsRepository, eventBridgePublisher);

// Inbound adapter
const countryAdapter = new CountryAppointmentSqsAdapter(processAppointmentUseCase);

/** Punto de entrada del Lambda — delega al adaptador SQS de pais */
export const main = async (event: SQSEvent): Promise<void> => {
  await countryAdapter.handle(event);
};
