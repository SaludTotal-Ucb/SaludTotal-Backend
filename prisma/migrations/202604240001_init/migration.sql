-- CreateEnum
CREATE TYPE "cita_estado" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'absent');

-- CreateEnum
CREATE TYPE "citas_estado_enum" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'absent');

-- CreateEnum
CREATE TYPE "diagnostico_severidad" AS ENUM ('LEVE', 'MODERADO', 'GRAVE');

-- CreateEnum
CREATE TYPE "penalizaciones_tipo_enum" AS ENUM ('late_cancellation', 'multiple_absences');

-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('paciente', 'medico', 'admin');

-- CreateTable
CREATE TABLE "citas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "paciente_id" UUID NOT NULL,
    "medico_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL,
    "especialidad" VARCHAR(120) NOT NULL,
    "estado" "cita_estado" NOT NULL DEFAULT 'pending',
    "notas" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penalizaciones" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "paciente_id" UUID NOT NULL,
    "motivo" "penalizaciones_tipo_enum" NOT NULL,
    "fecha_fin" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penalizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinica_especialidades" (
    "clinica_id" UUID NOT NULL,
    "especialidad_id" UUID NOT NULL,

    CONSTRAINT "clinica_especialidades_pkey" PRIMARY KEY ("clinica_id","especialidad_id")
);

-- CreateTable
CREATE TABLE "clinicas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" VARCHAR(150) NOT NULL,
    "ciudad" VARCHAR(100),
    "direccion" TEXT NOT NULL,
    "telefono" VARCHAR(20),
    "email" VARCHAR(150),
    "horario" VARCHAR(100),
    "descripcion" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas_medicas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "expediente_id" UUID,
    "medico_encargado" UUID,
    "diagnostico" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "severidad" "diagnostico_severidad",
    "tratamiento" TEXT,
    "proxima_cita" DATE,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_medicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_medicos" (
    "usuario_id" UUID NOT NULL,
    "clinica_id" UUID,
    "especialidad_id" UUID,
    "numero_licencia" VARCHAR(50) NOT NULL,
    "horario_atencion" VARCHAR(100),

    CONSTRAINT "detalles_medicos_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "especialidades" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "especialidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expedientes_clinicos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "paciente_id" UUID,
    "alergias" TEXT,
    "antecedentes_familiares" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expedientes_clinicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_medicos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "paciente_id" UUID NOT NULL,
    "tipo_sangre" VARCHAR(10) NOT NULL,
    "alergias" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tratamientos_en_curso" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "afecciones" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "historial_medicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recetas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "consulta_id" UUID,
    "medicamento" VARCHAR(150) NOT NULL,
    "dosis" VARCHAR(100) NOT NULL,
    "frecuencia" VARCHAR(100) NOT NULL,
    "indicaciones" TEXT,
    "duracion_dias" INTEGER,

    CONSTRAINT "recetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(150) NOT NULL,
    "ci" VARCHAR(20) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20),
    "password" TEXT NOT NULL,
    "rol" "rol_usuario" NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "citas_medico_id_fecha_idx" ON "citas"("medico_id", "fecha");

-- CreateIndex
CREATE INDEX "citas_paciente_id_fecha_idx" ON "citas"("paciente_id", "fecha");

-- CreateIndex
CREATE INDEX "penalizaciones_paciente_id_fecha_fin_idx" ON "penalizaciones"("paciente_id", "fecha_fin");

-- CreateIndex
CREATE UNIQUE INDEX "especialidades_nombre_key" ON "especialidades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "expedientes_clinicos_paciente_id_key" ON "expedientes_clinicos"("paciente_id");

-- CreateIndex
CREATE UNIQUE INDEX "historial_medicos_paciente_id_key" ON "historial_medicos"("paciente_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "penalizaciones" ADD CONSTRAINT "penalizaciones_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clinica_especialidades" ADD CONSTRAINT "clinica_especialidades_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "clinicas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clinica_especialidades" ADD CONSTRAINT "clinica_especialidades_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "especialidades"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultas_medicas" ADD CONSTRAINT "consultas_medicas_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes_clinicos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultas_medicas" ADD CONSTRAINT "consultas_medicas_medico_encargado_fkey" FOREIGN KEY ("medico_encargado") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalles_medicos" ADD CONSTRAINT "detalles_medicos_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "clinicas"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalles_medicos" ADD CONSTRAINT "detalles_medicos_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "especialidades"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalles_medicos" ADD CONSTRAINT "detalles_medicos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expedientes_clinicos" ADD CONSTRAINT "expedientes_clinicos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historial_medicos" ADD CONSTRAINT "historial_medicos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "consultas_medicas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

