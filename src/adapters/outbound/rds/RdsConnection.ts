import mysql from 'mysql2/promise';

/**
 * Conexion reutilizable a MySQL RDS.
 *
 * Se cachea en el scope del modulo para aprovechar los "warm starts" de Lambda
 * y evitar abrir una nueva conexion en cada invocacion. La base de datos
 * destino (PE o CL) es controlada por la variable de entorno RDS_DATABASE
 * de cada funcion Lambda.
 */
let cachedConnection: mysql.Connection | null = null;

/**
 * Retorna la conexion activa o crea una nueva si no existe.
 * En Lambda, las variables de entorno ya estan disponibles al momento de la llamada.
 */
export async function getRdsConnection(): Promise<mysql.Connection> {
  if (cachedConnection) {
    return cachedConnection;
  }

  cachedConnection = await mysql.createConnection({
    host: process.env.RDS_HOST,
    port: parseInt(process.env.RDS_PORT || '3306'),
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
  });

  return cachedConnection;
}
