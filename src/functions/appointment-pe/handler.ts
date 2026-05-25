import { SQSEvent } from 'aws-lambda';

import { ProcessAppointmentUseCase } from '../../core/use-cases/ProcessAppointmentUseCase';
import { RdsAppointmentRepository } from '../../adapters/outbound/rds/RdsAppointmentRepository';
import { EventBridgePublisher } from '../../adapters/outbound/eventbridge/EventBridgePublisher';
import { CountryAppointmentSqsAdapter } from '../../adapters/inbound/sqs/CountryAppointmentSqsAdapter';

/**
 * Composition root del Lambda "appointmentPe".
 *
 * Lee mensajes de SQS_PE (enviados por SNS con filtro countryISO=PE),
 * persiste el agendamiento en la base de datos MySQL de Peru (appointments_pe)
 * y emite la conformidad a EventBridge.
 *
 * La base de datos destino es controlada por la variable RDS_DATABASE=appointments_pe
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
