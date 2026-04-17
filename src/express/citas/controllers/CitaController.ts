import type { Request, Response } from 'express';
import type { CitaService } from '../services/CitaService';

export class CitaController {
  constructor(private citaService: CitaService) {}

  async crearCita(req: Request, res: Response): Promise<void> {
    try {
      const nuevaCita = await this.citaService.crearCita(req.body);
      res.status(201).json(nuevaCita);
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ error: err.message });
    }
  }

  async obtenerPorPaciente(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const citas = await this.citaService.listarPorPaciente(id);
      res.status(200).json(citas);
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async obtenerPorMedico(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { fecha } = req.query as { fecha?: string };
      const citas = await this.citaService.listarPorMedico(id, fecha);
      res.status(200).json(citas);
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async cambiarEstado(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { estado } = req.body;
      const citaActualizada = await this.citaService.cambiarEstado(id, estado);
      res.status(200).json(citaActualizada);
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ error: err.message });
    }
  }

  async actualizarDetalles(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const {
        medico_id,
        clinica_id,
        especialidad,
        fecha,
        hora,
        motivo,
        notas_doctor,
      } = req.body;

      const datosActualizados = {
        medico_id,
        clinica_id,
        especialidad,
        fecha,
        hora,
        motivo,
        notas_doctor,
      };

      const dataLimpia = Object.fromEntries(
        Object.entries(datosActualizados).filter(([_, v]) => v !== undefined),
      );

      const citaActualizada = await this.citaService.actualizarCita(
        id,
        dataLimpia,
      );
      res.status(200).json(citaActualizada);
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ error: err.message });
    }
  }

  async editarNotas(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { notas_doctor } = req.body;
      const citaActualizada = await this.citaService.editarNotas(
        id,
        notas_doctor,
      );
      res.status(200).json(citaActualizada);
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ error: err.message });
    }
  }
}
