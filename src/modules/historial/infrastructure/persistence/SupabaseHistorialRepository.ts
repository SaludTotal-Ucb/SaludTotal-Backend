import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  EnfoqueAfeccion,
  HistorialMedico,
} from '../../domain/entities/HistorialMedico';
import type { IHistorialRepository } from '../../domain/repositories/IHistorialRepository';
// plantillas para la bd, tipos de datos que se esperan en la bd
type AfeccionDbRecord = {
  problema: string;
  severidad: string;
  diagnostico: string;
};

type HistorialDbRecord = {
  id: string;
  paciente_id: string;
  tipo_sangre: string;
  alergias: string[];
  tratamientos_en_curso: string[];
  afecciones: unknown;
  genero?: string | null;
  fecha_nacimiento?: string | null;
  direccion?: string | null;
  contacto_emergencia?: string | null;
};

type HistorialDelegate = {
  findUnique(args: {
    where: { paciente_id: string };
  }): Promise<HistorialDbRecord | null>;
  upsert(args: {
    where: { paciente_id: string };
    update: Record<string, unknown>;
    create: Record<string, unknown>;
  }): Promise<HistorialDbRecord>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<HistorialDbRecord>;
};

@Injectable()
export class SupabaseHistorialRepository implements IHistorialRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByPacienteId(pacienteId: string): Promise<HistorialMedico | null> {
    const prisma = this.prisma as unknown as {
      historial_medicos: HistorialDelegate;
    };

    const historial = await prisma.historial_medicos.findUnique({
      where: { paciente_id: pacienteId },
    });

    return historial ? this.toDomain(historial) : null;
  }

  async save(historial: HistorialMedico): Promise<HistorialMedico> {
    const prisma = this.prisma as unknown as {
      historial_medicos: HistorialDelegate;
    };

    const saved = await prisma.historial_medicos.upsert({
      where: { paciente_id: historial.pacienteId },
      update: this.toPersistenceData(historial),
      create: {
        paciente_id: historial.pacienteId,
        ...this.toPersistenceData(historial),
      },
    });

    return this.toDomain(saved);
  }

  async update(historial: HistorialMedico): Promise<HistorialMedico> {
    const prisma = this.prisma as unknown as {
      historial_medicos: HistorialDelegate;
    };

    const updated = await prisma.historial_medicos.update({
      where: { id: historial.id },
      data: this.toPersistenceData(historial),
    });

    return this.toDomain(updated);
  }

  private toPersistenceData(
    historial: HistorialMedico,
  ): Record<string, unknown> {
    return {
      tipo_sangre: historial.tipoSangre,
      alergias: historial.alergias,
      tratamientos_en_curso: historial.tratamientosEnCurso,
      afecciones: historial.afecciones,
      genero: historial.genero ?? null,
      fecha_nacimiento: historial.fechaNacimiento ?? null,
      direccion: historial.direccion ?? null,
      contacto_emergencia: historial.contactoEmergencia ?? null,
    };
  }

  private toDomain(historial: HistorialDbRecord): HistorialMedico {
    return new HistorialMedico(
      historial.id,
      historial.paciente_id,
      historial.tipo_sangre,
      historial.alergias,
      historial.tratamientos_en_curso,
      this.toAfeccionesDomain(historial.afecciones),
      historial.genero ?? undefined,
      historial.fecha_nacimiento ?? undefined,
      historial.direccion ?? undefined,
      historial.contacto_emergencia ?? undefined,
    );
  }

  private toAfeccionesDomain(value: unknown): EnfoqueAfeccion[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) => {
      const record = item as AfeccionDbRecord;
      return new EnfoqueAfeccion(
        record.problema,
        record.severidad,
        record.diagnostico,
      );
    });
  }
}
