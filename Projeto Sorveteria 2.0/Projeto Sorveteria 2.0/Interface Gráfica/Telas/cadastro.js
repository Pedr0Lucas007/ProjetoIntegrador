const form = document.getElementById('cadastroForm');

if (!form) {
  console.error('Formulário não encontrado!');
} else {
  console.log('Formulário encontrado com sucesso');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault(); // Evita o reload da página

  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const cargo = document.getElementById('cargo').value;

  console.log('Dados do formulário:', { nome, email, senha, cargo });

  if (!nome || !email || !senha || !cargo) {
    alert('Preencha todos os campos!');
    return;
  }

  try {
    const masked = (s) => (String(s).length <= 4 ? '****' : String(s).slice(0,3) + '...');
    console.log('Enviando requisição para o servidor...', { email, senha_len: String(senha).length, senha_preview: masked(senha) });
    
    const res = await fetch('/api/usuario/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha, cargo })
    });

    console.log('Status da resposta:', res.status);
    
    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      console.warn('Resposta não é JSON:', text);
    }

    if (res.ok) {
      alert('Cadastro realizado com sucesso!');
      window.location.href = 'login.html';
    } else {
      const msg = (data && data.error) ? data.error : (text || 'Não foi possível cadastrar');
      alert('Erro: ' + msg);
    }
  } catch (err) {
    console.error('Erro completo:', err);
    alert('Erro de conexão com o servidor: ' + err.message);
  }
});
