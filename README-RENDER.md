# Despliegue en Render

## Pasos para desplegar en Render

### 1. Crear cuenta en Render
- Ve a [render.com](https://render.com)
- Crea una cuenta o inicia sesión

### 2. Conectar repositorio
- Si tienes el código en GitHub/GitLab, conéctalo
- O sube el código directamente

### 3. Crear nuevo Web Service
- Click en "New" → "Web Service"
- Selecciona tu repositorio o sube el código

### 4. Configuración del servicio

**Configuración básica:**
- **Name:** `pagador-simulator`
- **Environment:** `Node`
- **Build Command:** `npm install && npm run build:client`
- **Start Command:** `npm start`
- **Root Directory:** `.` (raíz del proyecto)

**Variables de entorno:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@api.ro8hhr9.mongodb.net/pagador?retryWrites=true&w=majority
NOTIFICATION_SERVICE_URL=https://zkslv9jlz3.execute-api.us-east-1.amazonaws.com/notifications
PORT=10000
```

**Nota:** Render asigna automáticamente el puerto, pero puedes usar `PORT=10000` como fallback.

### 5. Health Check
- **Health Check Path:** `/health`

### 6. Desplegar
- Click en "Create Web Service"
- Render comenzará a construir y desplegar tu aplicación

## Estructura del proyecto

```
PAGADOR/
├── src/              # Backend (Express + MongoDB)
├── client/           # Frontend (React + Vite)
├── package.json      # Dependencias backend
├── render.yaml       # Configuración Render (opcional)
└── .env.example      # Variables de entorno ejemplo
```

## Verificación post-despliegue

1. Verifica que el servicio esté corriendo (status: Live)
2. Accede a la URL proporcionada por Render
3. Prueba el endpoint `/health`
4. Prueba crear un pago desde la UI

## Troubleshooting

**Error de build:**
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build en Render

**Error de conexión a MongoDB:**
- Verifica que `MONGODB_URI` esté correctamente configurada
- Asegúrate de que la IP de Render esté en la whitelist de MongoDB Atlas

**Frontend no carga:**
- Verifica que el build del frontend se haya completado
- Revisa que los archivos estáticos estén en `client/dist`

## URLs importantes

- **Aplicación:** `https://tu-app.onrender.com`
- **API Health:** `https://tu-app.onrender.com/health`
- **API Info:** `https://tu-app.onrender.com/api`
