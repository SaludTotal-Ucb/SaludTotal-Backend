import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUserId } from '../../../../../common/decorators/get-user-id.decorator';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { JwtAuthGuard } from '../../../../auth/infrastructure/http/middlewares/jwt-auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI reflection
import { AgendarCitaUseCase } from '../../../application/use-cases/AgendarCitaUseCase';
// biome-ignore lint/style/useImportType: NestJS DI reflection
import { CancelarCitaUseCase } from '../../../application/use-cases/CancelarCitaUseCase';
// biome-ignore lint/style/useImportType: NestJS DI reflection
import { CompletarCitaUseCase } from '../../../application/use-cases/CompletarCitaUseCase';
// biome-ignore lint/style/useImportType: NestJS DI reflection
import { ConfirmarCitaUseCase } from '../../../application/use-cases/ConfirmarCitaUseCase';
// biome-ignore lint/style/useImportType: NestJS DI reflection
import { ObtenerCitasMedicoUseCase } from '../../../application/use-cases/ObtenerCitasMedicoUseCase';
// biome-ignore lint/style/useImportType: NestJS DI reflection
import { ObtenerCitasPacienteUseCase } from '../../../application/use-cases/ObtenerCitasPacienteUseCase';
import { CitaException } from '../../../domain/exceptions/CitaExceptions';
// biome-ignore lint/style/useImportType: NestJS DI reflection
import { HttpAgendarCitaDto } from '../dtos/cita.dto';

@ApiTags('Citas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('citas')
export class CitasController {
  constructor(
    private readonly agendarCita: AgendarCitaUseCase,
    private readonly cancelarCita: CancelarCitaUseCase,
    private readonly confirmarCita: ConfirmarCitaUseCase,
    private readonly completarCita: CompletarCitaUseCase,
    private readonly obtenerCitasPaciente: ObtenerCitasPacienteUseCase,
    private readonly obtenerCitasMedico: ObtenerCitasMedicoUseCase,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Agendar una nueva cita médica (Paciente)' })
  @ApiResponse({ status: 201, description: 'Cita agendada correctamente.' })
  @ApiResponse({
    status: 400,
    description:
      'Petición inválida o error en las reglas de negocio (ej. choque de horario).',
  })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado.' })
  async agendar(
    @GetUserId() patientId: string,
    @Body() body: HttpAgendarCitaDto,
  ) {
    try {
      let resolvedDoctorId = body.doctorId;

      // Si el doctorId recibido no es un UUID válido (ej. "Dr. Carlos Mendoza"), lo resolvemos en la BD
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          resolvedDoctorId,
        )
      ) {
        const docNameClean = resolvedDoctorId
          .replace(/^(dr\.|dra\.)\s*/i, '')
          .trim();
        const doctor = await this.prisma.usuarios.findFirst({
          where: {
            rol: 'medico',
            name: {
              contains: docNameClean,
              mode: 'insensitive',
            },
          },
        });

        if (doctor) {
          resolvedDoctorId = doctor.id;
        } else {
          // Fallback al primer médico de la BD
          const firstDoctor = await this.prisma.usuarios.findFirst({
            where: { rol: 'medico' },
          });
          if (firstDoctor) {
            resolvedDoctorId = firstDoctor.id;
          } else {
            throw new HttpException(
              {
                success: false,
                message: 'No hay médicos disponibles registrados',
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }

      const cita = await this.agendarCita.execute({
        pacienteId: patientId,
        doctorId: resolvedDoctorId,
        fecha: new Date(body.fecha),
        especialidad: body.especialidad,
        notas: body.notas,
      });
      return { success: true, message: 'Cita agendada', data: cita };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof CitaException) {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        { success: false, message: 'Error interno del servidor' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar una cita médica agendada (Paciente)' })
  @ApiParam({
    name: 'id',
    description: 'ID único de la cita médica a cancelar (UUID)',
  })
  @ApiResponse({ status: 200, description: 'Cita cancelada con éxito.' })
  @ApiResponse({
    status: 400,
    description:
      'Fallo al cancelar la cita (ej. ya completada, o no pertenece al paciente).',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación inválido o ausente.',
  })
  async cancelar(@Param('id') citaId: string, @GetUserId() patientId: string) {
    try {
      const cita = await this.cancelarCita.execute({
        citaId,
        pacienteId: patientId,
      });
      return { success: true, message: 'Cita cancelada', data: cita };
    } catch (error: unknown) {
      if (error instanceof CitaException) {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        { success: false, message: 'Error interno del servidor' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/confirmar')
  @ApiOperation({ summary: 'Confirmar una cita médica pendiente (Médico)' })
  @ApiParam({
    name: 'id',
    description: 'ID único de la cita médica a confirmar (UUID)',
  })
  @ApiResponse({ status: 200, description: 'Cita confirmada con éxito.' })
  @ApiResponse({
    status: 400,
    description:
      'Fallo al confirmar la cita (ej. ya confirmada, o no pertenece al médico).',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación inválido o ausente.',
  })
  async confirmar(@Param('id') citaId: string, @GetUserId() medicoId: string) {
    try {
      const cita = await this.confirmarCita.execute({
        citaId,
        medicoId,
      });
      return { success: true, message: 'Cita confirmada', data: cita };
    } catch (error: unknown) {
      if (error instanceof CitaException) {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        { success: false, message: 'Error interno del servidor' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/completar')
  @ApiOperation({
    summary: 'Completar una cita médica al finalizar consulta (Médico)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la cita médica a completar (UUID)',
  })
  @ApiResponse({ status: 200, description: 'Cita completada con éxito.' })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación inválido o ausente.',
  })
  async completar(@Param('id') citaId: string, @GetUserId() medicoId: string) {
    try {
      const cita = await this.completarCita.execute({
        citaId,
        medicoId,
      });
      return {
        success: true,
        message: 'Cita completada exitosamente',
        data: cita,
      };
    } catch (error: unknown) {
      if (error instanceof CitaException) {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        { success: false, message: 'Error interno del servidor' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('paciente/:id')
  @ApiOperation({
    summary: 'Obtener todas las citas agendadas por un Paciente específico',
  })
  @ApiParam({ name: 'id', description: 'ID del paciente (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Listado de citas del paciente recuperado con éxito.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación inválido o ausente.',
  })
  async obtenerPorPaciente(@Param('id') pacienteId: string) {
    try {
      const citas = await this.obtenerCitasPaciente.execute(pacienteId);

      // Resolver nombres de médicos
      const doctorIds = citas.map((c) => c.doctorId).filter(Boolean);
      const doctors = await this.prisma.usuarios.findMany({
        where: { id: { in: doctorIds } },
        select: { id: true, name: true },
      });
      const doctorMap = new Map(doctors.map((d) => [d.id, d.name]));

      return citas.map((c) => {
        const boliviaTime = new Date(c.fecha.getTime() - 4 * 60 * 60 * 1000);
        const [datePart, timePart] = boliviaTime.toISOString().split('T');
        return {
          id: c.id,
          paciente_id: c.pacienteId,
          medico_id: doctorMap.get(c.doctorId) || 'Médico no especificado',
          clinica_id: 'Hospital Central',
          especialidad: c.especialidad,
          fecha: datePart,
          hora: timePart.substring(0, 5),
          estado: c.estado.toLowerCase(),
        };
      });
    } catch (_error: unknown) {
      throw new HttpException(
        { success: false, message: 'Error al obtener las citas del paciente' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medico/:id')
  @ApiOperation({
    summary: 'Obtener todas las citas agendadas de un Médico específico',
  })
  @ApiParam({ name: 'id', description: 'ID o nombre del médico' })
  @ApiQuery({
    name: 'fecha',
    required: false,
    description: 'Filtrar por fecha específica (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de citas del médico recuperado con éxito.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación inválido o ausente.',
  })
  async obtenerPorMedico(
    @Param('id') medicoId: string,
    @Query('fecha') fechaQuery?: string,
  ) {
    try {
      let resolvedMedicoId = medicoId;

      // Si el medicoId recibido no es un UUID válido (ej. "Dr. Carlos Mendoza"), lo resolvemos en la BD
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          resolvedMedicoId,
        )
      ) {
        const docNameClean = resolvedMedicoId
          .replace(/^(dr\.|dra\.)\s*/i, '')
          .trim();
        const doctor = await this.prisma.usuarios.findFirst({
          where: {
            rol: 'medico',
            name: {
              contains: docNameClean,
              mode: 'insensitive',
            },
          },
        });
        if (doctor) {
          resolvedMedicoId = doctor.id;
        } else {
          return [];
        }
      }

      const citas = await this.obtenerCitasMedico.execute(resolvedMedicoId);

      // Filtrar por fecha si se provee
      const filtered = fechaQuery
        ? citas.filter((c) => {
            const dateObj = new Date(c.fecha);
            const [datePart] = dateObj.toISOString().split('T');
            return datePart === fechaQuery;
          })
        : citas;

      // Resolver nombres de médicos
      const doctorIds = filtered.map((c) => c.doctorId).filter(Boolean);
      const doctors = await this.prisma.usuarios.findMany({
        where: { id: { in: doctorIds } },
        select: { id: true, name: true },
      });
      const doctorMap = new Map(doctors.map((d) => [d.id, d.name]));

      // Resolver nombres de pacientes
      const pacienteIds = filtered.map((c) => c.pacienteId).filter(Boolean);
      const pacientes = await this.prisma.usuarios.findMany({
        where: { id: { in: pacienteIds } },
        select: { id: true, name: true, ci: true },
      });
      const pacienteMap = new Map(
        pacientes.map((p) => [p.id, { name: p.name, ci: p.ci }]),
      );

      return filtered.map((c) => {
        const boliviaTime = new Date(c.fecha.getTime() - 4 * 60 * 60 * 1000);
        const [datePart, timePart] = boliviaTime.toISOString().split('T');
        const pInfo = pacienteMap.get(c.pacienteId);
        return {
          id: c.id,
          paciente_id: c.pacienteId,
          paciente_nombre: pInfo?.name || 'Paciente no especificado',
          paciente_ci: pInfo?.ci || 'No registrado',
          medico_id: doctorMap.get(c.doctorId) || 'Médico no especificado',
          clinica_id: 'Hospital Central',
          especialidad: c.especialidad,
          fecha: datePart,
          hora: timePart.substring(0, 5),
          estado: c.estado.toLowerCase(),
        };
      });
    } catch (_error: unknown) {
      throw new HttpException(
        { success: false, message: 'Error al obtener las citas del médico' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
