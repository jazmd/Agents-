import { Router } from 'express';
import { getActiveSessions, getSessionResult } from '../services/orchestrator.js';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/config', (_req, res) => {
  res.json({
    sectores: [
      'Residencial', 'Comercial', 'Oficinas', 'Industrial', 'Sanitario',
      'Educativo', 'Hotelero', 'Deportivo', 'Cultural', 'Religioso',
      'Mixto', 'Logístico', 'Agroindustrial'
    ],
    categorias: [
      'Estructural y sismorresistente', 'Protección contra incendios',
      'Accesibilidad universal', 'Eficiencia energética',
      'Aislamiento acústico', 'Instalaciones eléctricas de baja tensión',
      'Fontanería y saneamiento', 'Climatización y calidad del aire interior',
      'Sostenibilidad y medio ambiente', 'Seguridad y salud en construcción'
    ]
  });
});

router.get('/sessions', (_req, res) => {
  res.json(getActiveSessions());
});

router.get('/sessions/:id/result', (req, res) => {
  const result = getSessionResult(req.params.id);
  if (!result) return res.status(404).json({ error: 'Session not found' });
  res.json(result);
});
