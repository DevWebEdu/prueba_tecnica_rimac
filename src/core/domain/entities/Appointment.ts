/** Estado posible de un agendamiento a lo largo de su ciclo de vida */
export type AppointmentStatus = 'pending' | 'completed';

/** Paises soportados por la aplicacion */
export type CountryISO = 'PE' | 'CL';

/**
 * Entidad principal del dominio.
 * Representa un agendamiento de cita medica solicitado por un asegurado.
 */
export interface Appointment {
  /** Identificador unico del agendamiento (UUID v4) */
  appointmentId: string;

  /** Codigo del asegurado  */
  insuredId: string;

  /**
   * Llave del espacio disponible para la cita.
   * Agrupa: centro medico, especialidad, medico y fecha/hora.
   */
  scheduleId: number;

  /** Pais donde se realiza el agendamiento */
  countryISO: CountryISO;

  /** Estado actual del agendamiento en el flujo de procesamiento */
  status: AppointmentStatus;

  /** Fecha  creacion */
  createdAt: string;

  /** Fecha  de la ultima actualizacion */
  updatedAt: string;
}

/** Datos de entrada recibidos desde la peticion HTTP para crear un agendamiento */
export interface CreateAppointmentInput {
  insuredId: string;
  scheduleId: number;
  countryISO: CountryISO;
}
