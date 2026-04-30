import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../../../prisma/prisma.service';
import {
  Cita,
  type EstadoCita,
  Penalizacion,
} from '../../domain/entities/Cita';
import type { ICitaRepository } from '../../domain/repositories/ICitaRepository';

type CitaDbRecord = {
  id: string;
  paciente_id: string | null;
  medico_id: string | null;
  fecha: Date;
  especialidad?: string | null;
  motivo?: string | null;
  estado: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'absent' | null;
  notas?: string | null;
  notas_doctor?: string | null;
};

type PenalizacionDbRecord = {
  id: string;
  paciente_id: string;
  motivo: string;
  fecha_fin: Date;
};

type CitasDelegate = {
  findUnique(args: { where: { id: string } }): Promise<CitaDbRecord | null>;
  findMany(args: {
    where: { paciente_id: string };
    orderBy: { fecha: 'desc' | 'asc' };
  }): Promise<CitaDbRecord[]>;
  upsert(args: {
    where: { id: string };
    update: Record<string, unknown>;
    create: Record<string, unknown>;
  }): Promise<CitaDbRecord>;
  findFirst(args: {
    where: Record<string, unknown>;
    select?: Record<string, unknown>;
  }): Promise<CitaDbRecord | null>;
};

type PenalizacionesDelegate = {
  findFirst(args: {
    where: { paciente_id: string; fecha_fin: { gt: Date } };
    orderBy: { fecha_fin: 'desc' | 'asc' };
  }): Promise<PenalizacionDbRecord | null>;
};

@Injectable()
export class SupabaseCitaRepository implements ICitaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Cita | null> {
    const prisma = this.prisma as unknown as {
      citas: CitasDelegate;
      penalizaciones: PenalizacionesDelegate;
    };

    const cita = await prisma.citas.findUnique({
      where: { id },
    });

    return cita ? this.toDomain(cita) : null;
  }

  async findByPacienteId(pacienteId: string): Promise<Cita[]> {
    const prisma = this.prisma as unknown as {
      citas: CitasDelegate;
      penalizaciones: PenalizacionesDelegate;
    };

    const citas = await prisma.citas.findMany({
      where: { paciente_id: pacienteId },
      orderBy: { fecha: 'desc' },
    });

    return citas.map((cita: CitaDbRecord) => this.toDomain(cita));
  }

  async save(cita: Cita): Promise<Cita> {
    const id = cita.id.trim() ? cita.id : randomUUID();
    const prisma = this.prisma as unknown as {
      citas: CitasDelegate;
      penalizaciones: PenalizacionesDelegate;
    };

    const saved = await prisma.citas.upsert({
      where: { id },
      update: {
        paciente_id: cita.pacienteId,
        medico_id: cita.doctorId,
        fecha: cita.fecha,
        especialidad: cita.especialidad,
        estado: this.toPrismaEstado(cita.estado),
        notas: cita.notas ?? null,
      },
      create: {
        id,
        paciente_id: cita.pacienteId,
        medico_id: cita.doctorId,
        fecha: cita.fecha,
        especialidad: cita.especialidad,
        estado: this.toPrismaEstado(cita.estado),
        notas: cita.notas ?? null,
      },
    });

    return this.toDomain(saved);
  }

  async getPenalizacionActiva(
    pacienteId: string,
  ): Promise<Penalizacion | null> {
    const prisma = this.prisma as unknown as {
      citas: CitasDelegate;
      penalizaciones: PenalizacionesDelegate;
    };

    const penalizacion = await prisma.penalizaciones.findFirst({
      where: {
        paciente_id: pacienteId,
        fecha_fin: {
          gt: new Date(),
        },
      },
      orderBy: { fecha_fin: 'desc' },
    });

    return penalizacion ? this.toPenaltyDomain(penalizacion) : null;
  }

  async verificarDisponibilidad(
    doctorId: string,
    fecha: Date,
  ): Promise<boolean> {
    const prisma = this.prisma as unknown as {
      citas: CitasDelegate;
      penalizaciones: PenalizacionesDelegate;
    };

    const cita = await prisma.citas.findFirst({
      where: {
        medico_id: doctorId,
        fecha,
      },
      select: { id: true },
    });

    return !cita;
  }

  private toDomain(cita: CitaDbRecord): Cita {
    return new Cita(
      cita.id,
      cita.paciente_id ?? '',
      cita.medico_id ?? '',
      cita.fecha,
      cita.especialidad ?? cita.motivo ?? '',
      this.toDomainEstado(cita.estado),
      cita.notas ?? cita.notas_doctor ?? undefined,
    );
  }

  private toPenaltyDomain(penalizacion: {
    id: string;
    paciente_id: string;
    motivo: string;
    fecha_fin: Date;
  }): Penalizacion {
    return new Penalizacion(
      penalizacion.id,
      penalizacion.paciente_id,
      penalizacion.motivo,
      penalizacion.fecha_fin,
    );
  }

  private toPrismaEstado(
    estado: EstadoCita,
  ): 'pending' | 'confirmed' | 'cancelled' | 'completed' {
    switch (estado) {
      case 'CONFIRMADA':
        return 'confirmed';
      case 'CANCELADA':
        return 'cancelled';
      case 'COMPLETADA':
        return 'completed';
      default:
        return 'pending';
    }
  }

  private toDomainEstado(
    estado:
      | 'pending'
      | 'confirmed'
      | 'cancelled'
      | 'completed'
      | 'absent'
      | null,
  ): EstadoCita {
    switch (estado) {
      case 'confirmed':
        return 'CONFIRMADA';
      case 'cancelled':
        return 'CANCELADA';
      case 'completed':
        return 'COMPLETADA';
      default:
        return 'PENDIENTE';
    }
  }
}
