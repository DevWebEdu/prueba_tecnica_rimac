import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Construye una respuesta HTTP estandar para API Gateway.
 * Centraliza los headers comunes (CORS, Content-Type) en un solo lugar.
 *
 * @param statusCode - Codigo HTTP de la respuesta
 * @param body - Objeto a serializar como JSON en el cuerpo
 * @returns Objeto compatible con APIGatewayProxyResult
 */
export function httpResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}
