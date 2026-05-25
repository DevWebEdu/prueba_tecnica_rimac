import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Appointment, AppointmentStatus } from '../../../core/domain/entities/Appointment';
import { IAppointmentDynamoRepository } from '../../../core/ports/outbound/IAppointmentDynamoRepository';

/**
 * Adaptador secundario que implementa la persistencia en Amazon DynamoDB.
 *
 * La tabla usa appointmentId como partition key y un GSI sobre insuredId
 * para permitir consultas eficientes por asegurado sin hacer full scan.
 */
export class DynamoAppointmentRepository implements IAppointmentDynamoRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.APPOINTMENTS_TABLE || '';
  }

  /** Inserta un agendamiento nuevo en la tabla DynamoDB */
  async save(appointment: Appointment): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          appointmentId: appointment.appointmentId,
          insuredId: appointment.insuredId,
          scheduleId: appointment.scheduleId,
          countryISO: appointment.countryISO,
          status: appointment.status,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        },
      }),
    );
  }

  /** Consulta los agendamientos de un asegurado usando el GSI insuredId-index */
  async findByInsuredId(insuredId: string): Promise<Appointment[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'insuredId-index',
        KeyConditionExpression: 'insuredId = :insuredId',
        ExpressionAttributeValues: { ':insuredId': insuredId },
      }),
    );

    return (result.Items || []) as Appointment[];
  }

  /**
   * Actualiza el estado de un agendamiento.
   * Se usa ExpressionAttributeNames porque "status" es palabra reservada en DynamoDB.
   */
  async updateStatus(appointmentId: string, status: AppointmentStatus): Promise<void> {
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { appointmentId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': new Date().toISOString(),
        },
      }),
    );
  }
}
