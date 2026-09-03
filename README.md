# Universal NestJS Microservice

Minimal NestJS service for testing another repository's HTTP and TCP microservice communication.

## Run

```bash
npm install
```

Create `.env` from `.env.example`.

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Start:

```bash
npm run start:dev
```

The service runs on:

```text
HTTP: http://localhost:3000
TCP:  localhost:4001
```

## HTTP

Health:

```text
GET /health
```

Echo:

```text
POST /api/echo
```

Example body:

```json
{
  "message": "hello"
}
```

Event:

```text
POST /api/event
```

Decode VIN:

```text
POST /api/vehicles/decode-vin
```

Example body:

```json
{
  "vin": "1HGCM82633A004352"
}
```

Response:

```json
{
  "success": true,
  "vin": "1HGCM82633A004352",
  "manufacturer": "Honda",
  "country": "USA",
  "modelYear": 2033,
  "engine": "2.0L I4",
  "timestamp": "2026-09-03T12:00:00.000Z"
}
```

An invalid VIN (wrong length, invalid characters, or a failing ISO 3779 check digit)
responds with `400 Bad Request`:

```json
{
  "success": false,
  "error": "INVALID_VIN",
  "reason": "VIN check digit mismatch: expected '3', got '9'"
}
```

## TCP

The TCP microservice supports these patterns:

```text
ping
echo
event
decode-vin
```

Example client from another NestJS repository:

```typescript
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

const client = ClientProxyFactory.create({
  transport: Transport.TCP,
  options: {
    host: 'localhost',
    port: 4001,
  },
});

const response = await client
  .send('echo', {
    service: 'my-service',
    message: 'hello',
  })
  .toPromise();

console.log(response);
```

Response:

```json
{
  "success": true,
  "pattern": "echo",
  "received": {
    "service": "my-service",
    "message": "hello"
  }
}
```

Ping:

```typescript
const response = await client
  .send('ping', { from: 'my-service' })
  .toPromise();
```

Response:

```json
{
  "success": true,
  "pattern": "ping",
  "response": "pong",
  "received": {
    "from": "my-service"
  }
}
```

Decode VIN:

```typescript
const response = await client
  .send('decode-vin', { vin: '1HGCM82633A004352' })
  .toPromise();
```

Response:

```json
{
  "success": true,
  "pattern": "decode-vin",
  "vin": "1HGCM82633A004352",
  "manufacturer": "Honda",
  "country": "USA",
  "modelYear": 2033,
  "engine": "2.0L I4",
  "timestamp": "2026-09-03T12:00:00.000Z"
}
```

An invalid VIN returns an error shape instead of throwing:

```json
{
  "success": false,
  "pattern": "decode-vin",
  "error": "INVALID_VIN",
  "reason": "VIN check digit mismatch: expected '3', got '9'"
}
```

## Build

```bash
npm run build
npm run start:prod
```

## Structure

```text
universal-nestjs-microservice/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── microservice.controller.ts
│   └── vehicles/
│       ├── vehicles.controller.ts
│       ├── vin-decoder.service.ts
│       └── dto/
│           └── decode-vin.dto.ts
├── .env.example
├── .gitignore
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
```
