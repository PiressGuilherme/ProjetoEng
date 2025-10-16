// script.js - Versão corrigida e limpa
// Funcionalidades:
// - Gerenciamento do modal (abrir/fechar/reset)
// - Mock data (exemplo)
// - Cálculo de próxima consulta e status (Urgente, Vermelho, Amarelo, Verde)
// - Render do Dashboard (quando presente)
// - Render da Lista de Pacientes + filtros e ordenação (quando presente)
// - Submissão do formulário para adicionar paciente (mock)

(() => {
  'use strict';

  // -----------------------
  // Helpers
  // -----------------------
  const slugify = (str = '') => {
    return str
      .toString()
      .toLowerCase()
      .normalize('NFD')                 // separa acentos em caracteres base + diacríticos
      .replace(/[\u0300-\u036f]/g, '')  // remove diacríticos (acentos)
      .replace(/\s+/g, '-')            // espaços -> hífen
      .replace(/[^a-z0-9\-]/g, '')     // remove caracteres indesejados
      .replace(/\-+/g, '-')
      .replace(/^\-+|\-+$/g, '');
  };

  const isElement = (el) => el instanceof Element;

  // Formatador de data que aceita Date ou string YYYY-MM-DD
  const formatarData = (data) => {
    if (!data) return '-';
    const d = (data instanceof Date) ? data : new Date(data);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  // -----------------------
  // Mock Data (exemplo)
  // -----------------------
  let mockPacientes = [
    {
      nome: "Maria Silva Santos",
      cpf: "123.456.789-00",
      dataNascimento: "1965-05-20",
      telefone: "(11) 98765-4321",
      comorbidade: "Diabetes",
      dataConsulta: "2025-05-10",
      dataUltimaConsulta: "2025-04-10",
      observacoes: "Paciente relata bom controle glicêmico em casa."
    },
    {
      nome: "João Oliveira",
      cpf: "987.654.321-00",
      dataNascimento: "1958-09-15",
      telefone: "(21) 99876-5432",
      comorbidade: "Hipertensão",
      dataConsulta: "2025-04-10",
      dataUltimaConsulta: "2025-06-20",
      observacoes: "Necessita de acompanhamento regular da pressão arterial."
    },
    {
      nome: "Ana Costa",
      cpf: "456.789.123-00",
      dataNascimento: "1992-03-30",
      telefone: "(31) 98888-7777",
      comorbidade: "Gestante",
      dataConsulta: "2025-03-10",
      dataUltimaConsulta: "2025-09-25",
      observacoes: "Iniciando o segundo trimestre de gestação."
    },
    {
      nome: "Carlos Pereira",
      cpf: "789.123.456-00",
      dataNascimento: "1970-11-02",
      telefone: "(41) 97777-6666",
      dataConsulta: "2025-02-10",
      comorbidade: "Hipertensão",
      dataUltimaConsulta: "2025-08-30",
      observacoes: ""
    },
    {
      nome: "Lucia Fernandes",
      cpf: "321.654.987-00",
      dataNascimento: "1980-07-12",
      telefone: "(51) 96666-5555",
      dataConsulta: "2025-01-10",
      comorbidade: "Diabetes",
      dataUltimaConsulta: "2025-09-05",
      observacoes: "Apresentou exames de rotina com resultados estáveis."
    }
  ];

  // -----------------------
  // Cálculo de próxima consulta e status
  // -----------------------
  const calcularProximaConsultaEStatus = (paciente) => {
    // Intervalos em meses por comorbidade — se não houver, usa 6 meses
    const intervalos = {
      'Hipertensão': 3,
      'Diabetes': 6,
      'Gestante': 1
    };

    // normaliza comorbidade (pode vir em formatos diferentes)
    const comorbidadeNormalizada = (paciente.comorbidade || '').toString().trim();
    const intervaloMeses = intervalos[comorbidadeNormalizada] ?? 6;

    // Garante que a data da última consulta seja construída corretamente
    const dataUltima = paciente.dataUltimaConsulta
      ? new Date(paciente.dataUltimaConsulta + 'T00:00:00')
      : null;

    // Se não houver data de última consulta, considerar hoje como referência
    const dataBase = dataUltima instanceof Date && !Number.isNaN(dataUltima.getTime())
      ? new Date(dataUltima)
      : new Date();

    const dataProxima = new Date(dataBase);
    dataProxima.setMonth(dataProxima.getMonth() + intervaloMeses);

    // Calcula diferença em dias entre dataProxima e hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diffTime = dataProxima.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Regras de status:
    // diffDays < 0  -> Urgente (já atrasado)
    // 0 <= diffDays <= 15 -> Vermelho (próximo)
    // 16 <= diffDays <= 45 -> Amarelo
    // >45 -> Verde
    let status = '';
    if (diffDays < 0) status = 'Urgente';
    else if (diffDays <= 15) status = 'Vermelho';
    else if (diffDays <= 45) status = 'Amarelo';
    else status = 'Verde';

    return {
      dataProximaConsulta: dataProxima,
      status,
      diasRestantes: diffDays
    };
  };

  // -----------------------
  // Render Dashboard
  // -----------------------
  const renderizarDashboard = () => {
    const totalPatientsEl = document.querySelector('.total-patients .card-value');
    const statusGreenEl = document.querySelector('.status-green .card-value');
    const statusYellowEl = document.querySelector('.status-yellow .card-value');
    const statusRedEl = document.querySelector('.status-red .card-value');

    const urgentListContainer = document.querySelector('.urgent-patients');
    const upcomingListContainer = document.querySelector('.upcoming-appointments');

    if (!totalPatientsEl || !statusGreenEl || !statusYellowEl || !statusRedEl) {
      console.warn('renderizarDashboard: elementos do dashboard não encontrados — pulando render.');
      return;
    }

    let greenCount = 0;
    let yellowCount = 0;
    let redAndUrgentCount = 0;

    const urgentPatientsList = [];
    const upcomingAppointmentsList = [];

    mockPacientes.forEach((paciente) => {
      const statusInfo = calcularProximaConsultaEStatus(paciente);
      const pacienteComStatus = { ...paciente, ...statusInfo };

      switch (statusInfo.status) {
        case 'Urgente':
        case 'Vermelho':
          redAndUrgentCount++;
          urgentPatientsList.push(pacienteComStatus);
          break;
        case 'Amarelo':
          yellowCount++;
          upcomingAppointmentsList.push(pacienteComStatus);
          break;
        case 'Verde':
          greenCount++;
          break;
      }
    });

    totalPatientsEl.textContent = String(mockPacientes.length);
    statusGreenEl.textContent = String(greenCount);
    statusYellowEl.textContent = String(yellowCount);
    statusRedEl.textContent = String(redAndUrgentCount);

    // Remove itens antigos (se houver)
    const clearContainer = (container) => {
      if (!container) return;
      // remove apenas patient-card gerados anteriormente
      const cards = container.querySelectorAll('.patient-card');
      cards.forEach(c => c.remove());
    };

    clearContainer(urgentListContainer);
    clearContainer(upcomingListContainer);

    // Ordena por dias restantes (mais urgente primeiro)
    urgentPatientsList.sort((a, b) => a.diasRestantes - b.diasRestantes);
    upcomingAppointmentsList.sort((a, b) => a.diasRestantes - b.diasRestantes);

    const createUrgentCard = (paciente) => {
      const tagText = paciente.status === 'Urgente'
        ? `Atrasado ${Math.abs(paciente.diasRestantes)} dias`
        : `Em ${paciente.diasRestantes} dias`;

      const comorbSlug = slugify(paciente.comorbidade || '');
      const comorbClass = comorbSlug ? `tag-${comorbSlug}` : '';

      return `
        <div class="patient-card">
          <div class="patient-info">
            <span class="patient-name">${paciente.nome}</span>
            <span class="patient-cpf">CPF: ${paciente.cpf}</span>
          </div>
          <div class="patient-status">
            <span class="status-tag ${paciente.status === 'Urgente' ? 'tag-late' : 'tag-late'}">${tagText}</span>
            <span class="comorbidity-tag ${comorbClass}">${paciente.comorbidade}</span>
          </div>
        </div>
      `;
    };

    const createUpcomingCard = (paciente) => {
      const comorbSlug = slugify(paciente.comorbidade || '');
      const comorbClass = comorbSlug ? `tag-${comorbSlug}` : '';

      return `
        <div class="patient-card">
          <div class="patient-info">
            <span class="patient-name">${paciente.nome}</span>
            <span class="patient-cpf">CPF: ${paciente.cpf}</span>
          </div>
          <div class="patient-status">
            <span class="status-tag tag-soon">Em ${paciente.diasRestantes} dias</span>
            <span class="comorbidity-tag ${comorbClass}">${paciente.comorbidade}</span>
          </div>
        </div>
      `;
    };

    if (urgentListContainer) {
      urgentPatientsList.forEach(p => urgentListContainer.insertAdjacentHTML('beforeend', createUrgentCard(p)));
    }
    if (upcomingListContainer) {
      upcomingAppointmentsList.forEach(p => upcomingListContainer.insertAdjacentHTML('beforeend', createUpcomingCard(p)));
    }
  };

  // -----------------------
  // Render Lista de Pacientes (Página /pacientes.html)
  // -----------------------
  const renderizarListaPacientes = (listaDePacientes) => {
    const patientListContainer = document.querySelector('.patient-list');
    const resultsCountEl = document.querySelector('.results-count');

    if (!patientListContainer) {
      console.warn('renderizarListaPacientes: container não encontrado — pulando render.');
      return;
    }

    // limpa todo o conteúdo (vamos re-inserir cabeçalho + linhas)
    patientListContainer.innerHTML = '';

    // Atualiza contador
    if (resultsCountEl) {
      resultsCountEl.textContent = `${listaDePacientes.length} pacientes encontrados`;
    }

    // Cabeçalho
    const headerHTML = `
      <div class="list-header">
        <span class="col-status">STATUS</span>
        <span class="col-patient">PACIENTE</span>
        <span class="col-comorbidity">COMORBIDADE</span>
        <span class="col-appointment">PRÓXIMA CONSULTA</span>
        <span class="col-actions">AÇÕES</span>
      </div>
    `;
    patientListContainer.insertAdjacentHTML('afterbegin', headerHTML);

    // Render each row
    listaDePacientes.forEach((paciente) => {
      const { status, dataProximaConsulta, diasRestantes } = calcularProximaConsultaEStatus(paciente);

      // Map de classes (se o CSS ainda não tiver status-urgent, faremos fallback para status-red)
      const statusClassMap = {
        'Urgente': 'status-urgent', // recomendamos criar esta classe no CSS
        'Vermelho': 'status-red',
        'Amarelo': 'status-yellow',
        'Verde': 'status-green'
      };
      let statusClass = statusClassMap[status] || 'status-green';

      // Se o CSS alvo não tiver .status-urgent, ele pode não colorir — isso será tratado ao ajustar o CSS.
      const comorbSlug = slugify(paciente.comorbidade || '');
      const comorbClass = comorbSlug ? `tag-${comorbSlug}` : '';

      const labelStatus = status === 'Urgente' ? 'Urgente' : status;

      const rowHTML = `
        <div class="patient-row">
          <span class="col-status"><i class="status-dot ${statusClass}"></i> ${labelStatus}</span>
          <div class="col-patient">
            <span class="patient-name">${paciente.nome}</span>
            <span class="patient-cpf">CPF: ${paciente.cpf}</span>
          </div>
          <span class="col-comorbidity"><span class="comorbidity-tag ${comorbClass}">${paciente.comorbidade}</span></span>
          <span class="col-appointment">${formatarData(dataProximaConsulta)}</span>
          <span class="col-actions"><a href="#" class="action-link">Ver detalhes</a></span>
        </div>
      `;

      patientListContainer.insertAdjacentHTML('beforeend', rowHTML);
    });
  };

  function gerenciarModalDetalhes() {
    const modal = document.getElementById('patient-details-modal');
    const closeBtn = document.getElementById('close-details-btn');
    const editarBtn = document.getElementById('editar-paciente-btn');
    const excluirBtn = document.getElementById('excluir-paciente-btn');
    const salvarBtn = document.getElementById('salvar-edicao-btn');
    const form = modal.querySelector('.patient-details-form');

    let pacienteAtual = null;
    let editMode = false;

    // Abrir modal com dados
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-details')) {
        const id = parseInt(e.target.dataset.id);
        pacienteAtual = mockPacientes.find(p => p.id === id);

        if (pacienteAtual) {
          preencherModalDetalhes(pacienteAtual);
          modal.classList.add('active');
          editMode = false;
          alternarModoEdicao(false);
        }
      }
    });

    // Fechar modal
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    // Alternar modo edição
    editarBtn.addEventListener('click', () => {
      editMode = !editMode;
      alternarModoEdicao(editMode);
    });

    // Excluir paciente com confirmação
    excluirBtn.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja excluir este paciente?')) {
        mockPacientes = mockPacientes.filter(p => p.id !== pacienteAtual.id);
        modal.classList.remove('active');
        renderizarListaPacientes();
        renderizarDashboard();
      }
    });

    // Salvar edições
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

      // Recalcular próxima consulta e status
      const { proximaConsulta, status } = calcularProximaConsultaEStatus(pacienteAtual.dataConsulta, pacienteAtual.comorbidade);
      pacienteAtual.proximaConsulta = proximaConsulta;
      pacienteAtual.status = status;

      renderizarListaPacientes();
      renderizarDashboard();
      modal.classList.remove('active');
    });

    // Alterna entre modo leitura e edição
    function alternarModoEdicao(editar) {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (input.id === 'detalhe-proxima-consulta' || input.id === 'detalhe-status') return;
        input.readOnly = !editar;
        input.disabled = !editar;
      });

      salvarBtn.style.display = editar ? 'inline-flex' : 'none';
      editarBtn.textContent = editar ? 'Cancelar' : 'Editar';
    }

    // Preenche modal com dados do paciente
    function preencherModalDetalhes(p) {
      form.querySelector('#detalhe-nome').value = p.nome;
      form.querySelector('#detalhe-cpf').value = p.cpf;
      form.querySelector('#detalhe-data-nasc').value = p.dataNascimento;
      form.querySelector('#detalhe-telefone').value = p.telefone || '';
      form.querySelector('#detalhe-comorbidade').value = p.comorbidade;
      form.querySelector('#detalhe-data-consulta').value = p.dataConsulta || '';
      form.querySelector('#detalhe-proxima-consulta').value = p.proximaConsulta || '';
      form.querySelector('#detalhe-status').value = p.status || '';
      form.querySelector('#detalhe-observacoes').value = p.observacoes || '';
    }
  }

  // -----------------------
  // Filtragem e Ordenação
  // -----------------------
  const atualizarListaPacientes = () => {
    const searchInput = document.querySelector('.search-bar input');
    const orderSelect = document.querySelector('#order-select');

    // Se não houver controles de filtro, apenas renderiza tudo
    if (!searchInput || !orderSelect) {
      renderizarListaPacientes(mockPacientes);
      return;
    }

    const searchTerm = searchInput.value.trim().toLowerCase();
    const sortBy = orderSelect.value;

    const pacientesFiltrados = mockPacientes.filter((paciente) => {
      const nome = (paciente.nome || '').toLowerCase();
      const cpf = (paciente.cpf || '').toLowerCase();
      const comorb = (paciente.comorbidade || '').toLowerCase();
      return nome.includes(searchTerm) || cpf.includes(searchTerm) || comorb.includes(searchTerm);
    });

    const statusOrder = { 'Urgente': 1, 'Vermelho': 2, 'Amarelo': 3, 'Verde': 4 };

    pacientesFiltrados.sort((a, b) => {
      if (sortBy === 'status') {
        const statusA = calcularProximaConsultaEStatus(a).status;
        const statusB = calcularProximaConsultaEStatus(b).status;
        return (statusOrder[statusA] || 99) - (statusOrder[statusB] || 99);
      } else {
        return (a.nome || '').localeCompare(b.nome || '');
      }
    });

    renderizarListaPacientes(pacientesFiltrados);
  };

  // -----------------------
  // Gerenciamento do Modal e Formulário
  // -----------------------
  const gerenciarModal = () => {
    const modalOverlay = document.getElementById('add-patient-modal');
    const openModalBtnDashboard = document.getElementById('add-patient-btn');
    const openModalBtnPatients = document.getElementById('add-patient-btn-list');
    const closeModalBtn = modalOverlay ? modalOverlay.querySelector('.close-modal-btn') : null;
    const cancelModalBtn = modalOverlay ? modalOverlay.querySelector('.cancel-btn') : null;
    const form = modalOverlay ? modalOverlay.querySelector('.add-patient-form') : null;
    const observacoesTextarea = modalOverlay ? modalOverlay.querySelector('#observacoes') : null;
    const charCounter = modalOverlay ? modalOverlay.querySelector('.char-counter') : null;

    const openModal = (e) => {
      if (e) e.preventDefault();
      if (!modalOverlay) return;
      modalOverlay.classList.add('active');
      // Atualiza contador caso já tenha texto
      if (charCounter && observacoesTextarea) {
        charCounter.textContent = `${observacoesTextarea.value.length}/500 caracteres`;
      }
    };

    const closeModal = (reset = true) => {
      if (!modalOverlay) return;
      modalOverlay.classList.remove('active');
      if (reset && form) form.reset();
      if (charCounter) charCounter.textContent = '0/500 caracteres';
    };

    // Abrir modal - attach apenas se os botões existirem
    if (openModalBtnDashboard) {
      openModalBtnDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    }
    if (openModalBtnPatients) {
      openModalBtnPatients.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    }

    // Fechar modal
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => closeModal(true));
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(true); });

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) closeModal(true);
      });
    }

    // Contador de caracteres
    if (observacoesTextarea && charCounter) {
      observacoesTextarea.addEventListener('input', () => {
        const len = observacoesTextarea.value.length;
        charCounter.textContent = `${len}/500 caracteres`;
      });
    }

    // Submissão do formulário (adiciona paciente ao mock)
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = (form.querySelector('#nome-completo')?.value || '').trim();
        const cpf = (form.querySelector('#cpf')?.value || '').trim();
        const dataNascimento = form.querySelector('#data-nascimento')?.value || '';
        const telefone = form.querySelector('#telefone')?.value || '';
        const dataConsulta = form.querySelector('#data-consulta')?.value || '';
        const comorbidadeRaw = form.querySelector('#comorbidade')?.value || '';
        const observacoes = form.querySelector('#observacoes')?.value || '';

        if (!nome || !cpf) {
          alert('Preencha os campos obrigatórios: Nome e CPF.');
          return;
        }

        // Map de comorbidade - aceita chave do select (hipertensao) ou valor já formatado
        const comorbidadeMap = {
          'hipertensao': 'Hipertensão',
          'diabetes': 'Diabetes',
          'gestante': 'Gestante'
        };

        const comorbidadeKey = slugify(comorbidadeRaw);
        const comorbidade = comorbidadeMap[comorbidadeKey] || (comorbidadeRaw || 'Não informada');

        // Define a data da última consulta como hoje
        const dataUltimaConsulta = dataConsulta || new Date().toISOString().split('T')[0];

        const novoPaciente = {
          nome,
          cpf,
          dataNascimento,
          telefone,
          comorbidade,
          dataUltimaConsulta,
          observacoes
        };

        mockPacientes.push(novoPaciente);

        // Atualiza views se presentes
        if (document.querySelector('.summary-cards')) renderizarDashboard();
        if (document.querySelector('.patients-page')) atualizarListaPacientes();

        closeModal(true);
        alert(`Paciente ${nome} adicionado com sucesso!`);
      });
    }
  };

  // -----------------------
  // Inicialização
  // -----------------------
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 script.js inicializado');
    console.log(`📊 mockPacientes: ${mockPacientes.length}`);

    // Inicializa modal (se houver)
    gerenciarModal();
    gerenciarModalDetalhes();

    // Inicializa dashboard (se estiver na página)
    if (document.querySelector('.summary-cards')) {
      renderizarDashboard();
    }

    // Inicializa lista de pacientes (se estiver na página)
    if (document.querySelector('.patients-page')) {
      const searchInput = document.querySelector('.search-bar input');
      const orderSelect = document.querySelector('#order-select');

      if (searchInput) {
        searchInput.addEventListener('input', () => {
          atualizarListaPacientes();
        });
      }
      if (orderSelect) {
        orderSelect.addEventListener('change', () => {
          atualizarListaPacientes();
        });
      }

      // Render inicial
      atualizarListaPacientes();
      renderizarDashboard()
    }
  });

})();
