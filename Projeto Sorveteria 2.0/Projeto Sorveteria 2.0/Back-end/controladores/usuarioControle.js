import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Client } = pkg;

const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "projeto_sorveteria",
  password: "123456",
  port: 5432,
});

client.connect();

// cadastrar usuário
const cadastrar = async (req, res) => {
  const { nome, email, senha, cargo } = req.body;

  // Validação básica
  if (!nome || !email || !senha || !cargo) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const emailNorm = String(email).trim().toLowerCase();
    console.log('[AUTH] Cadastro recebido:', { email: emailNorm });

    // Verifica se email já existe no banco (proteção adicional caso não haja constraint)
    const verifica = await client.query('SELECT id FROM usuario WHERE email = $1', [emailNorm]);
    if (verifica.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    console.log('[AUTH] Senha recebida (primeiros 10 chars):', String(senha).slice(0, 10));
    const hash = await bcrypt.hash(senha, 10);

    const resultado = await client.query(
      `INSERT INTO usuario (nome, email, senha, cargo)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [nome, emailNorm, hash, cargo]
    );

    console.log('[AUTH] Usuário inserido no DB id=', resultado.rows[0].id);
    res.status(201).json({ 
      message: 'Usuário registrado com sucesso',
      id: resultado.rows[0].id
    });
  } catch (error) {
    console.error('Erro ao cadastrar:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
};

// login
const login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const emailNorm = String(email).trim().toLowerCase();
    const resultadoLogin = await client.query(
      `SELECT * FROM usuario WHERE email = $1`,
      [emailNorm]
    );

    if (resultadoLogin.rows.length === 0) {
      console.log('[AUTH] Login falhou - usuário não encontrado:', email);
      return res.status(401).json({ error: 'usuario não encontrado' });
    }

    const usuario = resultadoLogin.rows[0];
    const senhaSalva = usuario.senha || '';
    console.log('[AUTH] Tentativa de login para:', emailNorm, 'senhaSalvaStartsWith$2=', String(senhaSalva).startsWith('$2'));
    let ok = false;

    // Se a senha salva parecer um hash bcrypt, use compare normalmente
    if (senhaSalva.startsWith('$2')) {
      ok = await bcrypt.compare(senha, senhaSalva);
    } else {
      // Senha armazenada em texto simples (resquício de exemplos antigos?)
      // Faz uma comparação direta e migra para hash se corresponder
      if (senha === senhaSalva) {
        ok = true;
        try {
          const novoHash = await bcrypt.hash(senha, 10);
          await client.query('UPDATE usuario SET senha = $1 WHERE id = $2', [novoHash, usuario.id]);
        } catch (e) {
          console.error('Falha ao migrar senha para hash:', e);
        }
      }
    }

    if (!ok) {
      console.log('[AUTH] Login falhou - senha incorreta para:', email);
      return res.status(401).json({ error: 'senha incorreta' });
    }

    const token = jwt.sign(
      { id: usuario.id, cargo: usuario.cargo },
      'SEGREDO',
      { expiresIn: '8h' }
    );

    res.json({ token, nome: usuario.nome, cargo: usuario.cargo });
  } catch (error) {
    res.status(500).json({ error: 'erro no login' });
  }
};

// Lista usuários (somente para ambiente de desenvolvimento)
const listarUsuarios = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const resultado = await client.query("SELECT id, email, LEFT(senha,4) AS pref, LENGTH(senha) AS senha_len FROM usuario ORDER BY id DESC LIMIT 200");
    res.json(resultado.rows);
  } catch (error) {
    console.error('Erro listarUsuarios:', error);
    res.status(500).json({ error: 'erro ao listar usuarios' });
  }
};

// listar funcionarios (admin)
const listarFuncionarios = async (req, res) => {
  try {
    const resultado = await client.query(
      'SELECT id, nome, email, cargo FROM usuario ORDER BY id DESC'
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error('Erro listarFuncionarios:', error);
    res.status(500).json({ error: 'erro ao listar funcionarios' });
  }
};

// atualizar funcionario (admin)
const atualizarFuncionario = async (req, res) => {
  const { id } = req.params;
  const { nome, email, cargo, senha } = req.body;

  if (!id || !nome || !email || !cargo) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const emailNorm = String(email).trim().toLowerCase();
    const duplicado = await client.query(
      'SELECT id FROM usuario WHERE email = $1 AND id <> $2',
      [emailNorm, id]
    );
    if (duplicado.rows.length > 0) {
      return res.status(400).json({ error: 'Email ja cadastrado' });
    }

    if (senha && String(senha).trim().length > 0) {
      const hash = await bcrypt.hash(senha, 10);
      await client.query(
        'UPDATE usuario SET nome = $1, email = $2, cargo = $3, senha = $4 WHERE id = $5',
        [nome, emailNorm, cargo, hash, id]
      );
    } else {
      await client.query(
        'UPDATE usuario SET nome = $1, email = $2, cargo = $3 WHERE id = $4',
        [nome, emailNorm, cargo, id]
      );
    }

    res.json({ message: 'Funcionario atualizado' });
  } catch (error) {
    console.error('Erro atualizarFuncionario:', error);
    res.status(500).json({ error: 'erro ao atualizar funcionario' });
  }
};

// excluir funcionario (admin)
const excluirFuncionario = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user && req.user.id ? String(req.user.id) : null;

  if (!id) {
    return res.status(400).json({ error: 'ID invalido' });
  }

  if (usuarioId && String(id) === usuarioId) {
    return res.status(400).json({ error: 'Nao e permitido excluir o proprio usuario' });
  }

  try {
    const resultado = await client.query('DELETE FROM usuario WHERE id = $1', [id]);
    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Funcionario nao encontrado' });
    }
    res.json({ message: 'Funcionario excluido' });
  } catch (error) {
    console.error('Erro excluirFuncionario:', error);
    res.status(500).json({ error: 'erro ao excluir funcionario' });
  }
};

export default {
  cadastrar,
  login,
  listarUsuarios,
  listarFuncionarios,
  atualizarFuncionario,
  excluirFuncionario
};