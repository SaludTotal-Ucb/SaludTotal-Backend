# SaludTotal Backend (Monolito)

Este repo ahora contiene **un solo backend monolítico** (Auth + Citas + Historial) en `src/`.

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run start:dev
```

Por defecto levanta en `http://localhost:3000`.

## Endpoints principales

- Auth (Express):
  - `POST /auth/login`
  - `POST /auth/register`
  - `GET /auth/profile` (JWT)
  - Alias: todo también disponible en `/api/auth/*`
- Citas (Express): ` /api/citas/*`
- Historial (Nest): ` /api/historial/*`

## Calidad de código

- Biome: `npm run lint`, `npm run format`
- Husky + lint-staged: corre en `pre-commit`

## Nota sobre BD

Por ahora, **se removió la conexión a BD** de Auth/Citas/Historial (se usa memoria en runtime).
Luego se integrará la base de datos unificada cuando la compartas.
