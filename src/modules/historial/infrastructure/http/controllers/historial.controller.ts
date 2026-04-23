import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUserId } from '../../../../../common/decorators/get-user-id.decorator';
import { JwtAuthGuard } from '../../../../auth/infrastructure/http/middlewares/jwt-auth.guard';
import type { CrearHistorialUseCase } from '../../../application/use-cases/CrearHistorialUseCase';
import type { ObtenerHistorialPorPacienteUseCase } from '../../../application/use-cases/ObtenerHistorialPorPacienteUseCase';
import { HistorialException } from '../../../domain/exceptions/HistorialExceptions';
import type { HttpCrearHistorialDto } from '../dtos/crear-historial.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/historial')
export class HistorialController {
  constructor(
    private readonly obtenerHistorial: ObtenerHistorialPorPacienteUseCase,
    private readonly crearHistorial: CrearHistorialUseCase,
  ) {}

  @Get('me')
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

  @Post()
  async crearHistorialHandler(
    @GetUserId() patientId: string,
    @Body() body: HttpCrearHistorialDto,
  ) {
    return await this.crearHistorial.execute({
      ...body,
      pacienteId: patientId,
    });
  }
}
