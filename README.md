# Medical Appointment Backend — Rimac

Backend serverless para agendamiento de citas medicas de asegurados.
Construido con **AWS**, **Serverless Framework**, **TypeScript** y **Arquitectura Hexagonal**.

---

## Arquitectura hexagonal (Ports & Adapters)

```
           ┌─────────────────────────────────────────────────┐
           │                    CORE                          │
           │                                                   │
           │  domain/entities     ←  Appointment, tipos       │
           │                                                   │
           │  ports/inbound       ←  ICreateAppointmentUseCase│
           │                         IGetAppointments...      │
           │                         ICompleteAppointment...  │
           │                         IProcessAppointment...   │
           │                                                   │
           │  ports/outbound      ←  IAppointmentDynamoRepo   │
           │                         IAppointmentRdsRepo      │
           │                         ISnsPublisher            │
           │                         IEventBridgePublisher    │
           │                                                   │
           │  use-cases           ←  Implementan inbound ports│
           │                         Usan outbound ports      │
           └──────────────┬──────────────────────┬────────────┘
                          │                      │
          ┌───────────────▼──────┐   ┌───────────▼──────────────┐
          │  ADAPTERS INBOUND    │   │  ADAPTERS OUTBOUND       │
          │  (lado primario)     │   │  (lado secundario)       │
          │                      │   │                          │
          │  http/               │   │  dynamo/  → DynamoDB     │
          │    CreateAdapter     │   │  rds/     → MySQL RDS    │
          │    GetAdapter        │   │  sns/     → SNS          │
          │                      │   │  eventbridge/ → EB       │
          │  sqs/                │   └──────────────────────────┘
          │    CompletionAdapter │
          │    CountryAdapter    │
          └──────────┬───────────┘
                     │
          ┌──────────▼───────────┐
          │     FUNCTIONS        │
          │  (composition root)  │
          │                      │
          │  appointment/        │
          │  appointment-pe/     │
          │  appointment-cl/     │
          └──────────────────────┘
```

### Principio central
El **core** (domain + ports + use-cases) **no importa nada de AWS ni de frameworks**.
Las dependencias siempre apuntan hacia adentro. Los adaptadores son los unicos
que conocen DynamoDB, MySQL, SNS, EventBridge o API Gateway.

---

## Flujo de procesamiento

```
POST /appointments
      │
      ▼ (202 inmediato)
  Lambda: appointment
      ├── DynamoDB  → status: "pending"
      └── SNS Topic (filtro countryISO)
                │
          ┌─────┴──────┐
          ▼            ▼
       SQS_PE       SQS_CL
          │            │
          ▼            ▼
  Lambda: appointmentPe  Lambda: appointmentCl
          ├── RDS MySQL (appointments_pe/cl)
          └── EventBridge → AppointmentCompleted
                        │
                  SQS completion
                        │
                        ▼
              Lambda: appointment
                        └── DynamoDB → status: "completed"
```

---

## Servicios AWS creados por codigo (serverless.yml)

| Recurso               | Nombre                                    |
|-----------------------|-------------------------------------------|
| API Gateway           | Auto-generado por Serverless              |
| Lambda appointment    | Handler: POST + GET + SQS completion      |
| Lambda appointmentPe  | Handler: SQS_PE trigger                   |
| Lambda appointmentCl  | Handler: SQS_CL trigger                   |
| DynamoDB              | `medical-appointment-backend-appointments-{stage}` |
| SNS Topic             | `medical-appointment-backend-appointment-topic-{stage}` |
| SQS Peru              | `SQS_PE_{stage}`                          |
| SQS Chile             | `SQS_CL_{stage}`                          |
| SQS Completion        | `medical-appointment-backend-completion-{stage}` |
| EventBridge Bus       | `medical-appointment-backend-event-bus-{stage}` |
| EventBridge Rule      | Filtra `AppointmentCompleted` → SQS completion |

> **Nota:** El RDS MySQL no se crea por codigo. Se asume existente.

---

## Estructura del proyecto

```
src/
  core/
    domain/entities/     Entidad Appointment y tipos
    ports/inbound/       Interfaces que los adaptadores HTTP/SQS usan
    ports/outbound/      Interfaces que los casos de uso necesitan
    use-cases/           Logica de negocio pura (sin dependencias externas)
  adapters/
    inbound/
      http/              Adaptan eventos HTTP de API Gateway
      sqs/               Adaptan eventos SQS de SNS y EventBridge
    outbound/
      dynamo/            Implementacion DynamoDB
      rds/               Implementacion MySQL (RDS)
      sns/               Implementacion SNS
      eventbridge/       Implementacion EventBridge
  functions/
    appointment/         Composition root — Lambda principal
    appointment-pe/      Composition root — Lambda Peru
    appointment-cl/      Composition root — Lambda Chile
  shared/helpers/        Utilidades transversales (HttpResponse)
tests/
  unit/
    core/use-cases/      Tests de los 4 casos de uso
    adapters/inbound/    Tests de los 4 adaptadores primarios
database/
  schema.sql             Script SQL para crear tablas en RDS
```

---

## Requisitos previos

- Node.js >= 20
- AWS CLI configurado: `aws configure`
- Serverless Framework: `npm install -g serverless`
- RDS MySQL existente (no se crea por codigo)

---

## Instalacion

```bash
npm install
```

---

## Variables de entorno

Copia `.env.example` a `.env` y completa con los datos de tu RDS:

```bash
cp .env.example .env
```

| Variable         | Descripcion                           |
|------------------|---------------------------------------|
| `RDS_HOST`       | Host del RDS MySQL                    |
| `RDS_PORT`       | Puerto (default: 3306)                |
| `RDS_USER`       | Usuario MySQL                         |
| `RDS_PASSWORD`   | Password MySQL                        |
| `RDS_DATABASE_PE`| Nombre de la base de datos Peru       |
| `RDS_DATABASE_CL`| Nombre de la base de datos Chile      |

---

## Base de datos RDS

Ejecutar el schema en el RDS existente antes del primer despliegue:

```bash
mysql -h <RDS_HOST> -u <RDS_USER> -p < database/schema.sql
```

---

## Tests

```bash
npm test                # todos los tests (8 suites)
npm run test:coverage   # con reporte de cobertura
```

---

## Despliegue

```bash
npm run deploy:dev         # stage dev en us-east-1
serverless deploy --stage prod --region sa-east-1
```

---

## Endpoints

### POST /appointments — Crear agendamiento

```bash
curl -X POST https://<URL>/dev/appointments \
  -H "Content-Type: application/json" \
  -d '{"insuredId": "00123", "scheduleId": 100, "countryISO": "PE"}'
```

**Respuesta 202:**
```json
{
  "message": "El agendamiento esta en proceso",
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validaciones:**
- `insuredId`: exactamente 5 digitos (permite ceros al inicio)
- `scheduleId`: numero entero
- `countryISO`: solo `"PE"` o `"CL"`

---

### GET /appointments/{insuredId} — Consultar agendamientos

```bash
curl https://<URL>/dev/appointments/00123
```

**Respuesta 200:**
```json
{
  "appointments": [
    {
      "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
      "insuredId": "00123",
      "scheduleId": 100,
      "countryISO": "PE",
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:45Z"
    }
  ]
}
```

---

## Documentacion API (Swagger)

Abrir [editor.swagger.io](https://editor.swagger.io) y pegar el contenido de `swagger.yml`.
