-- Script para crear las bases de datos y tablas en RDS MySQL
-- Ejecutar este script en el RDS que ya existe (no se crea el RDS por codigo segun indicaciones)

CREATE DATABASE IF NOT EXISTS appointments_pe;
CREATE DATABASE IF NOT EXISTS appointments_cl;

-- Tabla para Peru
USE appointments_pe;

CREATE TABLE IF NOT EXISTS appointments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id VARCHAR(36)  NOT NULL UNIQUE,
  insured_id    VARCHAR(5)   NOT NULL,
  schedule_id   INT          NOT NULL,
  country_iso   VARCHAR(2)   NOT NULL DEFAULT 'PE',
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_insured_id (insured_id),
  INDEX idx_status (status)
);

-- Tabla para Chile
USE appointments_cl;

CREATE TABLE IF NOT EXISTS appointments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id VARCHAR(36)  NOT NULL UNIQUE,
  insured_id    VARCHAR(5)   NOT NULL,
  schedule_id   INT          NOT NULL,
  country_iso   VARCHAR(2)   NOT NULL DEFAULT 'CL',
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_insured_id (insured_id),
  INDEX idx_status (status)
);
