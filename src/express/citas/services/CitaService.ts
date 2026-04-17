import { randomUUID } from 'node:crypto';
import { type Cita, CitaEstado } from '../models/Cita';
import { type Penalizacion, TipoPenalizacion } from '../models/Penalizacion';

export class CitaService {
  private readonly citas: Cita[] = [];
  private readonly penalizaciones: Penalizacion[] = [];

  async crearCita(data: Partial<Cita>): Promise<Cita> {
    const ahora = new Date();

    if (!data.paciente_id || !data.medico_id || !data.fecha || !data.hora) {
      throw new Error('Faltan campos requeridos');
    }

    const penalizacionActiva = this.penalizaciones.find((p) => {
      return (
        p.paciente_id === data.paciente_id &&
        p.activa &&
        new Date(p.fecha_fin).getTime() > ahora.getTime()
      );
    });

    if (penalizacionActiva) {
      throw new Error(
        `El paciente tiene una penalización activa hasta ${penalizacionActiva.fecha_fin}`,
      );
    }

    const cupoOcupado = this.citas.find((c) => {
      return (
        c.medico_id === data.medico_id &&
        c.fecha === data.fecha &&
        c.hora === data.hora &&
        (c.estado === CitaEstado.PENDING || c.estado === CitaEstado.CONFIRMED)
      );
    });

    if (cupoOcupado) {
      throw new Error(
        'El horario seleccionado ya esta ocupado para este medico',
      );
    }

    const citaExistente = this.citas.find((c) => {
      return (
        c.paciente_id === data.paciente_id &&
        c.especialidad === data.especialidad &&
        c.fecha === data.fecha &&
        c.estado === CitaEstado.PENDING
      );
    });

    if (citaExistente) {
      throw new Error(
        'El paciente ya tiene una cita para esta especialidad en la misma fecha',
      );
    }

    const now = new Date().toISOString();
    const nuevaCita: Cita = {
      id: randomUUID(),
      paciente_id: data.paciente_id,
      medico_id: data.medico_id,
      clinica_id: data.clinica_id || '',
      especialidad: data.especialidad || '',
      fecha: data.fecha,
      hora: data.hora,
      motivo: data.motivo,
      estado: data.estado || CitaEstado.PENDING,
      notas_doctor: data.notas_doctor,
      created_at: now,
      updated_at: now,
    };

    this.citas.push(nuevaCita);
    return nuevaCita;
  }

  async listarPorPaciente(paciente_id: string): Promise<Cita[]> {
    return this.citas
      .filter((c) => c.paciente_id === paciente_id)
      .sort((a, b) => {
        const aKey = `${a.fecha}T${a.hora}`;
        const bKey = `${b.fecha}T${b.hora}`;
        return bKey.localeCompare(aKey);
      });
  }

  async listarPorMedico(medico_id: string, fecha?: string): Promise<Cita[]> {
    return this.citas
      .filter((c) => {
        if (c.medico_id !== medico_id) return false;
        if (fecha && c.fecha !== fecha) return false;
        return true;
      })
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }

  async editarNotas(id: string, notas_doctor: string): Promise<Cita> {
    const cita = this.citas.find((c) => c.id === id);
    if (!cita) throw new Error('Cita no encontrada');

    cita.notas_doctor = notas_doctor;
    cita.updated_at = new Date().toISOString();
    return cita;
  }

  async actualizarCita(
    id: string,
    dataModificada: Partial<Cita>,
  ): Promise<Cita> {
    const cita = this.citas.find((c) => c.id === id);
    if (!cita) throw new Error('Cita no encontrada');

    const {
      id: _id,
      paciente_id: _pacienteId,
      created_at: _createdAt,
      ...rest
    } = dataModificada as Partial<Cita> & Record<string, unknown>;

    Object.assign(cita, rest);
    cita.updated_at = new Date().toISOString();
    return cita;
  }

  async cambiarEstado(id: string, nuevoEstado: CitaEstado): Promise<Cita> {
    const cita = this.citas.find((c) => c.id === id);
    if (!cita) throw new Error('Cita no encontrada');
    const ahora = new Date();

    if (nuevoEstado === CitaEstado.CANCELLED) {
      const fechaCita = new Date(`${cita.fecha}T${cita.hora}:00`);
      const diffMs = fechaCita.getTime() - ahora.getTime();
      const diffHoras = diffMs / (1000 * 60 * 60);
      const lateCancellation = diffHoras < 3 && diffHoras > 0;

      if (lateCancellation) {
        await this.crearPenalizacion(
          cita.paciente_id,
          TipoPenalizacion.LATE_CANCELLATION,
          30,
        );
      }
    }

    if (nuevoEstado === CitaEstado.ABSENT) {
      cita.estado = CitaEstado.ABSENT;
      cita.updated_at = new Date().toISOString();

      const ultimasCitas = this.citas
        .filter((c) => c.paciente_id === cita.paciente_id)
        .sort((a, b) => {
          const aKey = `${a.fecha}T${a.hora}`;
          const bKey = `${b.fecha}T${b.hora}`;
          return bKey.localeCompare(aKey);
        })
        .slice(0, 3);

      const ausenciasConsecutivas = ultimasCitas.filter(
        (c) => c.estado === CitaEstado.ABSENT,
      ).length;

      if (ausenciasConsecutivas >= 3) {
        await this.crearPenalizacion(
          cita.paciente_id,
          TipoPenalizacion.MULTIPLE_ABSENCES,
          365,
        );
      }
    } else {
      cita.estado = nuevoEstado;
      cita.updated_at = new Date().toISOString();
    }

    return cita;
  }

  private async crearPenalizacion(
    paciente_id: string,
    tipo: TipoPenalizacion,
    dias: number,
  ) {
    const ahora = new Date();
    const fechaFin = new Date();
    fechaFin.setDate(ahora.getDate() + dias);

    const nowIso = ahora.toISOString();
    const penalizacion: Penalizacion = {
      id: randomUUID(),
      paciente_id,
      tipo,
      fecha_inicio: nowIso,
      fecha_fin: fechaFin.toISOString(),
      activa: true,
      created_at: nowIso,
      updated_at: nowIso,
    };

    this.penalizaciones.push(penalizacion);
  }
}
