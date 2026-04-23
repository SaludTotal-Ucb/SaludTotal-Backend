import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUserId } from '../../../../../common/decorators/get-user-id.decorator';
import { JwtAuthGuard } from '../../../../auth/infrastructure/http/middlewares/jwt-auth.guard';
import type { AgendarCitaUseCase } from '../../../application/use-cases/AgendarCitaUseCase';
import type { CancelarCitaUseCase } from '../../../application/use-cases/CancelarCitaUseCase';
import { CitaException } from '../../../domain/exceptions/CitaExceptions';
import type { HttpAgendarCitaDto } from '../dtos/cita.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/citas')
export class CitasController {
  constructor(
    private readonly agendarCita: AgendarCitaUseCase,
    private readonly cancelarCita: CancelarCitaUseCase,
  ) {}

  @Post()
  async agendar(
    @GetUserId() patientId: string,
    @Body() body: HttpAgendarCitaDto,
  ) {
    try {
      const cita = await this.agendarCita.execute({
        pacienteId: patientId,
        doctorId: body.doctorId,
        fecha: new Date(body.fecha),
        especialidad: body.especialidad,
        notas: body.notas,
      });
      return { success: true, message: 'Cita agendada', data: cita };
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

  @Patch(':id/cancelar')
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
}
