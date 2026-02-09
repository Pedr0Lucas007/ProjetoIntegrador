import { Router } from "express";
import { registroVendas, listarVendas } from "../controladores/vendasControle.js";

const router = Router();

router.get('/', listarVendas);
router.post('/registrar', registroVendas);
router.post('/add', registroVendas);

export default router;