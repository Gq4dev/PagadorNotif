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
    "type": "debit",
    "validation": false,
    "review": false,
    "collector_id": "999",
    "collector_detail": {
      "name": "PRUEBA"
    },
    "notification_url": "https://comerciowebhook.onrender.com/webhook",
    "form_url": null,
    "details": [{
      "amount": 1500.0,
      "external_reference": "ORDER-12345",
      "concept_id": "prueba",
      "concept_description": "Concepto de prueba"
    }],
    "currency_id": "ARS",
    "payment_methods": [{
      "amount": 1500.0,
      "media_payment_id": 9,
      "media_payment_detail": "VISA CREDIT",
      "last_four_digits": "4242",
      "first_six_digits": "450799",
      "installments": 1,
      "payment_method_id": 0
    }],
    "final_amount": 1500.0,
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
  "type": "debit",
  "validation": false,
  "review": false,
  "collector_id": "999",
  "collector_detail": {
    "name": "PRUEBA"
  },
  "notification_url": "https://comerciowebhook.onrender.com/webhook",
  "form_url": null,
  "details": [{
    "amount": 1500.0,
    "external_reference": "ORDER-12345",
    "concept_id": "prueba",
    "concept_description": "Concepto de prueba"
  }],
  "currency_id": "ARS",
  "payment_methods": [{
    "amount": 1500.0,
    "media_payment_id": 9,
    "media_payment_detail": "VISA CREDIT",
    "last_four_digits": "4242",
    "first_six_digits": "450799",
    "installments": 1,
    "payment_method_id": 0
  }],
  "final_amount": 1500.0,
  "sqsAttributes": {
    "allow_commerce_pan_token": "true",
    "from_batch": "false",
    "is_force": "false"
  }
}
```

**Nota:** Los tokens (token, tokenId, panToken, commerceToken) y códigos de autorización se generan automáticamente.

---

## 2. Crear Pago Aprobado (sin panToken)

### cURL
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "type": "debit",
    "validation": false,
    "review": false,
    "collector_id": "999",
    "collector_detail": {
      "name": "PRUEBA"
    },
    "notification_url": "https://comerciowebhook.onrender.com/webhook",
    "form_url": null,
    "details": [{
      "amount": 2500.0,
      "external_reference": "ORDER-67890",
      "concept_id": "prueba",
      "concept_description": "Concepto de prueba sin panToken"
    }],
    "currency_id": "ARS",
    "payment_methods": [{
      "amount": 2500.0,
      "media_payment_id": 9,
      "media_payment_detail": "VISA CREDIT",
      "last_four_digits": "5555",
      "first_six_digits": "450799",
      "installments": 1,
      "payment_method_id": 0
    }],
    "final_amount": 2500.0,
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
  "type": "debit",
  "validation": false,
  "review": false,
  "collector_id": "999",
  "collector_detail": {
    "name": "PRUEBA"
  },
  "notification_url": "https://comerciowebhook.onrender.com/webhook",
  "form_url": null,
  "details": [{
    "amount": 2500.0,
    "external_reference": "ORDER-67890",
    "concept_id": "prueba",
    "concept_description": "Concepto de prueba sin panToken"
  }],
  "currency_id": "ARS",
  "payment_methods": [{
    "amount": 2500.0,
    "media_payment_id": 9,
    "media_payment_detail": "VISA CREDIT",
    "last_four_digits": "5555",
    "first_six_digits": "450799",
    "installments": 1,
    "payment_method_id": 0
  }],
  "final_amount": 2500.0,
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
    "type": "debit",
    "validation": false,
    "review": false,
    "collector_id": "999",
    "collector_detail": {
      "name": "PRUEBA"
    },
    "notification_url": "https://comerciowebhook.onrender.com/webhook",
    "form_url": null,
    "details": [{
      "amount": 1999.99,
      "external_reference": "ORDER-REJECTED-001",
      "concept_id": "prueba",
      "concept_description": "Pago que será rechazado"
    }],
    "currency_id": "ARS",
    "payment_methods": [{
      "amount": 1999.99,
      "media_payment_id": 9,
      "media_payment_detail": "VISA CREDIT",
      "last_four_digits": "1234",
      "first_six_digits": "450799",
      "installments": 1,
      "payment_method_id": 0
    }],
    "final_amount": 1999.99,
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
  "type": "debit",
  "validation": false,
  "review": false,
  "collector_id": "999",
  "collector_detail": {
    "name": "PRUEBA"
  },
  "notification_url": "https://comerciowebhook.onrender.com/webhook",
  "form_url": null,
  "details": [{
    "amount": 1999.99,
    "external_reference": "ORDER-REJECTED-001",
    "concept_id": "prueba",
    "concept_description": "Pago que será rechazado"
  }],
  "currency_id": "ARS",
  "payment_methods": [{
    "amount": 1999.99,
    "media_payment_id": 9,
    "media_payment_detail": "VISA CREDIT",
    "last_four_digits": "1234",
    "first_six_digits": "450799",
    "installments": 1,
    "payment_method_id": 0
  }],
  "final_amount": 1999.99,
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
    "type": "debit",
    "validation": false,
    "review": false,
    "collector_id": "999",
    "collector_detail": {
      "name": "PRUEBA"
    },
    "notification_url": "https://comerciowebhook.onrender.com/webhook",
    "form_url": null,
    "details": [{
      "amount": 1050.50,
      "external_reference": "ORDER-PENDING-001",
      "concept_id": "prueba",
      "concept_description": "Pago que quedará en proceso"
    }],
    "currency_id": "ARS",
    "payment_methods": [{
      "amount": 1050.50,
      "media_payment_id": 9,
      "media_payment_detail": "VISA CREDIT",
      "last_four_digits": "9999",
      "first_six_digits": "450799",
      "installments": 1,
      "payment_method_id": 0
    }],
    "final_amount": 1050.50,
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
  "type": "debit",
  "validation": false,
  "review": false,
  "collector_id": "999",
  "collector_detail": {
    "name": "PRUEBA"
  },
  "notification_url": "https://comerciowebhook.onrender.com/webhook",
  "form_url": null,
  "details": [{
    "amount": 1050.50,
    "external_reference": "ORDER-PENDING-001",
    "concept_id": "prueba",
    "concept_description": "Pago que quedará en proceso"
  }],
  "currency_id": "ARS",
  "payment_methods": [{
    "amount": 1050.50,
    "media_payment_id": 9,
    "media_payment_detail": "VISA CREDIT",
    "last_four_digits": "9999",
    "first_six_digits": "450799",
    "installments": 1,
    "payment_method_id": 0
  }],
  "final_amount": 1050.50,
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
    "type": "debit",
    "validation": false,
    "review": false,
    "collector_id": "999",
    "collector_detail": {
      "name": "PRUEBA"
    },
    "notification_url": "https://comerciowebhook.onrender.com/webhook",
    "form_url": null,
    "details": [{
      "amount": 5000.0,
      "external_reference": "ORDER-FORCE-001",
      "concept_id": "prueba",
      "concept_description": "Pago con is_force activado"
    }],
    "currency_id": "ARS",
    "payment_methods": [{
      "amount": 5000.0,
      "media_payment_id": 9,
      "media_payment_detail": "VISA CREDIT",
      "last_four_digits": "8888",
      "first_six_digits": "450799",
      "installments": 1,
      "payment_method_id": 0
    }],
    "final_amount": 5000.0,
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
  "type": "debit",
  "validation": false,
  "review": false,
  "collector_id": "999",
  "collector_detail": {
    "name": "PRUEBA"
  },
  "notification_url": "https://comerciowebhook.onrender.com/webhook",
  "form_url": null,
  "details": [{
    "amount": 5000.0,
    "external_reference": "ORDER-FORCE-001",
    "concept_id": "prueba",
    "concept_description": "Pago con is_force activado"
  }],
  "currency_id": "ARS",
  "payment_methods": [{
    "amount": 5000.0,
    "media_payment_id": 9,
    "media_payment_detail": "VISA CREDIT",
    "last_four_digits": "8888",
    "first_six_digits": "450799",
    "installments": 1,
    "payment_method_id": 0
  }],
  "final_amount": 5000.0,
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
curl -X GET "http://localhost:3000/api/payments?status=approved&skip=0&limit=10"

# Filtrar por colector
curl -X GET "http://localhost:3000/api/payments?collector_id=999&skip=0&limit=20"
```

### Postman

**Método:** `GET`  
**URL:** `http://localhost:3000/api/payments`  
**Query Params (opcionales):**
- `status`: `approved`, `rejected`, `pending`, `refunded`, `cancelled`
- `collector_id`: `999`
- `skip`: `0` (para paginación)
- `limit`: `20` (número de resultados)
- `sort`: `-createdAt` (ordenar por fecha descendente)

**Ejemplo:**
```
GET http://localhost:3000/api/payments?status=approved&skip=0&limit=10
```

---

## 7. Obtener Pago por TransactionId

### cURL
```bash
curl -X GET "http://localhost:3000/api/payments/{external_transaction_id}"
```

### Postman

**Método:** `GET`  
**URL:** `http://localhost:3000/api/payments/{external_transaction_id}`

**Ejemplo:**
```
GET http://localhost:3000/api/payments/c189ad3d-f5e7-4d33-a92e-09adcb9273ed
```

---

## 8. Obtener Pagos Pendientes de Notificación

**Método:** `GET`  
**URL:** `http://localhost:3000/api/payments/pending-notifications?limit=100`

---

## 9. Marcar Pago como Notificado

**Método:** `PATCH`  
**URL:** `http://localhost:3000/api/payments/{external_transaction_id}/notified`

**Ejemplo:**
```
PATCH http://localhost:3000/api/payments/c189ad3d-f5e7-4d33-a92e-09adcb9273ed/notified
```

---

## 10. Reembolsar Pago

**Método:** `POST`  
**URL:** `http://localhost:3000/api/payments/{external_transaction_id}/refund`

**Ejemplo:**
```
POST http://localhost:3000/api/payments/c189ad3d-f5e7-4d33-a92e-09adcb9273ed/refund
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
| `.50` | ⚠️ Siempre **pending** |
| Otro | 🎲 80% aprobado, 15% rechazado, 5% pending |

---

## Respuesta Exitosa (Ejemplo)

```json
{
  "success": true,
  "data": {
    "type": "debit",
    "validation": false,
    "review": false,
    "id": "554ecb4a-aec5-439f-b506-9a22215e0746",
    "external_transaction_id": "c189ad3d-f5e7-4d33-a92e-09adcb9273ed",
    "collector_id": "999",
    "collector_detail": {
      "name": "PRUEBA"
    },
    "notification_url": "https://comerciowebhook.onrender.com/webhook",
    "form_url": null,
    "details": [{
      "amount": 1500.0,
      "external_reference": "ORDER-12345",
      "concept_id": "prueba",
      "concept_description": "Concepto de prueba"
    }],
    "currency_id": "ARS",
    "payment_methods": [{
      "amount": 1500.0,
      "media_payment_id": 9,
      "media_payment_detail": "VISA CREDIT",
      "last_four_digits": "4242",
      "first_six_digits": "450799",
      "installments": 1,
      "authorization_code": "191780",
      "gateway": {
        "establishment_number": "PRUEBA",
        "transaction_id": "4021606",
        "batch_number": "1",
        "ticket_number": "1533",
        "ppt_owner": false
      },
      "payment_method_id": 0,
      "token": "tok_xxxxxxxxxxxxxxxxxxxxxxxx",
      "tokenId": "uuid-...",
      "panToken": "pan_tok_visa_XXXX-XXXX-XXXX",
      "commerceToken": "com_xxxxxxxxxxxxxxxxxxxx"
    }],
    "final_amount": 1500.0,
    "status": "approved",
    "status_detail": "APROBADA - Autorizada - MOP GPAY: -1 - Aprobada",
    "request_date": "2019-08-06T14:58:25-0300",
    "due_date": "2019-08-06T14:58:25-0300",
    "last_due_date": "2019-08-06T14:58:25-0300",
    "process_date": "2019-08-06T14:58:25-0300",
    "paid_date": "2019-08-06T14:58:25-0300",
    "accreditation_date": "2019-08-06T14:58:25-0300",
    "last_update_date": "2019-08-06T14:58:25-0300",
    "metadata": {},
    "source": {
      "id": "ee84ca67-5f90-4ca9-b587-37afce6ecc14",
      "name": "system-test",
      "type": "system"
    }
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
