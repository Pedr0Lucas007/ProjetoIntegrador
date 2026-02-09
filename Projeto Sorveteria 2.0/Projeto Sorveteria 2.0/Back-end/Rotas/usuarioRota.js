import { Router } from "express";
import jwt from 'jsonwebtoken';
import usuario from '../controladores/usuarioControle.js';

const router = Router();

const autenticarAdmin = (req, res, next) => {
	const auth = req.headers.authorization || '';
	const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

	if (!token) {
		return res.status(401).json({ error: 'Token ausente' });
	}

	try {
		const payload = jwt.verify(token, 'SEGREDO');
		req.user = payload;
		const cargo = payload && payload.cargo ? String(payload.cargo).toLowerCase() : '';
		if (!cargo.includes('admin')) {
			return res.status(403).json({ error: 'Acesso negado' });
		}
		next();
	} catch (error) {
		return res.status(401).json({ error: 'Token invalido' });
	}
};

router.post('/cadastrar',  usuario.cadastrar);
router.post('/login', usuario.login);

// Dev-only: listar usuários (id, email, senha prefix/length)
router.get('/listar', usuario.listarUsuarios);

// Funcionarios (admin)
router.get('/funcionarios', autenticarAdmin, usuario.listarFuncionarios);
router.put('/funcionarios/:id', autenticarAdmin, usuario.atualizarFuncionario);
router.delete('/funcionarios/:id', autenticarAdmin, usuario.excluirFuncionario);

export default router;