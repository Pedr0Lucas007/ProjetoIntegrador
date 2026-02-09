import { Router } from 'express';
import { relatorioControle } from '../controladores/relatorioControle.js';

const router = Router();

router.get('/', relatorioControle);
router.get('/vendas', relatorioControle);

export default router;