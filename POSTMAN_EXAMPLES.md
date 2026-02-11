# Ejemplos para Postman y cURL

## Base URL
```
http://localhost:3000/api/payments
```

---

## 1. Crear Pago Aprobado (con panToken)

### cURL
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": {
      "id": "MERCHANT-001",
      "name": "Mi Tienda Online",
      "email": "pagos@mitienda.com",
      "notificationUrl": "https://comerciowebhook.onrender.com/webhook"
    },
    "amount": 1500.00,
    "currency": "ARS",
    "payer": {
      "name": "Juan Pérez",
      "email": "juan.perez@email.com",
      "documentType": "DNI",
      "documentNumber": "12345678"
    },
    "paymentMethod": {
      "type": "credit_card",
      "brand": "visa",
      "lastFourDigits": "4242"
    },
    "externalReference": "ORDER-12345",
    "description": "Compra en Mi Tienda Online",
    "sqsAttributes": {
      "allow_commerce_pan_token": "true",
      "from_batch": "false",
      "is_force": "false"
    }
  }'
```

### Postman

**Método:** `POST`  
**URL:** `http://localhost:3000/api/payments`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "merchant": {
    "id": "MERCHANT-001",
    "name": "Mi Tienda Online",
    "email": "pagos@mitienda.com",
    "notificationUrl": "https://comerciowebhook.onrender.com/webhook"
  },
  "amount": 1500.00,
  "currency": "ARS",
  "payer": {
    "name": "Juan Pérez",
    "email": "juan.perez@email.com",
    "documentType": "DNI",
    "documentNumber": "12345678"
  },
  "paymentMethod": {
    "type": "credit_card",
    "brand": "visa",
    "lastFourDigits": "4242"
  },
  "externalReference": "ORDER-12345",
  "description": "Compra en Mi Tienda Online",
  "sqsAttributes": {
    "allow_commerce_pan_token": "true",
    "from_batch": "false",
    "is_force": "false"
  }
}
```

**Nota:** Los tokens (token, tokenId, panToken, commerceToken) se generan automáticamente.

---

## 2. Crear Pago Aprobado (sin panToken)

### cURL
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": {
      "id": "MERCHANT-002",
      "name": "Comercio Test",
      "email": "test@comercio.com",
      "notificationUrl": "https://comerciowebhook.onrender.com/webhook"
    },
    "amount": 2500.00,
    "currency": "ARS",
    "payer": {
      "name": "María García",
      "email": "maria@email.com",
      "documentType": "DNI",
      "documentNumber": "87654321"
    },
    "paymentMethod": {
      "type": "credit_card",
      "brand": "mastercard",
      "lastFourDigits": "5555"
    },
    "externalReference": "ORDER-67890",
    "description": "Pago sin panToken",
    "sqsAttributes": {
      "allow_commerce_pan_token": "false",
      "from_batch": "false",
      "is_force": "false"
    }
  }'
```

### Postman

**Método:** `POST`  
**URL:** `http://localhost:3000/api/payments`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "merchant": {
    "id": "MERCHANT-002",
    "name": "Comercio Test",
    "email": "test@comercio.com",
    "notificationUrl": "https://comerciowebhook.onrender.com/webhook"
  },
  "amount": 2500.00,
  "currency": "ARS",
  "payer": {
    "name": "María García",
    "email": "maria@email.com",
    "documentType": "DNI",
    "documentNumber": "87654321"
  },
  "paymentMethod": {
    "type": "credit_card",
    "brand": "mastercard",
    "lastFourDigits": "5555"
  },
  "externalReference": "ORDER-67890",
  "description": "Pago sin panToken",
  "sqsAttributes": {
    "allow_commerce_pan_token": "false",
    "from_batch": "false",
    "is_force": "false"
  }
}
```

---

## 3. Crear Pago Rechazado

### cURL
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": {
      "id": "MERCHANT-001",
      "name": "Mi Tienda Online",
      "email": "pagos@mitienda.com",
      "notificationUrl": "https://comerciowebhook.onrender.com/webhook"
    },
    "amount": 1999.99,
    "currency": "ARS",
    "payer": {
      "name": "Carlos López",
      "email": "carlos@email.com",
      "documentType": "DNI",
      "documentNumber": "11223344"
    },
    "paymentMethod": {
      "type": "credit_card",
      "brand": "visa",
      "lastFourDigits": "1234"
    },
    "externalReference": "ORDER-REJECTED-001",
    "description": "Pago que será rechazado",
    "sqsAttributes": {
      "allow_commerce_pan_token": "true",
      "from_batch": "false",
      "is_force": "false"
    }
  }'
```

### Postman

**Método:** `POST`  
**URL:** `http://localhost:3000/api/payments`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "merchant": {
    "id": "MERCHANT-001",
    "name": "Mi Tienda Online",
    "email": "pagos@mitienda.com",
    "notificationUrl": "https://comerciowebhook.onrender.com/webhook"
  },
  "amount": 1999.99,
  "currency": "ARS",
  "payer": {
    "name": "Carlos López",
    "email": "carlos@email.com",
    "documentType": "DNI",
    "documentNumber": "11223344"
  },
  "paymentMethod": {
    "type": "credit_card",
    "brand": "visa",
    "lastFourDigits": "1234"
  },
  "externalReference": "ORDER-REJECTED-001",
  "description": "Pago que será rechazado",
  "sqsAttributes": {
    "allow_commerce_pan_token": "true",
    "from_batch": "false",
    "is_force": "false"
  }
}
```

**Nota:** Montos terminados en `.99` siempre se rechazan.

---

## 4. Crear Pago Pending (En proceso)

### cURL
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": {
      "id": "MERCHANT-001",
      "name": "Mi Tienda Online",
      "email": "pagos@mitienda.com",
      "notificationUrl": "https://comerciowebhook.onrender.com/webhook"
    },
    "amount": 1050.50,
    "currency": "ARS",
    "payer": {
      "name": "Ana Martínez",
      "email": "ana@email.com",
      "documentType": "DNI",
      "documentNumber": "55667788"
    },
    "paymentMethod": {
      "type": "credit_card",
      "brand": "mastercard",
      "lastFourDigits": "9999"
    },
    "externalReference": "ORDER-PENDING-001",
    "description": "Pago que quedará en proceso",
    "sqsAttributes": {
      "allow_commerce_pan_token": "true",
      "from_batch": "false",
      "is_force": "false"
    }
  }'
```

### Postman

**Método:** `POST`  
**URL:** `http://localhost:3000/api/payments`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "merchant": {
    "id": "MERCHANT-001",
    "name": "Mi Tienda Online",
    "email": "pagos@mitienda.com",
    "notificationUrl": "https://comerciowebhook.onrender.com/webhook"
  },
  "amount": 1050.50,
  "currency": "ARS",
  "payer": {
    "name": "Ana Martínez",
    "email": "ana@email.com",
    "documentType": "DNI",
    "documentNumber": "55667788"
  },
  "paymentMethod": {
    "type": "credit_card",
    "brand": "mastercard",
    "lastFourDigits": "9999"
  },
  "externalReference": "ORDER-PENDING-001",
  "description": "Pago que quedará en proceso",
  "sqsAttributes": {
    "allow_commerce_pan_token": "true",
    "from_batch": "false",
    "is_force": "false"
  }
}
```

**Nota:** Montos terminados en `.50` siempre quedan en estado `pending`.

---

## 5. Crear Pago con is_force: true

### cURL
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": {
      "id": "MERCHANT-001",
      "name": "Mi Tienda Online",
      "email": "pagos@mitienda.com",
      "notificationUrl": "https://comerciowebhook.onrender.com/webhook"
    },
    "amount": 5000.00,
    "currency": "ARS",
    "payer": {
      "name": "Luis Rodríguez",
      "email": "luis@email.com",
      "documentType": "DNI",
      "documentNumber": "99887766"
    },
    "paymentMethod": {
      "type": "credit_card",
      "brand": "visa",
      "lastFourDigits": "8888"
    },
    "externalReference": "ORDER-FORCE-001",
    "description": "Pago con is_force activado",
    "sqsAttributes": {
      "allow_commerce_pan_token": "true",
      "from_batch": "true",
      "is_force": "true"
    }
  }'
```

### Postman

**Método:** `POST`  
**URL:** `http://localhost:3000/api/payments`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "merchant": {
    "id": "MERCHANT-001",
    "name": "Mi Tienda Online",
    "email": "pagos@mitienda.com",
    "notificationUrl": "https://comerciowebhook.onrender.com/webhook"
  },
  "amount": 5000.00,
  "currency": "ARS",
  "payer": {
    "name": "Luis Rodríguez",
    "email": "luis@email.com",
    "documentType": "DNI",
    "documentNumber": "99887766"
  },
  "paymentMethod": {
    "type": "credit_card",
    "brand": "visa",
    "lastFourDigits": "8888"
  },
  "externalReference": "ORDER-FORCE-001",
  "description": "Pago con is_force activado",
  "sqsAttributes": {
    "allow_commerce_pan_token": "true",
    "from_batch": "true",
    "is_force": "true"
  }
}
```

---

## 6. Listar Pagos

### cURL
```bash
# Listar todos los pagos
curl -X GET "http://localhost:3000/api/payments"

# Filtrar por estado aprobado
curl -X GET "http://localhost:3000/api/payments?status=approved&page=1&limit=10"

# Filtrar por comercio
curl -X GET "http://localhost:3000/api/payments?merchantId=MERCHANT-001&page=1&limit=20"
```

### Postman

**Método:** `GET`  
**URL:** `http://localhost:3000/api/payments`  
**Query Params (opcionales):**
- `status`: `approved`, `rejected`, `pending`, `refunded`, `cancelled`
- `merchantId`: `MERCHANT-001`
- `notificationSent`: `true` o `false`
- `page`: `1`
- `limit`: `20`

**Ejemplo:**
```
GET http://localhost:3000/api/payments?status=approved&page=1&limit=10
```

---

## 7. Obtener Pago por TransactionId

### cURL
```bash
curl -X GET "http://localhost:3000/api/payments/TXN-1738535780000-A1B2C3D4"
```

### Postman

**Método:** `GET`  
**URL:** `http://localhost:3000/api/payments/{transactionId}`

**Ejemplo:**
```
GET http://localhost:3000/api/payments/TXN-1738535780000-A1B2C3D4
```

---

## 8. Obtener Pagos Pendientes de Notificación

**Método:** `GET`  
**URL:** `http://localhost:3000/api/payments/pending-notifications?limit=100`

---

## 9. Marcar Pago como Notificado

**Método:** `PATCH`  
**URL:** `http://localhost:3000/api/payments/{transactionId}/notified`

**Ejemplo:**
```
PATCH http://localhost:3000/api/payments/TXN-1738535780000-A1B2C3D4/notified
```

---

## 10. Reembolsar Pago

**Método:** `POST`  
**URL:** `http://localhost:3000/api/payments/{transactionId}/refund`

**Ejemplo:**
```
POST http://localhost:3000/api/payments/TXN-1738535780000-A1B2C3D4/refund
```

---

## 11. Crear 1000 Pagos (Bulk Test)

### cURL
```bash
curl -X POST "http://localhost:3000/api/payments/bulk/test?count=1000&allApproved=true&withoutPanToken=true"
```

### Postman

**Método:** `POST`  
**URL:** `http://localhost:3000/api/payments/bulk/test?count=1000&allApproved=true&withoutPanToken=true`

---

## 12. Crear 5000 Pagos (Bulk Test)

### cURL
```bash
curl -X POST "http://localhost:3000/api/payments/bulk/test?count=5000&allApproved=true&withoutPanToken=true"
```

### Postman

**Método:** `POST`  
**URL:** `http://localhost:3000/api/payments/bulk/test?count=5000&allApproved=true&withoutPanToken=true`

---

## 13. Crear 50 Pagos Aprobados (con/sin panToken)

### cURL
```bash
curl -X POST "http://localhost:3000/api/payments/bulk/test-approved?count=50"
```

### Postman

**Método:** `POST`  
**URL:** `http://localhost:3000/api/payments/bulk/test-approved?count=50`

---

## 14. Crear 10 Pagos con Duplicados

### cURL
```bash
curl -X POST "http://localhost:3000/api/payments/bulk/test-duplicates"
```

### Postman

**Método:** `POST`  
**URL:** `http://localhost:3000/api/payments/bulk/test-duplicates`

---

## Reglas de Simulación

| Monto termina en | Resultado |
|------------------|-----------|
| `.00` | ✅ Siempre **aprobado** |
| `.99` | ❌ Siempre **rechazado** |
| `.50` | ⏳ Siempre **pending** |
| Otro | 🎲 80% aprobado, 15% rechazado, 5% pending |

---

## Respuesta Exitosa (Ejemplo)

```json
{
  "success": true,
  "data": {
    "transactionId": "TXN-1738535780000-A1B2C3D4",
    "status": "approved",
    "responseCode": "00",
    "responseMessage": "Transacción aprobada",
    "amount": 1500,
    "currency": "ARS",
    "merchant": {
      "id": "MERCHANT-001",
      "name": "Mi Tienda Online"
    },
    "paymentMethod": {
      "type": "credit_card",
      "brand": "visa",
      "lastFourDigits": "4242",
      "token": "tok_xxxxxxxxxxxxxxxxxxxxxxxx",
      "tokenId": "uuid-...",
      "panToken": "pan_tok_visa_XXXX-XXXX-XXXX",
      "commerceToken": "com_xxxxxxxxxxxxxxxxxxxx"
    },
    "createdAt": "2026-02-02T15:00:00.000Z",
    "notificationSent": true
  }
}
```

---

## Payload que se envía a AWS

Cuando un pago es creado, se envía automáticamente a AWS:

**URL:** `https://xihdqvazw6.execute-api.us-east-1.amazonaws.com/notifications`  
**Método:** `POST`  
**Body:**
```json
{
  "QueueUrl": "https://xihdqvazw6.execute-api.us-east-1.amazonaws.com/notifications",
  "MessageBody": "67a0c5f8e4b0a1234567890a",
  "paymentMethod": {
    "type": "credit_card",
    "brand": "visa",
    "lastFourDigits": "4242",
    "token": "tok_xxxxxxxxxxxxxxxxxxxxxxxx",
    "tokenId": "uuid-...",
    "panToken": "pan_tok_visa_XXXX-XXXX-XXXX",
    "commerceToken": "com_xxxxxxxxxxxxxxxxxxxx"
  },
  "MessageAttributes": {
    "allow_commerce_pan_token": {
      "DataType": "String",
      "StringValue": "true"
    },
    "from_batch": {
      "DataType": "String",
      "StringValue": "false"
    },
    "is_force": {
      "DataType": "String",
      "StringValue": "false"
    }
  }
}
```

---

## Health Check

**Método:** `GET`  
**URL:** `http://localhost:3000/health`

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-02T15:00:00.000Z",
  "service": "Pagador Simulator"
}
```
