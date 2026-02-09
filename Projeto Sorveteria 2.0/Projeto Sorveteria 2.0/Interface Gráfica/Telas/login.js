document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            
            if (!email || !senha) {
                alert('Preencha e-mail e senha');
                return;
            }
            
            try {
                const response = await fetch('/api/usuario/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        senha: senha
                    })
                });
                
                const text = await response.text();
                let data = null;
                try {
                    data = text ? JSON.parse(text) : null;
                } catch (err) {
                    console.warn('Login: resposta não é JSON', text);
                }

                if (response.ok) {
                    const nomeResp = data && data.nome ? data.nome : '';
                    const cargoResp = data && data.cargo ? data.cargo : '';
                    const nomeFallback = email ? String(email).split('@')[0] : 'Usuario';
                    const usuarioSalvo = {
                        nome: nomeResp || nomeFallback,
                        cargo: cargoResp || 'Sem cargo'
                    };

                    localStorage.setItem('usuario', JSON.stringify(usuarioSalvo));
                    localStorage.setItem('usuario_nome', usuarioSalvo.nome);
                    localStorage.setItem('usuario_cargo', usuarioSalvo.cargo);
                    localStorage.setItem('token', (data && data.token) ? data.token : 'logado');
                    window.location.href = 'vendas.html';
                } else {
                    const msg = (data && data.error) ? data.error : 'E-mail ou senha incorretos';
                    alert(msg);
                }
            } catch (error) {
                console.error('Erro no login:', error);
                alert('Erro de conexão com o servidor. Tente novamente mais tarde.');
            }
        });
    }
});
