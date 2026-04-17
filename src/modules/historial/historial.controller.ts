import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { GetUserId } from '../../common/decorators/get-user-id.decorator';
import type {
  CreateHistorialDto,
  EvolucionDto,
  FiltrosHistorialDto,
} from './dto/historial.dto';
import type { HistorialService } from './historial.service';

@Controller('historial')
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Post()
  create(@Body() dto: CreateHistorialDto, @GetUserId() userId: string) {
    return this.historialService.create(dto, userId);
  }

  @Get()
  findAll(@GetUserId() userId: string) {
    return this.historialService.findAll(userId);
  }

  @Post('filtrar')
  filter(@Body() filtros: FiltrosHistorialDto, @GetUserId() userId: string) {
    return this.historialService.filterHistoriales(filtros, userId);
  }

  @Get('estadisticas/data')
  getStats(@GetUserId() userId: string) {
    return this.historialService.obtenerEstadisticas(userId);
  }

  @Get('paciente/:pacienteId')
  findByPaciente(
    @Param('pacienteId') pacienteId: string,
    @GetUserId() userId: string,
  ) {
    return this.historialService.findByPaciente(pacienteId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUserId() userId: string) {
    return this.historialService.findOne(id, userId);
  }

  @Patch(':id/evolucion')
  addEvolucion(
    @Param('id') id: string,
    @Body() dto: EvolucionDto,
    @GetUserId() userId: string,
  ) {
    return this.historialService.agregarEvolucion(id, dto, userId);
  }
}
