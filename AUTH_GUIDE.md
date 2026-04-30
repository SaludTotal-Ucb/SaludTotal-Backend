# Guía Completa de Autenticación y Autorización - SaludTotal API

## Resumen

El sistema de autenticación implementado utiliza JWT (JSON Web Tokens) con tokens de acceso de corta duración (15 minutos) y tokens de refresco de larga duración (7 días). Este enfoque proporciona seguridad balanceada con comodidad del usuario.

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│  FLUJO COMPLETO DE AUTENTICACIÓN                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. REGISTRO (POST /api/auth/register)                         │
│     ├─ Validar input (email único, password válido)            │
│     ├─ Hash password con bcrypt (cost factor 10)               │
│     ├─ Crear usuario en BD                                     │
│     └─ Retornar usuario (sin password hash)                    │
│                                                                 │
│  2. LOGIN (POST /api/auth/login)                               │
│     ├─ Buscar usuario por email                                │
│     ├─ Verificar password con bcrypt.compare()                 │
│     ├─ Generar JWT access token (15min)                        │
│     ├─ Generar JWT refresh token (7 días)                      │
│     ├─ Guardar refresh token en BD                             │
│     └─ Retornar {user, accessToken, refreshToken}              │
│                                                                 │
│  3. ACCEDER RECURSO PROTEGIDO (GET /api/protected)             │
│     ├─ Extraer Bearer token del header Authorization           │
│     ├─ Verificar firma del token (JwtAuthGuard)                │
│     ├─ Extraer user info (id, email, roles)                    │
│     ├─ Verificar rol si es necesario (RolesGuard)              │
│     └─ Si válido: continuar; si no: 401 o 403                 │
│                                                                 │
│  4. REFRESCAR TOKEN (POST /api/auth/refresh)                   │
│     ├─ Buscar refresh token en BD                              │
│     ├─ Verificar que no esté expirado                          │
│     ├─ Validar firma del JWT refresh token                     │
│     ├─ Generar nuevo par de tokens (access + refresh)          │
│     ├─ ROTAR: Eliminar refresh token viejo, guardar nuevo      │
│     └─ Retornar {accessToken, refreshToken}                    │
│                                                                 │
│  5. LOGOUT (POST /api/auth/logout)                             │
│     ├─ Recibir refresh token                                   │
│     ├─ Eliminar refresh token de BD                            │
│     └─ Access token sigue válido hasta expiración (15min)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Endpoints de Autenticación

### 1. Registro de Usuario

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "ci": "12345678",
  "email": "juan@example.com",
  "password": "MiPassword123!",
  "phone": "+58412345678"
}
```

**Response Success (201 Created):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Juan Pérez",
    "ci": "12345678",
    "email": "juan@example.com",
    "roles": ["paciente"],
    "createdAt": "2026-04-30T10:30:00Z"
  }
}
```

**Response Error (409 Conflict):**
```json
{
  "success": false,
  "message": "El email ya está registrado"
}
```

### 2. Login (Autenticación)

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "juan@example.com",
  "password": "MiPassword123!"
}
```

**Response Success (200 OK):**
```json
{
  "success": true,
  "message": "Bienvenido",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "roles": ["paciente"]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

### 3. Refrescar Token

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Success (200 OK):**
```json
{
  "success": true,
  "message": "Token renovado exitosamente",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Token inválido o expirado"
}
```

### 4. Logout (Cierre de Sesión)

**Endpoint:** `POST /api/auth/logout`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Success (204 No Content):**
No hay body en la respuesta

**Response Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Token inválido"
}
```

## Acceso a Recursos Protegidos

### Ejemplo: Obtener Perfil del Usuario

**Endpoint:** `GET /api/profile`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6Imp1YW5AZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJwYWNpZW50ZSJdLCJpYXQiOjE3MTAwMDAwMDAsImV4cCI6MTcxMDAwOTAwMH0.abc123...
```

**Response Success (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "roles": ["paciente"]
}
```

**Response Error - Sin Token (401 Unauthorized):**
```json
{
  "message": "Token de autenticación no proporcionado"
}
```

**Response Error - Token Expirado (401 Unauthorized):**
```json
{
  "message": "El token ha expirado. Por favor, inicie sesión nuevamente."
}
```

## Autorización por Roles

### Roles Disponibles

- **paciente**: Usuario regular que accede a sus citas, historial médico
- **medico**: Profesional que atiende pacientes, ve historial médico
- **admin**: Administrador del sistema, acceso total

### Ejemplo: Endpoint Solo para Administradores

```typescript
// En el controlador:
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { createRolesGuard } from '../middlewares/roles.guard';

@Get('admin/users')
@UseGuards(JwtAuthGuard, createRolesGuard(['admin']))
async getAllUsers() {
  // Solo admin puede acceder
  return await this.userService.findAll();
}
```

**Request with Non-Admin User:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (paciente)
```

**Response Error (403 Forbidden):**
```json
{
  "message": "No tienes permisos suficientes para acceder a este recurso"
}
```

## Estructura del JWT

### Access Token (estructura):
```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "juan@example.com",
  "roles": ["paciente"],
  "iat": 1710000000,
  "exp": 1710003600
}

Signature: HMAC-SHA256(base64(header) + "." + base64(payload), JWT_SECRET)
```

### Tiempos de Expiración:
- **Access Token**: 15 minutos (configurable en `JWT_EXPIRES_IN`)
- **Refresh Token**: 7 días (configurable en `JWT_REFRESH_EXPIRES_IN`)

## Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# JWT
JWT_SECRET=tu_secreto_muy_largo_y_seguro_32_caracteres_minimo
JWT_REFRESH_SECRET=otro_secreto_muy_largo_y_seguro_32_caracteres_minimo
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## Flujo de Cliente (Frontend)

### 1. Almacenamiento de Tokens

```javascript
// Opción A: Memory + HttpOnly Cookie (RECOMENDADO para producción)
// Access token: almacenar en variable de estado (React)
// Refresh token: almacenar en HttpOnly cookie (servidor envía automáticamente)

// Opción B: LocalStorage (más simple, menos seguro)
localStorage.setItem('accessToken', loginResponse.data.accessToken);
localStorage.setItem('refreshToken', loginResponse.data.refreshToken);
```

### 2. Realizar Peticiones Autenticadas

```javascript
// Con fetch
const response = await fetch('/api/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

// Con axios
axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
const response = await axios.get('/api/profile');
```

### 3. Manejar Token Expirado

```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers
      }
    });

    if (response.status === 401) {
      // Token expirado, intentar refrescar
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });

      if (refreshResponse.ok) {
        const { data } = await refreshResponse.json();
        accessToken = data.accessToken; // Guardar nuevo token
        refreshToken = data.refreshToken; // Guardar nuevo refresh token

        // Reintentar la petición original
        return fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            ...options.headers
          }
        });
      } else {
        // Refresh token también expiró, ir a login
        window.location.href = '/login';
      }
    }

    return response;
  } catch (error) {
    console.error('Error en petición autenticada:', error);
    throw error;
  }
}
```

### 4. Logout

```javascript
async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  });

  // Limpiar tokens del cliente
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  accessToken = null;
  refreshToken = null;

  // Redirigir a login
  window.location.href = '/login';
}
```

## Seguridad: Checklist de Implementación

- ✅ **Hashing de Contraseñas**: bcryptjs con cost factor 10
- ✅ **Tokens de Corta Duración**: Access token 15 minutos
- ✅ **Rotación de Refresh Tokens**: Nuevo refresh token en cada renovación
- ✅ **Revocación de Tokens**: Logout elimina refresh token de BD
- ✅ **JWT Signatures**: Verificadas en cada petición
- ✅ **Autorización por Roles**: Middleware de roles en endpoints protegidos
- ✅ **Errores Consistentes**: "Credenciales inválidas" para email/password incorrecto
- ✅ **Variables de Entorno**: Secretos fuera del código fuente
- ✅ **Índices de BD**: Para búsqueda rápida de refresh tokens

## Pruebas de Flujo Completo

### 1. Registrarse (Nuevo Usuario)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "ci": "12345678",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "phone": "+58412345678"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```
Guardar `accessToken` y `refreshToken` de la respuesta.

### 3. Acceder Recurso Protegido
```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer <accessToken>"
```

### 4. Refrescar Token (después de 15 min o para probar)
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'
```

### 5. Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'
```

### 6. Intentar usar refresh token después de logout (debe fallar)
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'
# Debe retornar 401: Token inválido
```

## Datos de Demostración en BD

El `npm run db:seed` proporciona usuarios de prueba:

**Paciente:**
- Email: `paciente.demo@saludtotal.com`
- Password: `12345678`
- Rol: `paciente`

**Médico:**
- Email: `medico.demo@saludtotal.com`
- Password: `12345678`
- Rol: `medico`

**Admin (si es necesario crear):**
- Rol: `admin`

## Próximos Pasos

1. **Frontend**: Implementar componentes de login/registro con manejo de tokens
2. **Protected Routes**: Crear componente ProtectedRoute en React
3. **Refresh Automático**: Interceptor para renovar token automáticamente
4. **MFA**: Agregar autenticación de dos factores (opcional)
5. **OAuth**: Integrar "Login con Google/GitHub" (opcional)
6. **Rate Limiting**: Limitar intentos de login fallidos
7. **Email Verification**: Verificar email al registrarse

## Referencias

- [JWT.io](https://jwt.io/) - Herramienta para debuggear JWTs
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)
- [jsonwebtoken Documentation](https://github.com/auth0/node-jsonwebtoken)
