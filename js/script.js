// script.js — versão unificada, completa e compatível com dashboard.html e pacientes.html
(() => {
  'use strict';

  /* -------------------------------------------------------------------------- */
  /* ------------------------------- UTILITÁRIOS ------------------------------ */
  /* -------------------------------------------------------------------------- */

  const slugify = (str = '') =>
    String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/\-+/g, '-')
      .replace(/^\-+|\-+$/g, '');

  const formatarData = (data) => {
    if (!data) return '-';
    const d = data instanceof Date ? data : new Date(data);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  /* -------------------------------------------------------------------------- */
  /* ------------------------------- MOCK DATA -------------------------------- */
  /* -------------------------------------------------------------------------- */

  // IDs inicializados para evitar colisões
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
      comorbidade: "Hipertensão",
      dataConsulta: "2025-10-12",
      dataUltimaConsulta: "2025-08-30",
      observacoes: ""
    },
    {
      id: 5,
      nome: "Lucia Fernandes",
      cpf: "321.654.987-00",
      dataNascimento: "1980-07-12",
      telefone: "(51) 96666-5555",
      comorbidade: "Diabetes",
      dataConsulta: "2025-10-11",
      dataUltimaConsulta: "2025-09-05",
      observacoes: "Apresentou exames de rotina com resultados estáveis."
    }
  ];

  /* -------------------------------------------------------------------------- */
  /* ------------------------ CÁLCULO DATA PRÓXIMA / STATUS -------------------- */
  /* -------------------------------------------------------------------------- */

  const calcularProximaConsultaEStatus = (paciente) => {
    const intervalos = {
      'Hipertensão': 3,
      'Diabetes': 6,
      'Gestante': 1
    };

    const comorbidade = (paciente.comorbidade || '').toString().trim();
    const intervaloMeses = intervalos[comorbidade] ?? 6;

    // Preferir dataUltimaConsulta; se ausente, usar dataConsulta; se ainda ausente, hoje
    let dataBase = null;
    if (paciente.dataUltimaConsulta) {
      dataBase = new Date(paciente.dataUltimaConsulta + 'T00:00:00');
    } else if (paciente.dataConsulta) {
      dataBase = new Date(paciente.dataConsulta + 'T00:00:00');
    } else {
      dataBase = new Date();
    }

    if (Number.isNaN(dataBase.getTime())) dataBase = new Date();

    const dataProxima = new Date(dataBase);
    dataProxima.setMonth(dataProxima.getMonth() + intervaloMeses);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diffMs = dataProxima.getTime() - hoje.getTime();
    const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let status = '';
    if (diasRestantes < 0) status = 'Urgente';
    else if (diasRestantes <= 15) status = 'Vermelho';
    else if (diasRestantes <= 45) status = 'Amarelo';
    else status = 'Verde';

    return { dataProximaConsulta: dataProxima, status, diasRestantes };
  };

  /* -------------------------------------------------------------------------- */
  /* ------------------------------ RENDER DASHBOARD --------------------------- */
  /* -------------------------------------------------------------------------- */

  const renderizarDashboard = () => {
    const totalEl = document.querySelector('.total-patients .card-value');
    const greenEl = document.querySelector('.status-green .card-value');
    const yellowEl = document.querySelector('.status-yellow .card-value');
    const redEl = document.querySelector('.status-red .card-value');

    // containers para listas detalhadas no dashboard (se existirem)
    const urgentListContainer = document.querySelector('.urgent-patients');
    const upcomingListContainer = document.querySelector('.upcoming-appointments');

    if (!totalEl || !greenEl || !yellowEl || !redEl) return;

    let verde = 0, amarelo = 0, vermelho = 0;

    const urgentPatients = [];
    const upcomingPatients = [];

    mockPacientes.forEach(p => {
      const info = calcularProximaConsultaEStatus(p);
      if (info.status === 'Verde') verde++;
      else if (info.status === 'Amarelo') {
        amarelo++;
        upcomingPatients.push({ ...p, ...info });
      }
      else {
        vermelho++;
        urgentPatients.push({ ...p, ...info });
      }
    });

    totalEl.textContent = String(mockPacientes.length);
    greenEl.textContent = String(verde);
    yellowEl.textContent = String(amarelo);
    redEl.textContent = String(vermelho);

    // Render de listas detalhadas (limpa e popula)
    const clearAndRenderList = (container, list, createCardHtml) => {
      if (!container) return;
      // remove filhos que adicionamos (manter título estático)
      container.querySelectorAll('.patient-card').forEach(n => n.remove());
      // ordenar por dias restantes crescente
      list.sort((a, b) => a.diasRestantes - b.diasRestantes);
      list.forEach(p => container.insertAdjacentHTML('beforeend', createCardHtml(p)));
    };

    const createUrgentCard = (p) => {
      const tagText = p.status === 'Urgente' ? `Atrasado ${Math.abs(p.diasRestantes)} dias` : `Em ${p.diasRestantes} dias`;
      const comorbClass = slugify(p.comorbidade || '') ? `tag-${slugify(p.comorbidade)}` : '';

      return `
        <div class="patient-card">
          <div class="patient-info">
            <span class="patient-name">${p.nome}</span>
            <span class="patient-cpf">CPF: ${p.cpf}</span>
          </div>
          <div class="patient-status">
            <span class="status-tag ${p.status === 'Urgente' ? 'tag-late' : 'tag-soon'}">${tagText}</span>
            <span class="comorbidity-tag ${comorbClass}">${p.comorbidade || ''}</span>
            <a href="#" class="action-link small" data-id="${p.id}">Ver detalhes</a>
          </div>
        </div>
      `;
    };

    const createUpcomingCard = (p) => {
      const comorbClass = slugify(p.comorbidade || '') ? `tag-${slugify(p.comorbidade)}` : '';
      return `
        <div class="patient-card">
          <div class="patient-info">
            <span class="patient-name">${p.nome}</span>
            <span class="patient-cpf">CPF: ${p.cpf}</span>
          </div>
          <div class="patient-status">
            <span class="status-tag tag-soon">Em ${p.diasRestantes} dias</span>
            <span class="comorbidity-tag ${comorbClass}">${p.comorbidade || ''}</span>
            <a href="#" class="action-link small" data-id="${p.id}">Ver detalhes</a>
          </div>
        </div>
      `;
    };

    clearAndRenderList(urgentListContainer, urgentPatients, createUrgentCard);
    clearAndRenderList(upcomingListContainer, upcomingPatients, createUpcomingCard);
  };

  /* -------------------------------------------------------------------------- */
  /* --------------------------- RENDER LISTA PACIENTES ------------------------ */
  /* -------------------------------------------------------------------------- */

  const renderizarListaPacientes = (lista = mockPacientes) => {
    const container = document.querySelector('.patient-list');
    if (!container) return;

    // Header
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
      const { dataProximaConsulta, status } = calcularProximaConsultaEStatus(p);
      const statusClassMap = {
        'Urgente': 'status-urgent',
        'Vermelho': 'status-red',
        'Amarelo': 'status-yellow',
        'Verde': 'status-green'
      };
      const statusClass = statusClassMap[status] || 'status-green';
      const comorbClass = slugify(p.comorbidade || '') ? `tag-${slugify(p.comorbidade)}` : '';

      const row = `
        <div class="patient-row" data-id="${p.id}">
          <span class="col-status"><i class="status-dot ${statusClass}"></i> ${status}</span>
          <div class="col-patient">
            <span class="patient-name">${p.nome}</span>
            <span class="patient-cpf">CPF: ${p.cpf}</span>
          </div>
          <span class="col-comorbidity"><span class="comorbidity-tag ${comorbClass}">${p.comorbidade || ''}</span></span>
          <span class="col-appointment">${formatarData(dataProximaConsulta)}</span>
          <span class="col-actions"><a href="#" class="action-link" data-id="${p.id}">Ver detalhes</a></span>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', row);
    });

    const resultsEl = document.querySelector('.results-count');
    if (resultsEl) resultsEl.textContent = `${lista.length} pacientes encontrados`;
  };

  /* -------------------------------------------------------------------------- */
  /* -------------------------- FILTRO E ORDENAÇÃO ---------------------------- */
  /* -------------------------------------------------------------------------- */

  const atualizarListaPacientes = () => {
    const searchInput = document.querySelector('.search-bar input');
    const orderSelect = document.querySelector('#order-select');

    // Se página não tem controles, renderiza padrão
    if (!document.querySelector('.patients-page')) {
      renderizarListaPacientes(mockPacientes);
      return;
    }

    const searchTerm = (searchInput?.value || '').trim().toLowerCase();
    const sortBy = orderSelect?.value || 'status';

    // Filtragem
    const filtrados = mockPacientes.filter(p => {
      if (!searchTerm) return true;
      const nome = (p.nome || '').toLowerCase();
      const cpf = (p.cpf || '').toLowerCase();
      const comorb = (p.comorbidade || '').toLowerCase();
      return nome.includes(searchTerm) || cpf.includes(searchTerm) || comorb.includes(searchTerm);
    });

    // Ordenação
    if (sortBy === 'status') {
      const ordem = { 'Urgente': 1, 'Vermelho': 2, 'Amarelo': 3, 'Verde': 4 };
      filtrados.sort((a, b) => {
        const sa = calcularProximaConsultaEStatus(a).status;
        const sb = calcularProximaConsultaEStatus(b).status;
        return (ordem[sa] || 99) - (ordem[sb] || 99) || (a.nome || '').localeCompare(b.nome || '');
      });
    } else if (sortBy === 'name' || sortBy === 'nome' || sortBy === 'name-asc') {
      filtrados.sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));
    } else {
      // fallback
      filtrados.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    }

    renderizarListaPacientes(filtrados);
  };

  /* -------------------------------------------------------------------------- */
  /* --------------------------- MODAL: ADIÇÃO PACIENTE ------------------------ */
  /* -------------------------------------------------------------------------- */

  const gerenciarModalAdicao = () => {
    const modal = document.getElementById('add-patient-modal');
    if (!modal) return;

    const openBtns = [document.getElementById('add-patient-btn'), document.getElementById('add-patient-btn-list')].filter(Boolean);
    const closeBtn = modal.querySelector('.close-modal-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const form = modal.querySelector('.add-patient-form');
    const textarea = modal.querySelector('#observacoes');
    const counter = modal.querySelector('.char-counter');

    const openModal = (e) => {
      if (e) e.preventDefault();
      modal.classList.add('active');
      if (counter && textarea) counter.textContent = `${textarea.value.length}/500 caracteres`;
    };
    const closeModal = () => {
      modal.classList.remove('active');
      form.reset();
      if (counter) counter.textContent = '0/500 caracteres';
    };

    openBtns.forEach(btn => btn.addEventListener('click', openModal));
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

    // click no overlay fecha
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) closeModal();
    });

    if (textarea && counter) {
      textarea.addEventListener('input', () => counter.textContent = `${textarea.value.length}/500 caracteres`);
    }

    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nome = (form.querySelector('#nome-completo')?.value || '').trim();
      const cpf = (form.querySelector('#cpf')?.value || '').trim();
      const dataNascimento = form.querySelector('#data-nascimento')?.value || '';
      const telefone = form.querySelector('#telefone')?.value || '';
      const dataConsulta = form.querySelector('#data-consulta')?.value || '';
      const comorbRaw = (form.querySelector('#comorbidade')?.value || '').trim();
      const observacoes = form.querySelector('#observacoes')?.value || '';

      if (!nome || !cpf) {
        alert('Preencha nome e CPF.');
        return;
      }

      // Normaliza comorbidade (select usa valores como 'hipertensao' — mapear para rótulos)
      const comorbidadeMap = { 'hipertensao': 'Hipertensão', 'diabetes': 'Diabetes', 'gestante': 'Gestante' };
      const comorbKey = slugify(comorbRaw);
      const comorbidade = comorbidadeMap[comorbKey] || (comorbRaw || 'Não informada');

      const novoId = mockPacientes.length ? Math.max(...mockPacientes.map(p => p.id)) + 1 : 1;

      const novo = {
        id: novoId,
        nome,
        cpf,
        dataNascimento,
        telefone,
        comorbidade,
        dataConsulta,
        dataUltimaConsulta: dataConsulta || new Date().toISOString().split('T')[0],
        observacoes
      };

      mockPacientes.push(novo);

      // Atualiza views se presentes
      if (document.querySelector('.summary-cards')) renderizarDashboard();
      if (document.querySelector('.patients-page')) atualizarListaPacientes();

      closeModal();
      alert(`Paciente ${nome} adicionado com sucesso!`);
    });
  };

  /* -------------------------------------------------------------------------- */
  /* ------------------------ MODAL: DETALHES / EDIÇÃO ------------------------- */
  /* -------------------------------------------------------------------------- */

  const gerenciarModalDetalhes = () => {
    const modal = document.getElementById('patient-details-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('close-details-btn');
    const editarBtn = document.getElementById('editar-paciente-btn');
    const excluirBtn = document.getElementById('excluir-paciente-btn');
    const salvarBtn = document.getElementById('salvar-edicao-btn');
    const form = modal.querySelector('.patient-details-form');

    let pacienteAtual = null;
    let editMode = false;

    // Abrir modal a partir de qualquer action-link
    document.addEventListener('click', (e) => {
      const target = e.target.closest && e.target.closest('.action-link');
      if (!target) return;
      e.preventDefault();
      const id = parseInt(target.dataset.id, 10);
      if (Number.isNaN(id)) return;
      pacienteAtual = mockPacientes.find(p => p.id === id);
      if (!pacienteAtual) return;

      preencherModalDetalhes(pacienteAtual);
      modal.classList.add('active');
      editMode = false;
      alternarModoEdicao(false);
    });

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    if (editarBtn) {
      editarBtn.addEventListener('click', () => {
        editMode = !editMode;
        alternarModoEdicao(editMode);
      });
    }

    if (excluirBtn) {
      excluirBtn.addEventListener('click', () => {
        if (!pacienteAtual) return;
        if (!confirm('Tem certeza que deseja excluir este paciente?')) return;
        mockPacientes = mockPacientes.filter(p => p.id !== pacienteAtual.id);
        modal.classList.remove('active');
        // atualizar visualizações
        if (document.querySelector('.patients-page')) atualizarListaPacientes();
        if (document.querySelector('.summary-cards')) renderizarDashboard();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!pacienteAtual) return;

        pacienteAtual.nome = form.querySelector('#detalhe-nome').value || pacienteAtual.nome;
        pacienteAtual.cpf = form.querySelector('#detalhe-cpf').value || pacienteAtual.cpf;
        pacienteAtual.dataNascimento = form.querySelector('#detalhe-data-nasc').value || pacienteAtual.dataNascimento;
        pacienteAtual.telefone = form.querySelector('#detalhe-telefone').value || pacienteAtual.telefone;

        // detalhe-comorbidade é um select com valores 'hipertensao' etc. podemos mapear
        const detalheComorbRaw = form.querySelector('#detalhe-comorbidade')?.value || pacienteAtual.comorbidade;
        const comorbidadeMap = { 'hipertensao': 'Hipertensão', 'diabetes': 'Diabetes', 'gestante': 'Gestante' };
        const detalheComorbSlug = slugify(detalheComorbRaw);
        pacienteAtual.comorbidade = comorbidadeMap[detalheComorbSlug] || detalheComorbRaw || pacienteAtual.comorbidade;

        pacienteAtual.dataConsulta = form.querySelector('#detalhe-data-consulta').value || pacienteAtual.dataConsulta;
        // Ao salvar edição podemos atualizar dataUltimaConsulta (opcional) — aqui mantemos a dataConsulta como última
        pacienteAtual.dataUltimaConsulta = pacienteAtual.dataConsulta || pacienteAtual.dataUltimaConsulta;
        pacienteAtual.observacoes = form.querySelector('#detalhe-observacoes').value || pacienteAtual.observacoes;

        // Re-render
        if (document.querySelector('.patients-page')) atualizarListaPacientes();
        if (document.querySelector('.summary-cards')) renderizarDashboard();

        modal.classList.remove('active');
      });
    }

    function alternarModoEdicao(editar) {
      if (!form) return;
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (['detalhe-proxima-consulta', 'detalhe-status'].includes(input.id)) return;
        input.readOnly = !editar;
        input.disabled = !editar;
      });
      if (salvarBtn) salvarBtn.style.display = editar ? 'inline-flex' : 'none';
      if (editarBtn) editarBtn.textContent = editar ? 'Cancelar' : 'Editar';
    }

    function preencherModalDetalhes(p) {
      if (!form) return;
      const info = calcularProximaConsultaEStatus(p);
      form.querySelector('#detalhe-nome').value = p.nome || '';
      form.querySelector('#detalhe-cpf').value = p.cpf || '';
      form.querySelector('#detalhe-data-nasc').value = p.dataNascimento || '';
      form.querySelector('#detalhe-telefone').value = p.telefone || '';
      // Map para select do detalhe (aceita rótulo ou chave)
      const mapParaSelect = { 'Hipertensão': 'hipertensao', 'Diabetes': 'diabetes', 'Gestante': 'gestante' };
      const detalheSelectValue = mapParaSelect[p.comorbidade] || slugify(p.comorbidade || '') || '';
      const detalheSelect = form.querySelector('#detalhe-comorbidade');
      if (detalheSelect) detalheSelect.value = detalheSelectValue;

      form.querySelector('#detalhe-data-consulta').value = p.dataConsulta || '';
      form.querySelector('#detalhe-proxima-consulta').value = info.dataProximaConsulta ? info.dataProximaConsulta.toISOString().split('T')[0] : '';
      form.querySelector('#detalhe-status').value = info.status || '';
      form.querySelector('#detalhe-observacoes').value = p.observacoes || '';
    }
  };

  /* -------------------------------------------------------------------------- */
  /* ---------------------------- INICIALIZAÇÃO -------------------------------- */
  /* -------------------------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', () => {
    // Inicialização dos gerenciadores de modal (adição e detalhes)
    gerenciarModalAdicao();
    gerenciarModalDetalhes();

    // Se estivermos na dashboard, renderiza
    if (document.querySelector('.summary-cards')) renderizarDashboard();

    // Se estivermos na página de pacientes, configura listeners e render inicial
    if (document.querySelector('.patients-page')) {
      const searchInput = document.querySelector('.search-bar input');
      const orderSelect = document.querySelector('#order-select');

      if (searchInput) searchInput.addEventListener('input', atualizarListaPacientes);
      if (orderSelect) orderSelect.addEventListener('change', atualizarListaPacientes);

      // render inicial respeitando filtros padrão
      atualizarListaPacientes();
      // dashboard pode aparecer na mesma página em alguns designs — atualiza também
      if (document.querySelector('.summary-cards')) renderizarDashboard();
    }
  });

  /* -------------------------------------------------------------------------- */
  /* ------------------------------- EXPORTS (dev) ----------------------------- */
  /* -------------------------------------------------------------------------- */
  // Para facilitar testes em console (opcional)
  window.__pacientesApp = {
    mockPacientes,
    atualizarListaPacientes,
    renderizarListaPacientes,
    renderizarDashboard,
    calcularProximaConsultaEStatus
  };
})();
