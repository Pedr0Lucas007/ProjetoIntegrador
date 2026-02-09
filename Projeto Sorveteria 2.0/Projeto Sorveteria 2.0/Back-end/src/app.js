import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// IMPORTAÇÃO DAS ROTAS (PASTAS REAIS DO PROJETO)
import usuarioRota from '../Rotas/usuarioRota.js';
import vendasRota from '../Rotas/vendasRotas.js';
import produtosRota from '../Rotas/produtosRota.js';
import relatorioRota from '../Rotas/relatorioRota.js';

const app = express();
const port = 3000;

// MIDDLEWARES
app.use(cors());
app.use(express.json());

// LOGGER SIMPLES (AJUDA MUITO A DEBUGAR)
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// CONFIGURAÇÃO PARA SERVIR O FRONTEND
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const staticPath = path.join(
  __dirname,
  '../../Interface Gráfica/Telas'
);

app.use(express.static(staticPath));

// ROTAS DA API
app.use('/api/usuario', usuarioRota);
app.use('/api/vendas', vendasRota);
app.use('/api/produtos', produtosRota);
app.use('/api/relatorio', relatorioRota);

// SERVIDOR
app.listen(port, () => {
  console.log(`Servidor tá rodando aqui em: http://localhost:${port}`);
});
