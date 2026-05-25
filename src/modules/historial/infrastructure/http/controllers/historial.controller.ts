import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diagnostico_severidad } from '@prisma/client';
import { GetUserId } from '../../../../../common/decorators/get-user-id.decorator';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { JwtAuthGuard } from '../../../../auth/infrastructure/http/middlewares/jwt-auth.guard';
import type { CrearHistorialUseCase } from '../../../application/use-cases/CrearHistorialUseCase';
import type { ObtenerHistorialPorPacienteUseCase } from '../../../application/use-cases/ObtenerHistorialPorPacienteUseCase';
import { HistorialException } from '../../../domain/exceptions/HistorialExceptions';
import { HttpCrearHistorialDto } from '../dtos/crear-historial.dto';

@ApiTags('Historial Clínico')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('historial')
export class HistorialController {
  constructor(
    private readonly obtenerHistorial: ObtenerHistorialPorPacienteUseCase,
    private readonly crearHistorial: CrearHistorialUseCase,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  @ApiOperation({
    summary:
      'Obtener el historial médico del Paciente logueado (Solo Paciente)',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial médico recuperado con éxito.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación inválido o ausente.',
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontró historial clínico para el usuario logueado.',
  })
  async getOwnHistorial(@GetUserId() userId: string) {
    try {
      return await this.obtenerHistorial.execute(userId);
    } catch (error: unknown) {
      if (error instanceof HistorialException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }

  @Get('paciente/:pacienteId')
  @ApiOperation({
    summary:
      'Obtener el historial médico unificado de un Paciente por su ID (Médicos/Admin)',
  })
  @ApiParam({ name: 'pacienteId', description: 'ID único del paciente (UUID)' })
  @ApiResponse({
    status: 200,
    description:
      'Historial unificado recuperado correctamente (consultas reales y afecciones estáticas).',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación inválido o ausente.',
  })
  async getHistorialPaciente(@Param('pacienteId') pacienteId: string) {
    try {
      // 1. Obtener expediente clínico del paciente con sus consultas médicas y recetas
      const expediente = await this.prisma.expedientes_clinicos.findUnique({
        where: { paciente_id: pacienteId },
        include: {
          consultas_medicas: {
            include: {
              recetas: true,
              usuarios: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // 2. Obtener historial médico general/estático
      const historialEstatico = await this.prisma.historial_medicos.findUnique({
        where: { paciente_id: pacienteId },
      });

      // 3. Mapear consultas médicas reales
      const consultasReales =
        expediente?.consultas_medicas.map((consulta) => {
          return {
            id: consulta.id,
            diagnostico: consulta.diagnostico,
            descripcion: consulta.descripcion,
            tratamiento: consulta.treatment || consulta.tratamiento || '',
            medico_encargado:
              consulta.usuarios?.name || 'Médico no especificado',
            fecha: consulta.created_at
              ? consulta.created_at.toISOString().split('T')[0]
              : null,
            created_at: consulta.created_at,
            recetas: (consulta.recetas || []).map((r) => ({
              medicamento: r.medicamento,
              dosis: r.dosis,
              frecuencia: r.frecuencia,
              indicaciones: r.indicaciones,
            })),
          };
        }) || [];

      // 4. Mapear afecciones estáticas como consultas ficticias
      const afeccionesEstaticas =
        (historialEstatico?.afecciones as Record<string, unknown>[]) || [];
      const consultasEstaticas = afeccionesEstaticas.map((afeccion, index) => {
        return {
          id: `${historialEstatico?.id || 'static'}-afeccion-${index}`,
          diagnostico:
            afeccion.diagnostico || afeccion.problema || 'Registro Histórico',
          descripcion: `Problema: ${afeccion.problema || 'No especificado'}. Severidad: ${afeccion.severidad || 'No especificada'}.`,
          tratamiento: 'Registrado por el paciente en su historial inicial.',
          medico_encargado: 'Paciente (Autoregistro)',
          fecha: historialEstatico?.created_at
            ? historialEstatico.created_at.toISOString().split('T')[0]
            : null,
          created_at: historialEstatico?.created_at || new Date(),
          recetas: [],
        };
      });

      // 5. Combinar y ordenar por fecha descendente
      const unificado = [...consultasReales, ...consultasEstaticas].sort(
        (a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        },
      );

      return unificado;
    } catch (_error) {
      throw new HttpException(
        'Error al obtener el historial médico unificado.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({
    summary:
      'Crear historial estático (Paciente) o Registrar Consulta Médica (Médico)',
    description:
      'Si se provee "paciente_id" en el cuerpo de la petición, se asume el registro de una consulta médica realizada por un Médico. De lo contrario, se crea el historial médico general del Paciente logueado.',
  })
  @ApiBody({ type: HttpCrearHistorialDto })
  @ApiResponse({
    status: 201,
    description: 'Historial o consulta médica guardados exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos del payload inválidos.' })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación inválido o ausente.',
  })
  async crearHistorialHandler(
    @GetUserId() userId: string,
    @Body() body: Record<string, unknown>,
  ) {
    // Si viene paciente_id en el body, asumimos que es un registro de consulta médica hecho por un médico
    if (body.paciente_id) {
      try {
        const pacienteId = body.paciente_id;

        // 1. Asegurar la existencia del expediente clínico
        let expediente = await this.prisma.expedientes_clinicos.findUnique({
          where: { paciente_id: pacienteId },
        });

        if (!expediente) {
          expediente = await this.prisma.expedientes_clinicos.create({
            data: {
              paciente_id: pacienteId,
              alergias: '',
              antecedentes_familiares: '',
            },
          });
        }

        // 2. Mapear severidad a diagnostico_severidad
        let severidadMapeada: diagnostico_severidad | null = null;
        if (body.severidad) {
          const sev = body.severidad.toUpperCase();
          if (sev === 'BAJA') {
            severidadMapeada = diagnostico_severidad.LEVE;
          } else if (sev === 'MEDIA') {
            severidadMapeada = diagnostico_severidad.MODERADO;
          } else if (sev === 'ALTA' || sev === 'CRITICA') {
            severidadMapeada = diagnostico_severidad.GRAVE;
          } else {
            severidadMapeada = diagnostico_severidad.MODERADO;
          }
        }

        // 3. Crear la consulta médica
        const consulta = await this.prisma.consultas_medicas.create({
          data: {
            expediente_id: expediente.id,
            medico_encargado: userId,
            diagnostico: body.diagnostico,
            descripcion: body.descripcion || body.motivo || '',
            severidad: severidadMapeada,
            tratamiento: body.tratamiento || '',
          },
        });

        return {
          success: true,
          message: 'Consulta guardada correctamente en el expediente.',
          data: consulta,
        };
      } catch (_error) {
        throw new HttpException(
          'Error al guardar la consulta en el expediente clínico.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    // Flujo original para el paciente
    return await this.crearHistorial.execute({
      ...body,
      pacienteId: userId,
    });
  }
}
