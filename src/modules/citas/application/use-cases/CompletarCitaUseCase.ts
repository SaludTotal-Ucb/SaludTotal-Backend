import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../../../prisma/prisma.service';
import { CitaNoEncontradaException } from '../../domain/exceptions/CitaExceptions';

@Injectable()
export class CompletarCitaUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: { citaId: string; medicoId: string }) {
    const { citaId, medicoId } = params;

    const cita = await this.prisma.citas.findFirst({
      where: {
        id: citaId,
        medico_id: medicoId,
      },
    });

    if (!cita) {
      throw new CitaNoEncontradaException();
    }

    const citaActualizada = await this.prisma.citas.update({
      where: { id: citaId },
      data: { estado: 'completed' },
    });

    return citaActualizada;
  }
}
