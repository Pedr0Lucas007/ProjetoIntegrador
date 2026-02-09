let funcionarios = [];
let carregandoFuncionarios = false;
let erroFuncionarios = '';
const origin = window.location && window.location.origin ? window.location.origin : '';
const apiBase = origin.includes('localhost:3000') ? origin : 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function() {
    if (window.location && window.location.protocol === 'file:') {
        erroFuncionarios = 'Abra esta pagina pelo servidor: http://localhost:3000/funcionarios.html';
        exibirFuncionarios();
        return;
    }

    if (!usuarioEhAdmin()) {
        alert('Acesso permitido apenas para administradores.');
        window.location.href = 'vendas.html';
        return;
    }

    const form = document.getElementById('formFuncionario');
    if (form) {
        form.addEventListener('submit', salvarAlteracoes);
    }

    const busca = document.getElementById('busca-funcionarios');
    if (busca) {
        busca.addEventListener('input', filtrarFuncionarios);
    }

    carregarFuncionarios();
});

function usuarioEhAdmin() {
    let usuario = null;
    try {
        usuario = JSON.parse(localStorage.getItem('usuario'));
    } catch (e) {
        usuario = null;
    }
    const cargo = (usuario && usuario.cargo) ? usuario.cargo : (localStorage.getItem('usuario_cargo') || '');
    return String(cargo).toLowerCase().includes('admin');
}

function obterToken() {
    return localStorage.getItem('token') || '';
}

function headersAuth() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${obterToken()}`
    };
}

async function fetchComTimeout(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function carregarFuncionarios() {
    carregandoFuncionarios = true;
    erroFuncionarios = '';
    exibirFuncionarios();
    try {
        const response = await fetchComTimeout(`${apiBase}/api/usuario/funcionarios`, {
            headers: headersAuth()
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            const msg = data && data.error ? data.error : 'Erro ao carregar funcionarios';
            throw new Error(msg);
        }
        funcionarios = data || [];
        carregandoFuncionarios = false;
        exibirFuncionarios();
    } catch (error) {
        console.error(error);
        funcionarios = [];
        if (error.name === 'AbortError') {
            erroFuncionarios = 'Tempo limite ao carregar funcionarios';
        } else if (String(error.message || '').includes('Failed to fetch')) {
            erroFuncionarios = 'Falha ao conectar ao servidor';
        } else {
            erroFuncionarios = error.message || 'Erro ao carregar funcionarios';
        }
        carregandoFuncionarios = false;
        exibirFuncionarios();
    }
}

function exibirFuncionarios() {
    const tbody = document.getElementById('tbody-funcionarios');
    if (!tbody) return;

    if (carregandoFuncionarios) {
        tbody.innerHTML = '<tr class="vazio"><td colspan="4">Carregando...</td></tr>';
        return;
    }

    if (erroFuncionarios) {
        tbody.innerHTML = `<tr class="vazio"><td colspan="4">${erroFuncionarios}</td></tr>`;
        return;
    }

    if (!funcionarios || funcionarios.length === 0) {
        tbody.innerHTML = '<tr class="vazio"><td colspan="4">Nenhum funcionario encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = funcionarios.map((func) => {
        return `
        <tr>
            <td><strong>${func.nome}</strong></td>
            <td>${func.email}</td>
            <td>${func.cargo}</td>
            <td>
                <button class="btn-visualizar" onclick="selecionarFuncionario(${func.id})">Editar</button>
                <button class="btn-remover" onclick="excluirFuncionario(${func.id})">Excluir</button>
            </td>
        </tr>`;
    }).join('');
}

function selecionarFuncionario(id) {
    const func = funcionarios.find(f => f.id === id);
    if (!func) return;

    document.getElementById('funcionario-id').value = func.id;
    document.getElementById('funcionario-nome').value = func.nome;
    document.getElementById('funcionario-email').value = func.email;
    document.getElementById('funcionario-cargo').value = func.cargo;
    document.getElementById('funcionario-senha').value = '';
}

async function salvarAlteracoes(e) {
    e.preventDefault();

    const id = document.getElementById('funcionario-id').value;
    const nome = document.getElementById('funcionario-nome').value.trim();
    const email = document.getElementById('funcionario-email').value.trim();
    const cargo = document.getElementById('funcionario-cargo').value.trim();
    const senha = document.getElementById('funcionario-senha').value;

    if (!id) {
        alert('Selecione um funcionario para editar.');
        return;
    }

    if (!nome || !email || !cargo) {
        alert('Preencha nome, email e cargo.');
        return;
    }

    const payload = { nome, email, cargo };
    if (senha && senha.trim().length > 0) {
        payload.senha = senha;
    }

    try {
        const response = await fetchComTimeout(`${apiBase}/api/usuario/funcionarios/${id}`, {
            method: 'PUT',
            headers: headersAuth(),
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data && data.error ? data.error : 'Erro ao atualizar');
        }
        alert('Funcionario atualizado.');
        limparFormulario();
        carregarFuncionarios();
    } catch (error) {
        alert(error.message);
    }
}

async function excluirFuncionario(id) {
    const confirmar = confirm('Deseja excluir este funcionario?');
    if (!confirmar) return;

    try {
        const response = await fetchComTimeout(`${apiBase}/api/usuario/funcionarios/${id}`, {
            method: 'DELETE',
            headers: headersAuth()
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data && data.error ? data.error : 'Erro ao excluir');
        }
        alert('Funcionario excluido.');
        carregarFuncionarios();
    } catch (error) {
        alert(error.message);
    }
}

function limparFormulario() {
    document.getElementById('funcionario-id').value = '';
    document.getElementById('funcionario-nome').value = '';
    document.getElementById('funcionario-email').value = '';
    document.getElementById('funcionario-cargo').value = '';
    document.getElementById('funcionario-senha').value = '';
}

function filtrarFuncionarios() {
    const termo = document.getElementById('busca-funcionarios').value.toLowerCase();
    const tbody = document.getElementById('tbody-funcionarios');
    const linhas = tbody.querySelectorAll('tr:not(.vazio)');

    linhas.forEach((linha) => {
        const nome = linha.cells[0].textContent.toLowerCase();
        const email = linha.cells[1].textContent.toLowerCase();
        const cargo = linha.cells[2].textContent.toLowerCase();
        linha.style.display = (nome.includes(termo) || email.includes(termo) || cargo.includes(termo)) ? '' : 'none';
    });
}
