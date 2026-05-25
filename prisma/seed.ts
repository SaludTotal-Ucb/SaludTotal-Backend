import {
  PrismaClient,
  cita_estado,
  penalizaciones_tipo_enum,
  rol_usuario,
} from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcryptjs.hash('12345678', 10);

  // 1. Especialidades
  const specialtiesList = [
    'Cardiología',
    'Dermatología',
    'Ginecología',
    'Medicina General',
    'Neurología',
    'Oftalmología',
    'Pediatría',
    'Traumatología',
    'Urología',
    'Endocrinología',
  ];

  const specialtiesMap: Record<string, any> = {};

  for (const name of specialtiesList) {
    const spec = await prisma.especialidades.upsert({
      where: { nombre: name },
      update: {},
      create: { nombre: name },
    });
    specialtiesMap[name] = spec;
  }

  // 2. Clínicas
  const clinicsData = [
    {
      nombre: 'Hospital Central',
      ciudad: 'Santa Cruz',
      direccion: 'Av. Banzer #123, Zona Norte',
      telefono: '3-333333',
      email: 'contacto@central.com',
      horario: 'Lunes a Viernes 08:00 - 20:00',
      descripcion: 'Hospital principal de tercer nivel.',
      especialidades: [
        'Cardiología',
        'Dermatología',
        'Medicina General',
        'Pediatría',
        'Traumatología',
      ],
    },
    {
      nombre: 'Clínica del Sur',
      ciudad: 'La Paz',
      direccion: 'Calle 15 de Calacoto #456',
      telefono: '2-222222',
      email: 'contacto@clinicasur.com',
      horario: 'Lunes a Sábado 08:00 - 18:00',
      descripcion: 'Especialistas en atención familiar.',
      especialidades: [
        'Ginecología',
        'Neurología',
        'Oftalmología',
        'Medicina General',
      ],
    },
    {
      nombre: 'Centro Médico Norte',
      ciudad: 'Cochabamba',
      direccion: 'Av. América #456',
      telefono: '4-444444',
      email: 'contacto@mediconorte.com',
      horario: '24 Horas',
      descripcion: 'Centro médico con atención de emergencias 24/7.',
      especialidades: ['Cardiología', 'Dermatología', 'Medicina General'],
    },
  ];

  const clinicsMap: Record<string, any> = {};

  for (const data of clinicsData) {
    let clinic = await prisma.clinicas.findFirst({
      where: { nombre: data.nombre },
    });

    if (clinic) {
      clinic = await prisma.clinicas.update({
        where: { id: clinic.id },
        data: {
          ciudad: data.ciudad,
          direccion: data.direccion,
          telefono: data.telefono,
          email: data.email,
          horario: data.horario,
          descripcion: data.descripcion,
        },
      });
    } else {
      clinic = await prisma.clinicas.create({
        data: {
          id:
            data.nombre === 'Hospital Central'
              ? '11111111-1111-1111-1111-111111111111'
              : undefined,
          nombre: data.nombre,
          ciudad: data.ciudad,
          direccion: data.direccion,
          telefono: data.telefono,
          email: data.email,
          horario: data.horario,
          descripcion: data.descripcion,
        },
      });
    }

    clinicsMap[data.nombre] = clinic;

    // Vincular especialidades a la clínica
    for (const specName of data.especialidades) {
      const spec = specialtiesMap[specName];
      if (spec) {
        await prisma.clinica_especialidades.upsert({
          where: {
            clinica_id_especialidad_id: {
              clinica_id: clinic.id,
              especialidad_id: spec.id,
            },
          },
          update: {},
          create: {
            clinica_id: clinic.id,
            especialidad_id: spec.id,
          },
        });
      }
    }
  }

  // 3. Usuarios
  // Paciente Demo
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

  // Admin Demo
  await prisma.usuarios.upsert({
    where: { email: 'admin.demo@saludtotal.com' },
    update: {},
    create: {
      name: 'Admin Demo',
      ci: 'CI-3001',
      email: 'admin.demo@saludtotal.com',
      phone: '70000003',
      password: passwordHash,
      rol: rol_usuario.admin,
    },
  });

  // Médico Demo 1 (Cardiología en Hospital Central)
  const medico1 = await prisma.usuarios.upsert({
    where: { email: 'medico.demo@saludtotal.com' },
    update: {},
    create: {
      name: 'Dr. Carlos Mendoza',
      ci: 'CI-2001',
      email: 'medico.demo@saludtotal.com',
      phone: '70000002',
      password: passwordHash,
      rol: rol_usuario.medico,
    },
  });

  await prisma.detalles_medicos.upsert({
    where: { usuario_id: medico1.id },
    update: {
      clinica_id: clinicsMap['Hospital Central'].id,
      especialidad_id: specialtiesMap['Cardiología'].id,
      numero_licencia: 'LM-2001',
      horario_atencion: 'Lunes a Viernes 08:00 - 16:00',
    },
    create: {
      usuario_id: medico1.id,
      clinica_id: clinicsMap['Hospital Central'].id,
      especialidad_id: specialtiesMap['Cardiología'].id,
      numero_licencia: 'LM-2001',
      horario_atencion: 'Lunes a Viernes 08:00 - 16:00',
    },
  });

  // Médico Demo 2 (Ginecología en Clínica del Sur)
  const medico2 = await prisma.usuarios.upsert({
    where: { email: 'medico.gineco@saludtotal.com' },
    update: {},
    create: {
      name: 'Dra. Patricia Luna',
      ci: 'CI-2002',
      email: 'medico.gineco@saludtotal.com',
      phone: '70000004',
      password: passwordHash,
      rol: rol_usuario.medico,
    },
  });

  await prisma.detalles_medicos.upsert({
    where: { usuario_id: medico2.id },
    update: {
      clinica_id: clinicsMap['Clínica del Sur'].id,
      especialidad_id: specialtiesMap['Ginecología'].id,
      numero_licencia: 'LM-2002',
      horario_atencion: 'Lunes a Sábado 09:00 - 14:00',
    },
    create: {
      usuario_id: medico2.id,
      clinica_id: clinicsMap['Clínica del Sur'].id,
      especialidad_id: specialtiesMap['Ginecología'].id,
      numero_licencia: 'LM-2002',
      horario_atencion: 'Lunes a Sábado 09:00 - 14:00',
    },
  });

  // 4. Historial médico estático del paciente
  await prisma.historial_medicos.upsert({
    where: { paciente_id: paciente.id },
    update: {
      tipo_sangre: 'O+',
      alergias: ['Penicilina'],
      tratamientos_en_curso: ['Control de presión arterial'],
      afecciones: [
        {
          problema: 'Hipertensión',
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
          problema: 'Hipertensión',
          severidad: 'Moderada',
          diagnostico: 'Seguimiento regular',
        },
      ],
    },
  });

  // 5. Cita inicial de prueba
  // Buscar si ya existe la cita
  const existingCitas = await prisma.citas.findMany({
    where: { paciente_id: paciente.id, medico_id: medico1.id },
  });

  if (existingCitas.length === 0) {
    await prisma.citas.create({
      data: {
        paciente_id: paciente.id,
        medico_id: medico1.id,
        fecha: new Date(),
        especialidad: 'Cardiología',
        estado: cita_estado.pending,
        notas: 'Cita de prueba para cardiología',
      },
    });
  }

  // 6. Penalización
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
