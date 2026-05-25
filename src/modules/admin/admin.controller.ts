import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { GetUserId } from '../../common/decorators/get-user-id.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/infrastructure/http/middlewares/jwt-auth.guard';
import { createRolesGuard } from '../auth/infrastructure/http/middlewares/roles.guard';

class CreateClinicDto {
  @ApiProperty({
    example: 'Clínica del Norte',
    description: 'Nombre de la clínica',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Santa Cruz', description: 'Ciudad donde se ubica' })
  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @ApiProperty({
    example: 'Av. Banzer #456, Zona Norte',
    description: 'Dirección completa',
  })
  @IsString()
  @IsNotEmpty()
  direccion: string;

  @ApiProperty({ example: '33445566', description: 'Teléfono de contacto' })
  @IsString()
  @IsOptional()
  telefono: string;

  @ApiProperty({
    example: 'contacto@clinicanorte.com',
    description: 'Correo electrónico',
  })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({
    example: 'Lunes a Viernes 08:00 - 20:00',
    description: 'Horario de atención',
  })
  @IsString()
  @IsOptional()
  horario: string;

  @ApiProperty({
    example: 'Atención médica general y especializada.',
    description: 'Breve descripción de la clínica',
  })
  @IsString()
  @IsOptional()
  descripcion: string;

  @ApiProperty({
    example: ['Medicina General', 'Pediatría', 'Cardiología'],
    description: 'Listado de especialidades disponibles en la clínica',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  especialidades: string[];
}

class CreateDoctorDto {
  @ApiProperty({
    example: 'Dr. Alejandro Ortiz',
    description: 'Nombre completo del médico',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'CI-4001', description: 'Cédula de identidad' })
  @IsString()
  @IsNotEmpty()
  ci: string;

  @ApiProperty({
    example: 'alejandro.ortiz@saludtotal.com',
    description: 'Correo electrónico del médico',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '70000005', description: 'Teléfono de contacto' })
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Contraseña para la cuenta del médico',
  })
  @IsString()
  @IsNotEmpty()
  passwordPlain: string;

  @ApiProperty({
    example: '11111111-1111-1111-1111-111111111111',
    description: 'ID de la clínica asignada',
  })
  @IsString()
  @IsNotEmpty()
  clinicaId: string;

  @ApiProperty({
    example: 'Medicina General',
    description: 'Especialidad médica',
  })
  @IsString()
  @IsNotEmpty()
  especialidad: string;

  @ApiProperty({ example: 'LM-4001', description: 'Número de licencia médica' })
  @IsString()
  @IsNotEmpty()
  numeroLicencia: string;

  @ApiProperty({
    example: 'Lunes a Viernes 08:00 - 14:00',
    description: 'Horario de consulta',
  })
  @IsString()
  @IsOptional()
  horarioAtencion: string;
}

@ApiTags('Administración')
@Controller()
export class AdminController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, createRolesGuard(['admin']))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener estadísticas consolidadas del dashboard (Solo Admin)',
    description:
      'Retorna las estadísticas del sistema: total de pacientes, médicos, clínicas, citas del día, penalizaciones activas y registro de actividad reciente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del dashboard recuperadas con éxito.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación inválido o ausente.',
  })
  @ApiResponse({
    status: 403,
    description: 'Privilegios insuficientes (Requiere rol admin).',
  })
  async getDashboard() {
    try {
      const totalPacientes = await this.prisma.usuarios.count({
        where: { rol: 'paciente' },
      });

      const totalMedicos = await this.prisma.usuarios.count({
        where: { rol: 'medico' },
      });

      const totalClinicas = await this.prisma.clinicas.count();

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const citasHoy = await this.prisma.citas.count({
        where: {
          fecha: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      });

      const activePenalties = await this.prisma.penalizaciones.findMany({
        where: {
          fecha_fin: {
            gt: new Date(),
          },
        },
        include: {
          usuarios: {
            select: {
              name: true,
              ci: true,
            },
          },
        },
      });

      const mappedPenalties = activePenalties.map((p) => ({
        id: p.id,
        paciente_id: p.paciente_id,
        paciente_nombre: p.usuarios?.name || 'Paciente no identificado',
        paciente_ci: p.usuarios?.ci || 'Sin CI',
        motivo: p.motivo,
        fecha_fin: p.fecha_fin,
      }));

      // Actividad Reciente (últimos usuarios, citas y clínicas)
      const ultimosUsuarios = await this.prisma.usuarios.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: { id: true, name: true, rol: true, created_at: true },
      });

      const ultimasCitas = await this.prisma.citas.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          usuarios_citas_paciente_idTousuarios: { select: { name: true } },
          usuarios_citas_medico_idTousuarios: { select: { name: true } },
        },
      });

      const ultimasClinicas = await this.prisma.clinicas.findMany({
        take: 3,
        orderBy: { created_at: 'desc' },
        select: { id: true, nombre: true, created_at: true },
      });

      const activity = [
        ...ultimosUsuarios.map((u) => ({
          id: u.id,
          tipo: 'usuario_registrado',
          descripcion: `Usuario ${u.name} registrado con rol ${u.rol}`,
          fecha: u.created_at || new Date(),
        })),
        ...ultimasCitas.map((c) => ({
          id: c.id,
          tipo: 'cita_agendada',
          descripcion: `Cita agendada para el paciente ${c.usuarios_citas_paciente_idTousuarios?.name} con el Dr. ${c.usuarios_citas_medico_idTousuarios?.name}`,
          fecha: c.created_at || new Date(),
        })),
        ...ultimasClinicas.map((cl) => ({
          id: cl.id,
          tipo: 'clinica_creada',
          descripcion: `Nueva clínica registrada: ${cl.nombre}`,
          fecha: cl.created_at || new Date(),
        })),
      ]
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
        .slice(0, 7);

      return {
        stats: {
          pacientes: totalPacientes,
          medicos: totalMedicos,
          clinicas: totalClinicas,
          citasHoy,
        },
        penalties: mappedPenalties,
        recentActivity: activity,
      };
    } catch (_error) {
      throw new HttpException(
        { success: false, message: 'Error al procesar el dashboard' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('admin/clinics')
  @UseGuards(JwtAuthGuard, createRolesGuard(['admin']))
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Registrar una nueva clínica y asociar sus especialidades (Solo Admin)',
  })
  @ApiBody({ type: CreateClinicDto })
  @ApiResponse({
    status: 201,
    description: 'Clínica registrada y especialidades mapeadas con éxito.',
  })
  @ApiResponse({ status: 400, description: 'Datos del formulario inválidos.' })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación inválido o ausente.',
  })
  @ApiResponse({
    status: 403,
    description: 'Privilegios insuficientes (Requiere rol admin).',
  })
  async registerClinic(@Body() body: CreateClinicDto) {
    try {
      const clinic = await this.prisma.clinicas.create({
        data: {
          nombre: body.nombre,
          ciudad: body.ciudad,
          direccion: body.direccion,
          telefono: body.telefono,
          email: body.email,
          horario: body.horario,
          descripcion: body.descripcion,
        },
      });

      if (body.especialidades && body.especialidades.length > 0) {
        for (const specName of body.especialidades) {
          const spec = await this.prisma.especialidades.upsert({
            where: { nombre: specName },
            update: {},
            create: { nombre: specName },
          });

          await this.prisma.clinica_especialidades.upsert({
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

      return {
        success: true,
        message: 'Clínica registrada con éxito',
        data: clinic,
      };
    } catch (_error) {
      throw new HttpException(
        { success: false, message: 'Error al registrar la clínica' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('admin/doctors')
  @UseGuards(JwtAuthGuard, createRolesGuard(['admin']))
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Registrar un nuevo médico (hasheando password) y crear detalles_medicos (Solo Admin)',
  })
  @ApiBody({ type: CreateDoctorDto })
  @ApiResponse({ status: 201, description: 'Médico registrado con éxito.' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o el correo ya se encuentra registrado.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación inválido o ausente.',
  })
  @ApiResponse({
    status: 403,
    description: 'Privilegios insuficientes (Requiere rol admin).',
  })
  async registerDoctor(@Body() body: CreateDoctorDto) {
    try {
      // Verificar si el email ya existe
      const existingUser = await this.prisma.usuarios.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        throw new HttpException(
          {
            success: false,
            message: 'El correo electrónico ya está registrado',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // bcryptjs hash
      const bcryptjs = require('bcryptjs');
      const passwordHash = await bcryptjs.hash(body.passwordPlain, 10);

      const user = await this.prisma.usuarios.create({
        data: {
          name: body.name,
          ci: body.ci,
          email: body.email,
          phone: body.phone,
          password: passwordHash,
          rol: 'medico',
        },
      });

      const spec = await this.prisma.especialidades.upsert({
        where: { nombre: body.especialidad },
        update: {},
        create: { nombre: body.especialidad },
      });

      const details = await this.prisma.detalles_medicos.create({
        data: {
          usuario_id: user.id,
          clinica_id: body.clinicaId,
          especialidad_id: spec.id,
          numero_licencia: body.numeroLicencia,
          horario_atencion: body.horarioAtencion,
        },
      });

      return {
        success: true,
        message: 'Médico registrado con éxito',
        data: {
          user: { id: user.id, name: user.name, email: user.email },
          details,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { success: false, message: 'Error interno al registrar al médico' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('clinicas')
  @ApiOperation({
    summary: 'Listar todas las clínicas disponibles con sus especialidades',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de clínicas recuperado con éxito.',
  })
  async getClinicas() {
    try {
      const clinicas = await this.prisma.clinicas.findMany({
        include: {
          clinica_especialidades: {
            include: {
              especialidades: true,
            },
          },
        },
      });

      return clinicas.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        ciudad: c.ciudad,
        direccion: c.direccion,
        telefono: c.telefono,
        email: c.email,
        horario: c.horario,
        descripcion: c.descripcion,
        especialidades: c.clinica_especialidades.map(
          (ce) => ce.especialidades.nombre,
        ),
      }));
    } catch (_error) {
      throw new HttpException(
        { success: false, message: 'Error al obtener la lista de clínicas' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('doctores')
  @ApiOperation({
    summary:
      'Listar todos los médicos del sistema con su especialidad y clínica asignada',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de médicos recuperado con éxito.',
  })
  async getDoctores() {
    try {
      const medicos = await this.prisma.usuarios.findMany({
        where: { rol: 'medico' },
        include: {
          detalles_medicos: {
            include: {
              clinicas: true,
              especialidades: true,
            },
          },
        },
      });

      return medicos.map((m) => ({
        id: m.id,
        name: m.name,
        ci: m.ci,
        email: m.email,
        phone: m.phone,
        clinicaId: m.detalles_medicos?.clinica_id || null,
        clinicaNombre: m.detalles_medicos?.clinicas?.nombre || 'No asignada',
        especialidad:
          m.detalles_medicos?.especialidades?.nombre || 'No asignada',
        numeroLicencia: m.detalles_medicos?.numero_licencia || '',
        horarioAtencion: m.detalles_medicos?.horario_atencion || '',
      }));
    } catch (_error) {
      throw new HttpException(
        { success: false, message: 'Error al obtener la lista de doctores' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('doctor/dashboard-stats')
  @UseGuards(JwtAuthGuard, createRolesGuard(['medico']))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener estadísticas agregadas del médico logueado (Solo Médico)',
  })
  @ApiResponse({ status: 200, description: 'Métricas recuperadas con éxito.' })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación inválido o ausente.',
  })
  @ApiResponse({
    status: 403,
    description: 'Privilegios insuficientes (Requiere rol medico).',
  })
  async getDoctorStats(@GetUserId() doctorId: string) {
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const totalCitas = await this.prisma.citas.findMany({
        where: { medico_id: doctorId },
      });

      const citasHoy = totalCitas.filter(
        (c) =>
          new Date(c.fecha) >= startOfToday && new Date(c.fecha) <= endOfToday,
      ).length;

      const citasCompletadas = totalCitas.filter(
        (c) => c.estado === 'completed',
      ).length;

      const pacientesUnicos = new Set(totalCitas.map((c) => c.paciente_id))
        .size;

      return {
        citasHoy,
        citasCompletadas,
        pacientesUnicos,
      };
    } catch (_error) {
      throw new HttpException(
        { success: false, message: 'Error al obtener estadísticas del doctor' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
