import { Router } from 'express';
import { CitaController } from '../controllers/CitaController';
import { CitaService } from '../services/CitaService';

export const createCitaRouter = () => {
  const router = Router();
  const citaService = new CitaService();
  const citaController = new CitaController(citaService);

  router.post('/', (req, res) => citaController.crearCita(req, res));
  router.get('/paciente/:id', (req, res) =>
    citaController.obtenerPorPaciente(req, res),
  );
  router.get('/medico/:id', (req, res) =>
    citaController.obtenerPorMedico(req, res),
  );
  router.patch('/:id/estado', (req, res) =>
    citaController.cambiarEstado(req, res),
  );
  router.patch('/:id/notas', (req, res) =>
    citaController.editarNotas(req, res),
  );
  router.put('/:id', (req, res) => citaController.actualizarDetalles(req, res));

  return router;
};
