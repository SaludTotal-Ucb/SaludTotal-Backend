import { PrismaClient, cita_estado, penalizaciones_tipo_enum, rol_usuario } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcryptjs.hash('12345678', 10);

  const paciente = await prisma.usuarios.upsert({
    where: { email: 'paciente.demo@saludtotal.com' },
    update: {},
    create: {
      name: 'Paciente Demo',
      ci: 'CI-1001',
      email: 'paciente.demo@saludtotal.com',
      phone: '70000001',
      password: passwordHash,
      rol: rol_usuario.paciente,
    },
  });

  const medico = await prisma.usuarios.upsert({
    where: { email: 'medico.demo@saludtotal.com' },
    update: {},
    create: {
      name: 'Medico Demo',
      ci: 'CI-2001',
      email: 'medico.demo@saludtotal.com',
      phone: '70000002',
      password: passwordHash,
      rol: rol_usuario.medico,
    },
  });

  await prisma.historial_medicos.upsert({
    where: { paciente_id: paciente.id },
    update: {
      tipo_sangre: 'O+',
      alergias: ['Penicilina'],
      tratamientos_en_curso: ['Control de presión arterial'],
      afecciones: [
        {
          problema: 'Hipertension',
          severidad: 'Moderada',
          diagnostico: 'Seguimiento regular',
        },
      ],
    },
    create: {
      paciente_id: paciente.id,
      tipo_sangre: 'O+',
      alergias: ['Penicilina'],
      tratamientos_en_curso: ['Control de presión arterial'],
      afecciones: [
        {
          problema: 'Hipertension',
          severidad: 'Moderada',
          diagnostico: 'Seguimiento regular',
        },
      ],
    },
  });

  await prisma.citas.create({
    data: {
      paciente_id: paciente.id,
      medico_id: medico.id,
      fecha: new Date(),
      especialidad: 'Medicina General',
      estado: cita_estado.pending,
      notas: 'Cita de prueba para desarrollo',
    },
  });

  await prisma.penalizaciones.upsert({
    where: {
      id: '00000000-0000-0000-0000-000000000001',
    },
    update: {
      paciente_id: paciente.id,
      motivo: penalizaciones_tipo_enum.late_cancellation,
      fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      paciente_id: paciente.id,
      motivo: penalizaciones_tipo_enum.late_cancellation,
      fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });