# Salud Total - Backend API (Monolito Modular)

El API de **Salud Total** es un monolito modular construido sobre **NestJS** y **TypeScript**. Administra la autenticación de usuarios, la gestión de citas médicas y los historiales clínicos de los pacientes, utilizando **Prisma ORM** y **PostgreSQL** para la persistencia de datos.

---

## 1. Arquitectura del Código (Clean Architecture)

El backend sigue los principios de **Clean Architecture** (Arquitectura Limpia) para mantener las reglas de negocio desacopladas de los frameworks y la base de datos. Cada módulo dentro de `src/modules/` se divide en tres capas fundamentales:

```
src/modules/[modulo]/
├── domain/            # Reglas del negocio: Entidades puras, excepciones de dominio e interfaces de repositorios.
├── application/       # Casos de uso de la aplicación, DTOs de entrada y validaciones.
└── infrastructure/    # Adaptadores externos: Controladores REST, entidades de base de datos (Prisma) y repositorios físicos.
```

### Módulos Implementados:
* `auth`: Gestión de registro, login multi-rol (`paciente`, `medico`, `admin`), y refresco automático de tokens JWT.
* `citas`: Flujos de creación, cancelación y consulta de citas médicas filtradas por especialidad o clínica.
* `historial`: Registro de consultas médicas y generación de recetas (prescripciones farmacéuticas) para los pacientes.
* `health`: Endpoint público para verificar el estado de salud del servidor.

---

## 2. Requisitos Previos

* **Node.js** v20+
* **npm** v9+
* **PostgreSQL** v16+ (Local o en contenedor de Docker)

---

## 3. Configuración Inicial y Conexión a Base de Datos

1. Copia y renombra el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
2. Configura tu variable `DATABASE_URL` y `DIRECT_URL` en el archivo `.env`:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/saludtotal?schema=public"
   DIRECT_URL="postgresql://postgres:postgrespassword@localhost:5432/saludtotal?schema=public"
   JWT_SECRET="supersaludtotal_secret"
   JWT_EXPIRES_IN="7d"
   ```
   *(Nota: Si estás corriendo la aplicación mediante Docker Compose, estas variables ya vienen configuradas automáticamente en el archivo `docker-compose.yml` para conectarse al servicio contenedor `db`).*

3. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

4. Genera el cliente de Prisma:
   ```bash
   npx prisma generate
   ```

5. Aplica las migraciones de base de datos y ejecuta la semilla (`seed`):
   ```bash
   npx prisma migrate dev
   ```
   *(Esto creará las tablas necesarias en PostgreSQL e insertará los usuarios iniciales de prueba para administrador, médico y paciente).*

---

## 4. Scripts de Ejecución

* **Modo Desarrollo (con Hot-Reload):**
  ```bash
  npm run start:dev
  ```
  El API estará disponible en: `http://localhost:3000`

* **Compilar para Producción:**
  ```bash
  npm run build
  ```

* **Ejecutar en Producción (código compilado):**
  ```bash
  npm run start:prod
  ```

---

## 5. Endpoints de la API y Documentación Swagger

La documentación completa de los endpoints interactivos está expuesta mediante OpenAPI (Swagger).

* **URL de Documentación:** `http://localhost:3000/api/docs`

### Endpoints Clave (Versionados bajo `/api/v1`):
* **Autenticación:**
  * `POST /api/v1/auth/register` - Registro de nuevos usuarios.
  * `POST /api/v1/auth/login` - Inicio de sesión (retorna token JWT y datos de rol).
  * `POST /api/v1/auth/refresh` - Renovación del token de acceso JWT.
  * `GET /api/v1/auth/profile` - Perfil de usuario (Protegido por Bearer Token).
* **Citas:**
  * `GET /api/v1/citas` - Listar citas médicas del usuario (médico o paciente).
  * `POST /api/v1/citas` - Agendar una nueva cita (validado por DTO).
  * `PATCH /api/v1/citas/:id/status` - Cambiar el estado de una cita (confirmada, cancelada, completada).
* **Historial Clínico:**
  * `GET /api/v1/historial/paciente/:id` - Obtener historial clínico y consultas anteriores.
  * `POST /api/v1/historial/consulta` - Registrar una nueva consulta médica (diagnóstico, severidad, tratamiento y receta).
* **Salud:**
  * `GET /api/health` - Health check público del contenedor.

---

## 6. Pruebas y Calidad de Código

El backend cuenta con herramientas modernas para asegurar la mantenibilidad y robustez del código.

### Linter y Formateador (Biome)
Biome analiza la calidad del código de forma ultra-rápida.
* **Verificar errores:** `npm run lint`
* **Corregir automáticamente:** `npm run lint:fix`

### Pruebas Unitarias (Vitest)
Las pruebas están diseñadas con **Vitest** y verifican el correcto funcionamiento de los casos de uso principales.
* **Ejecutar suite de pruebas:**
  ```bash
  npm test
  ```
  *(La suite de pruebas ejecuta 7 casos de prueba críticos de los casos de uso de registro y autenticación en la capa de aplicación, verificando credenciales correctas, contraseñas encriptadas y rechazo de correos duplicados).*
