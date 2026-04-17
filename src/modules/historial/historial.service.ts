import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateHistorialDto,
  EvolucionDto,
  FiltrosHistorialDto,
} from './dto/historial.dto';
import { HistorialStatus } from './enums/historial.enum';

type HistorialRecord = {
  id: string;
  user_id: string;
  paciente_id: string;
  diagnostico: string;
  descripcion?: string;
  severidad: string;
  medico_encargado: string;
  tratamiento?: string;
  proxima_cita?: string;
  status: string;
  fecha: string;
  created_at: string;
  updated_at: string;
};

type RecetaRecord = {
  id: string;
  historial_id: string;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  indicaciones?: string;
  duracion_dias?: number;
};

type EvolucionRecord = {
  id: string;
  historial_id: string;
  observaciones: string;
  estado_fisico: string;
  created_at: string;
};

@Injectable()
export class HistorialService {
  private readonly historiales: HistorialRecord[] = [];
  private readonly recetas: RecetaRecord[] = [];
  private readonly evoluciones: EvolucionRecord[] = [];

  async create(dto: CreateHistorialDto, userId: string) {
    const now = new Date().toISOString();
    const historialId = randomUUID();

    const { recetas, ...datos } = dto;

    const historial: HistorialRecord = {
      id: historialId,
      user_id: userId,
      ...datos,
      status: HistorialStatus.ACTIVO,
      fecha: now,
      created_at: now,
      updated_at: now,
    };

    this.historiales.push(historial);

    if (recetas?.length) {
      for (const receta of recetas) {
        this.recetas.push({
          id: randomUUID(),
          historial_id: historialId,
          ...receta,
        });
      }
    }

    return this.enrichHistorial(historial);
  }

  async findAll(userId: string) {
    return this.historiales
      .filter((h) => h.user_id === userId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((h) => this.enrichHistorial(h));
  }

  async findByPaciente(pacienteId: string, userId: string) {
    return this.historiales
      .filter((h) => h.user_id === userId && h.paciente_id === pacienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((h) => this.enrichHistorial(h));
  }

  async findOne(id: string, userId: string) {
    const historial = this.historiales.find(
      (h) => h.id === id && h.user_id === userId,
    );
    if (!historial) {
      throw new NotFoundException('Historial no encontrado');
    }
    return this.enrichHistorial(historial);
  }

  async filterHistoriales(filtros: FiltrosHistorialDto, userId: string) {
    let result = this.historiales.filter((h) => h.user_id === userId);

    if (filtros.status) {
      result = result.filter((h) => h.status === filtros.status);
    }
    if (filtros.severidad) {
      result = result.filter((h) => h.severidad === filtros.severidad);
    }
    if (filtros.medico_encargado) {
      result = result.filter(
        (h) => h.medico_encargado === filtros.medico_encargado,
      );
    }

    return result.map((h) =>
      this.enrichHistorial(h, { includeEvoluciones: false }),
    );
  }

  async obtenerEstadisticas(userId: string) {
    const data = this.historiales.filter((h) => h.user_id === userId);

    const porSeveridad: Record<string, number> = {};
    const porStatus: Record<string, number> = {};

    for (const h of data) {
      porSeveridad[h.severidad] = (porSeveridad[h.severidad] || 0) + 1;
      porStatus[h.status] = (porStatus[h.status] || 0) + 1;
    }

    return {
      total: data.length,
      porSeveridad,
      porStatus,
    };
  }

  async agregarEvolucion(
    historialId: string,
    dto: EvolucionDto,
    userId: string,
  ) {
    await this.findOne(historialId, userId);
    const now = new Date().toISOString();

    const record: EvolucionRecord = {
      id: randomUUID(),
      historial_id: historialId,
      observaciones: dto.observaciones,
      estado_fisico: dto.estado_fisico,
      created_at: now,
    };

    this.evoluciones.push(record);
    return [record];
  }

  private enrichHistorial(
    historial: HistorialRecord,
    opts: { includeEvoluciones?: boolean } = { includeEvoluciones: true },
  ) {
    const recetas = this.recetas.filter((r) => r.historial_id === historial.id);
    const evoluciones = opts.includeEvoluciones
      ? this.evoluciones.filter((e) => e.historial_id === historial.id)
      : undefined;

    return {
      ...historial,
      recetas,
      evoluciones: evoluciones ?? [],
    };
  }
}
