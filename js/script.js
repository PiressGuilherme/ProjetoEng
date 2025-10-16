// script.js - versão totalmente corrigida e integrada
(() => {
  'use strict';

  // -----------------------
  // Helpers
  // -----------------------
  const slugify = (str = '') => {
    return str
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/\-+/g, '-')
      .replace(/^\-+|\-+$/g, '');
  };

  const formatarData = (data) => {
    if (!data) return '-';
    const d = (data instanceof Date) ? data : new Date(data);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  // -----------------------
  // Mock inicial com IDs válidos
  // -----------------------
  let mockPacientes = [
    {
      id: 1,
      nome: "Maria Silva Santos",
      cpf: "123.456.789-00",
      dataNascimento: "1965-05-20",
      telefone: "(11) 98765-4321",
      comorbidade: "Diabetes",
      dataConsulta: "2025-10-15",
      dataUltimaConsulta: "2025-04-10",
      observacoes: "Paciente relata bom controle glicêmico em casa."
    },
    {
      id: 2,
      nome: "João Oliveira",
      cpf: "987.654.321-00",
      dataNascimento: "1958-09-15",
      telefone: "(21) 99876-5432",
      comorbidade: "Hipertensão",
      dataConsulta: "2025-10-14",
      dataUltimaConsulta: "2025-06-20",
      observacoes: "Necessita de acompanhamento regular da pressão arterial."
    },
    {
      id: 3,
      nome: "Ana Costa",
      cpf: "456.789.123-00",
      dataNascimento: "1992-03-30",
      telefone: "(31) 98888-7777",
      comorbidade: "Gestante",
      dataConsulta: "2025-10-13",
      dataUltimaConsulta: "2025-09-25",
      observacoes: "Iniciando o segundo trimestre de gestação."
    },
    {
      id: 4,
      nome: "Carlos Pereira",
      cpf: "789.123.456-00",
      dataNascimento: "1970-11-02",
      telefone: "(41) 97777-6666",
      dataConsulta: "2025-10-12",
      comorbidade: "Hipertensão",
      dataUltimaConsulta: "2025-08-30",
      observacoes: ""
    },
    {
      id: 5,
      nome: "Lucia Fernandes",
      cpf: "321.654.987-00",
      dataNascimento: "1980-07-12",
      telefone: "(51) 96666-5555",
      dataConsulta: "2025-10-11",
      comorbidade: "Diabetes",
      dataUltimaConsulta: "2025-09-05",
      observacoes: "Apresentou exames de rotina com resultados estáveis."
    }
  ];

  // -----------------------
  // Cálculo de próxima consulta e status
  // -----------------------
  const calcularProximaConsultaEStatus = (paciente) => {
    const intervalos = {
      'Hipertensão': 3,
      'Diabetes': 6,
      'Gestante': 1
    };

    const comorbidade = paciente.comorbidade?.trim() || '';
    const intervaloMeses = intervalos[comorbidade] ?? 6;

    const dataUltima = paciente.dataUltimaConsulta
      ? new Date(paciente.dataUltimaConsulta + 'T00:00:00')
      : new Date();

    const dataProxima = new Date(dataUltima);
    dataProxima.setMonth(dataProxima.getMonth() + intervaloMeses);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((dataProxima - hoje) / (1000 * 60 * 60 * 24));

    let status = '';
    if (diffDays < 0) status = 'Urgente';
    else if (diffDays <= 15) status = 'Vermelho';
    else if (diffDays <= 45) status = 'Amarelo';
    else status = 'Verde';

    return { dataProximaConsulta: dataProxima, status, diasRestantes: diffDays };
  };

  // -----------------------
  // Renderização da Dashboard
  // -----------------------
  const renderizarDashboard = () => {
    const totalEl = document.querySelector('.total-patients .card-value');
    const greenEl = document.querySelector('.status-green .card-value');
    const yellowEl = document.querySelector('.status-yellow .card-value');
    const redEl = document.querySelector('.status-red .card-value');

    if (!totalEl) return;

    let verde = 0, amarelo = 0, vermelho = 0;

    mockPacientes.forEach(p => {
      const info = calcularProximaConsultaEStatus(p);
      if (info.status === 'Verde') verde++;
      else if (info.status === 'Amarelo') amarelo++;
      else vermelho++;
    });

    totalEl.textContent = mockPacientes.length;
    greenEl.textContent = verde;
    yellowEl.textContent = amarelo;
    redEl.textContent = vermelho;
  };

  // -----------------------
  // Render Lista de Pacientes
  // -----------------------
  const renderizarListaPacientes = (lista = mockPacientes) => {
    const container = document.querySelector('.patient-list');
    if (!container) return;
    container.innerHTML = `
      <div class="list-header">
        <span class="col-status">STATUS</span>
        <span class="col-patient">PACIENTE</span>
        <span class="col-comorbidity">COMORBIDADE</span>
        <span class="col-appointment">PRÓXIMA CONSULTA</span>
        <span class="col-actions">AÇÕES</span>
      </div>
    `;

    lista.forEach(p => {
      const info = calcularProximaConsultaEStatus(p);
      const comorbSlug = slugify(p.comorbidade);
      const comorbClass = comorbSlug ? `tag-${comorbSlug}` : '';
      const statusClassMap = {
        'Urgente': 'status-urgent',
        'Vermelho': 'status-red',
        'Amarelo': 'status-yellow',
        'Verde': 'status-green'
      };
      const statusClass = statusClassMap[info.status] || 'status-green';

      const html = `
        <div class="patient-row" data-id="${p.id}">
          <span class="col-status"><i class="status-dot ${statusClass}"></i> ${info.status}</span>
          <div class="col-patient">
            <span class="patient-name">${p.nome}</span>
            <span class="patient-cpf">CPF: ${p.cpf}</span>
          </div>
          <span class="col-comorbidity"><span class="comorbidity-tag ${comorbClass}">${p.comorbidade}</span></span>
          <span class="col-appointment">${formatarData(info.dataProximaConsulta)}</span>
          <span class="col-actions"><a href="#" class="action-link" data-id="${p.id}">Ver detalhes</a></span>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
    });

    const resultsEl = document.querySelector('.results-count');
    if (resultsEl) resultsEl.textContent = `${lista.length} pacientes encontrados`;
  };

  // -----------------------
  // Modal de Detalhes
  // -----------------------
  const gerenciarModalDetalhes = () => {
    const modal = document.getElementById('patient-details-modal');
    if (!modal) return;

    const closeBtn = modal.querySelector('#close-details-btn');
    const editarBtn = modal.querySelector('#editar-paciente-btn');
    const excluirBtn = modal.querySelector('#excluir-paciente-btn');
    const salvarBtn = modal.querySelector('#salvar-edicao-btn');
    const form = modal.querySelector('.patient-details-form');

    let pacienteAtual = null;
    let editMode = false;

    // Abrir modal
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('action-link')) {
        e.preventDefault();
        const id = parseInt(e.target.dataset.id);
        pacienteAtual = mockPacientes.find(p => p.id === id);
        if (!pacienteAtual) return;

        preencherModalDetalhes(pacienteAtual);
        modal.classList.add('active');
        alternarModoEdicao(false);
      }
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    editarBtn.addEventListener('click', () => {
      editMode = !editMode;
      alternarModoEdicao(editMode);
    });

    excluirBtn.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja excluir este paciente?')) {
        mockPacientes = mockPacientes.filter(p => p.id !== pacienteAtual.id);
        modal.classList.remove('active');
        renderizarListaPacientes(mockPacientes);
        renderizarDashboard();
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!pacienteAtual) return;

      pacienteAtual.nome = form.querySelector('#detalhe-nome').value;
      pacienteAtual.cpf = form.querySelector('#detalhe-cpf').value;
      pacienteAtual.dataNascimento = form.querySelector('#detalhe-data-nasc').value;
      pacienteAtual.telefone = form.querySelector('#detalhe-telefone').value;
      pacienteAtual.comorbidade = form.querySelector('#detalhe-comorbidade').value;
      pacienteAtual.dataConsulta = form.querySelector('#detalhe-data-consulta').value;
      pacienteAtual.observacoes = form.querySelector('#detalhe-observacoes').value;

      renderizarListaPacientes(mockPacientes);
      renderizarDashboard();
      modal.classList.remove('active');
    });

    function alternarModoEdicao(editar) {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (['detalhe-proxima-consulta', 'detalhe-status'].includes(input.id)) return;
        input.readOnly = !editar;
        input.disabled = !editar;
      });
      salvarBtn.style.display = editar ? 'inline-flex' : 'none';
      editarBtn.textContent = editar ? 'Cancelar' : 'Editar';
    }

    function preencherModalDetalhes(p) {
      const { dataProximaConsulta, status } = calcularProximaConsultaEStatus(p);
      form.querySelector('#detalhe-nome').value = p.nome || '';
      form.querySelector('#detalhe-cpf').value = p.cpf || '';
      form.querySelector('#detalhe-data-nasc').value = p.dataNascimento || '';
      form.querySelector('#detalhe-telefone').value = p.telefone || '';
      form.querySelector('#detalhe-comorbidade').value = p.comorbidade || '';
      form.querySelector('#detalhe-data-consulta').value = p.dataConsulta || '';
      form.querySelector('#detalhe-proxima-consulta').value = dataProximaConsulta.toISOString().split('T')[0];
      form.querySelector('#detalhe-status').value = status;
      form.querySelector('#detalhe-observacoes').value = p.observacoes || '';
    }
  };

  // -----------------------
  // Modal de Adição de Paciente
  // -----------------------
  const gerenciarModalAdicao = () => {
    const modal = document.getElementById('add-patient-modal');
    if (!modal) return;
    const openBtns = [document.getElementById('add-patient-btn'), document.getElementById('add-patient-btn-list')].filter(Boolean);
    const closeBtn = modal.querySelector('.close-modal-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const form = modal.querySelector('.add-patient-form');
    const textarea = modal.querySelector('#observacoes');
    const counter = modal.querySelector('.char-counter');

    const openModal = () => modal.classList.add('active');
    const closeModal = () => { modal.classList.remove('active'); form.reset(); counter.textContent = '0/500 caracteres'; };

    openBtns.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); }));
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

    if (textarea && counter) {
      textarea.addEventListener('input', () => counter.textContent = `${textarea.value.length}/500 caracteres`);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = form.querySelector('#nome-completo').value.trim();
      const cpf = form.querySelector('#cpf').value.trim();
      const dataNascimento = form.querySelector('#data-nascimento').value;
      const telefone = form.querySelector('#telefone').value;
      const dataConsulta = form.querySelector('#data-consulta').value;
      const comorbidade = form.querySelector('#comorbidade').value;
      const observacoes = form.querySelector('#observacoes').value;

      if (!nome || !cpf) return alert('Preencha nome e CPF.');

      const novo = {
        id: mockPacientes.length ? Math.max(...mockPacientes.map(p => p.id)) + 1 : 1,
        nome, cpf, dataNascimento, telefone,
        comorbidade, dataConsulta, dataUltimaConsulta: dataConsulta, observacoes
      };

      mockPacientes.push(novo);
      renderizarListaPacientes(mockPacientes);
      renderizarDashboard();
      closeModal();
      alert(`Paciente ${nome} adicionado com sucesso!`);
    });
  };

  // -----------------------
  // Inicialização
  // -----------------------
  document.addEventListener('DOMContentLoaded', () => {
    gerenciarModalAdicao();
    gerenciarModalDetalhes();

    if (document.querySelector('.summary-cards')) renderizarDashboard();
    if (document.querySelector('.patients-page')) renderizarListaPacientes(mockPacientes);
  });
})();
