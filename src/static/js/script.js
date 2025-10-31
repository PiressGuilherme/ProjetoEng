// script.js — Versão final, conectada à API Django
(() => {
  "use strict";

  /* -------------------------------------------------------------------------- */
  /* ---------------------- CONFIGURAÇÃO DA API E CSRF ------------------------ */
  /* -------------------------------------------------------------------------- */

  // URL base da nossa API. Como o JS é servido pelo Django, podemos usar caminhos relativos.
  const API_BASE_URL = "/api/pacientes/";

  // Função auxiliar para obter o Cookie CSRF (Necessário para POST, PUT, DELETE)
  // Esta função é padrão da documentação do Django.
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
  const csrftoken = getCookie("csrftoken");

  /* -------------------------------------------------------------------------- */
  /* ------------------------------- UTILITÁRIOS ------------------------------ */
  /* -------------------------------------------------------------------------- */

  const slugify = (str = "") =>
    String(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "")
      .replace(/\-+/g, "-")
      .replace(/^\-+|\-+$/g, "");

  const formatarData = (data) => {
    // A API retorna datas como 'YYYY-MM-DD'
    if (!data) return "-";
    try {
      // Adiciona 'T00:00:00' para garantir que seja interpretado como UTC
      const d = new Date(data + "T00:00:00");
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    } catch (e) {
      console.error("Erro ao formatar data:", data, e);
      return "-";
    }
  };

  /* -------------------------------------------------------------------------- */
  /* --------- LÓGICA DE MOCK REMOVIDA (mockPacientes) ----------------- */
  /* -------------------------------------------------------------------------- */
  // NÃO PRECISAMOS MAIS DE mockPacientes!
  // NÃO PRECISAMOS MAIS DE calcularProximaConsultaEStatus()! O Backend faz isso.

  /* -------------------------------------------------------------------------- */
  /* ----------------------- RENDERIZAÇÃO (Recebe dados) ---------------------- */
  /* -------------------------------------------------------------------------- */

  /**
   * Renderiza os cards do dashboard com base nos dados da API
   * @param {Array} pacientes - A lista de pacientes vinda da API
   */
  const renderizarDashboard = (pacientes = []) => {
    const totalEl = document.querySelector(".total-patients .card-value");
    const greenEl = document.querySelector(".status-green .card-value");
    const yellowEl = document.querySelector(".status-yellow .card-value");
    const redEl = document.querySelector(".status-red .card-value");
    const urgentListContainer = document.querySelector(".urgent-patients");
    const upcomingListContainer = document.querySelector(
      ".upcoming-appointments"
    );

    if (!totalEl) return; // Se não estamos na dashboard, não faz nada

    let verde = 0,
      amarelo = 0,
      vermelho = 0;
    const urgentPatients = [];
    const upcomingPatients = [];

    pacientes.forEach((p) => {
      // O 'status' e 'proxima_consulta' agora vêm DIRETAMENTE da API
      const diasRestantes =
        p.status === "Urgente"
          ? -1 // A API não nos dá dias, mas podemos simular para ordenação
          : p.proxima_consulta
          ? (new Date(p.proxima_consulta + "T00:00:00") - new Date()) /
            (1000 * 60 * 60 * 24)
          : 999;

      const info = { ...p, diasRestantes: Math.ceil(diasRestantes) };

      if (info.status === "Verde") verde++;
      else if (info.status === "Amarelo") {
        amarelo++;
        upcomingPatients.push(info);
      } else {
        // 'Vermelho' ou 'Urgente'
        vermelho++;
        urgentPatients.push(info);
      }
    });

    totalEl.textContent = String(pacientes.length);
    greenEl.textContent = String(verde);
    yellowEl.textContent = String(amarelo);
    redEl.textContent = String(vermelho);

    // Render de listas detalhadas
    const clearAndRenderList = (container, list, createCardHtml) => {
      if (!container) return;
      container.querySelectorAll(".patient-card").forEach((n) => n.remove());
      list.sort((a, b) => a.diasRestantes - b.diasRestantes);
      list.forEach((p) =>
        container.insertAdjacentHTML("beforeend", createCardHtml(p))
      );
    };

    const createUrgentCard = (p) => {
      const tagText =
        p.status === "Urgente" ? `Atrasado` : `Em ${p.diasRestantes} dias`;
      const comorbClass = slugify(p.comorbidade || "")
        ? `tag-${slugify(p.comorbidade)}`
        : "";

      return `
        <div class="patient-card">
          <div class="patient-info">
            <span class="patient-name">${p.nome}</span>
            <span class="patient-cpf">CPF: ${p.cpf}</span>
          </div>
          <div class="patient-status">
            <span class="status-tag ${
              p.status === "Urgente" ? "tag-late" : "tag-late"
            }">${tagText}</span>
            <span class="comorbidity-tag ${comorbClass}">${
        p.comorbidade || ""
      }</span>
            <a href="#" class="action-link small" data-id="${
              p.id
            }">Ver detalhes</a>
          </div>
        </div>
      `;
    };

    // (createUpcomingCard é similar, omitido por brevidade no exemplo, mas a lógica acima cobre)
    // Vamos reusar o createUrgentCard para upcoming, ajustando o texto
    const createUpcomingCard = (p) => {
      const comorbClass = slugify(p.comorbidade || "")
        ? `tag-${slugify(p.comorbidade)}`
        : "";
      return `
        <div class="patient-card">
          <div class="patient-info">
            <span class="patient-name">${p.nome}</span>
            <span class="patient-cpf">CPF: ${p.cpf}</span>
          </div>
          <div class="patient-status">
            <span class="status-tag tag-soon">Em ${p.diasRestantes} dias</span>
            <span class="comorbidity-tag ${comorbClass}">${
        p.comorbidade || ""
      }</span>
            <a href="#" class="action-link small" data-id="${
              p.id
            }">Ver detalhes</a>
          </div>
        </div>
      `;
    };

    clearAndRenderList(urgentListContainer, urgentPatients, createUrgentCard);
    clearAndRenderList(
      upcomingListContainer,
      upcomingPatients,
      createUpcomingCard
    );
  };

  /**
   * Renderiza a lista de pacientes na página 'pacientes.html'
   * @param {Array} lista - A lista de pacientes vinda da API (já filtrada/ordenada)
   */
  const renderizarListaPacientes = (lista = []) => {
    const container = document.querySelector(".patient-list");
    if (!container) return; // Se não estamos na página de pacientes

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

    if (lista.length === 0) {
      container.innerHTML +=
        '<p style="padding: 1rem; text-align: center;">Nenhum paciente encontrado.</p>';
    }

    lista.forEach((p) => {
      // Os dados já vêm prontos da API!
      const { status, proxima_consulta } = p;
      const statusClassMap = {
        Urgente: "status-urgent",
        Vermelho: "status-red",
        Amarelo: "status-yellow",
        Verde: "status-green",
      };
      const statusClass = statusClassMap[status] || "status-green";
      const comorbClass = slugify(p.comorbidade || "")
        ? `tag-${slugify(p.comorbidade)}`
        : "";

      const row = `
        <div class="patient-row" data-id="${p.id}">
          <span class="col-status"><i class="status-dot ${statusClass}"></i> ${status}</span>
          <div class="col-patient">
            <span class="patient-name">${p.nome}</span>
            <span class="patient-cpf">CPF: ${p.cpf}</span>
          </div>
          <span class="col-comorbidity"><span class="comorbidity-tag ${comorbClass}">${
        p.comorbidade || ""
      }</span></span>
          <span class="col-appointment">${formatarData(proxima_consulta)}</span>
          <span class="col-actions"><a href="#" class="action-link" data-id="${
            p.id
          }">Ver detalhes</a></span>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", row);
    });

    const resultsEl = document.querySelector(".results-count");
    if (resultsEl)
      resultsEl.textContent = `${lista.length} pacientes encontrados`;
  };

  /* -------------------------------------------------------------------------- */
  /* ------------------- CARREGAMENTO E FILTRO (FETCH API) -------------------- */
  /* -------------------------------------------------------------------------- */

  // Nosso "banco de dados" local (cache)
  let listaCompletaPacientes = [];

  /**
   * Busca os pacientes da API e armazena em cache
   */
  async function fetchPacientes() {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      listaCompletaPacientes = await response.json();
      console.log("Pacientes carregados da API:", listaCompletaPacientes);
    } catch (error) {
      console.error("Falha ao buscar pacientes da API:", error);
      alert(
        "Não foi possível carregar os dados dos pacientes. Verifique o console."
      );
      listaCompletaPacientes = []; // Reseta em caso de erro
    }
  }

  /**
   * Filtra e ordena a lista local (listaCompletaPacientes) e chama os renderizadores
   */
  const atualizarVisualizacoes = () => {
    const searchInput = document.querySelector(".search-bar input");
    const orderSelect = document.querySelector("#order-select");

    const searchTerm = (searchInput?.value || "").trim().toLowerCase();
    const sortBy = orderSelect?.value || "status";

    // Filtragem (baseada na lista local)
    const filtrados = listaCompletaPacientes.filter((p) => {
      if (!searchTerm) return true;
      const nome = (p.nome || "").toLowerCase();
      const cpf = (p.cpf || "").toLowerCase();
      const comorb = (p.comorbidade || "").toLowerCase();
      return (
        nome.includes(searchTerm) ||
        cpf.includes(searchTerm) ||
        comorb.includes(searchTerm)
      );
    });

    // Ordenação
    if (sortBy === "status") {
      const ordem = { Urgente: 1, Vermelho: 2, Amarelo: 3, Verde: 4 };
      filtrados.sort((a, b) => {
        // Usa o status vindo da API
        return (
          (ordem[a.status] || 99) - (ordem[b.status] || 99) ||
          (a.nome || "").localeCompare(b.nome || "")
        );
      });
    } else if (
      sortBy === "name" ||
      sortBy === "nome" ||
      sortBy === "name-asc"
    ) {
      filtrados.sort((a, b) =>
        (a.nome || "").localeCompare(b.nome || "", "pt-BR", {
          sensitivity: "base",
        })
      );
    }

    // Chama as funções de renderização com os dados filtrados/ordenados
    if (document.querySelector(".patients-page")) {
      renderizarListaPacientes(filtrados);
    }
    if (document.querySelector(".summary-cards")) {
      // O dashboard sempre mostra o status de TODOS os pacientes, não apenas os filtrados
      renderizarDashboard(listaCompletaPacientes);
    }
  };

  /**
   * Função principal que busca dados da API e atualiza a UI
   */
  async function carregarEAtualizarTudo() {
    await fetchPacientes(); // 1. Busca da API
    atualizarVisualizacoes(); // 2. Filtra, ordena e renderiza
  }

  /* -------------------------------------------------------------------------- */
  /* --------------------------- MODAL: ADIÇÃO (POST) ------------------------ */
  /* -------------------------------------------------------------------------- */

  const gerenciarModalAdicao = () => {
    const modal = document.getElementById("add-patient-modal");
    if (!modal) return;
    // ... (Código de abrir/fechar/cancelar/contador) ...
    const openBtns = [
      document.getElementById("add-patient-btn"),
      document.getElementById("add-patient-btn-list"),
    ].filter(Boolean);
    const closeBtn = modal.querySelector(".close-modal-btn");
    const cancelBtn = modal.querySelector(".cancel-btn");
    const form = modal.querySelector(".add-patient-form");
    const textarea = modal.querySelector("#observacoes");
    const counter = modal.querySelector(".char-counter");

    const openModal = (e) => {
      if (e) e.preventDefault();
      modal.classList.add("active");
      if (counter && textarea)
        counter.textContent = `${textarea.value.length}/500 caracteres`;
    };
    const closeModal = () => {
      modal.classList.remove("active");
      form.reset();
      if (counter) counter.textContent = "0/500 caracteres";
    };

    openBtns.forEach((btn) => btn.addEventListener("click", openModal));
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn)
      cancelBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal();
      });
    modal.addEventListener("click", (ev) => {
      if (ev.target === modal) closeModal();
    });
    if (textarea && counter) {
      textarea.addEventListener(
        "input",
        () => (counter.textContent = `${textarea.value.length}/500 caracteres`)
      );
    }
    if (!form) return;

    // Intercepta o SUBMIT para enviar via API (async)
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // 1. Coletar dados do formulário
      // O <select> de comorbidade precisa enviar o *Texto* ('Hipertensão'),
      // não o *valor* ('hipertensao'), pois nosso Model/Serializer espera o texto.
      const comorbSelect = form.querySelector("#comorbidade");
      const comorbidadeTexto =
        comorbSelect.options[comorbSelect.selectedIndex]?.text || "";

      const novoPaciente = {
        nome: (form.querySelector("#nome-completo")?.value || "").trim(),
        cpf: (form.querySelector("#cpf")?.value || "").trim(),
        data_nascimento: form.querySelector("#data-nascimento")?.value || "",
        telefone: form.querySelector("#telefone")?.value || "",
        data_consulta: form.querySelector("#data-consulta")?.value || "", // Esta é a data_consulta (última consulta)
        comorbidade: comorbidadeTexto, // Envia o texto "Hipertensão"
        observacoes: form.querySelector("#observacoes")?.value || "",
      };

      if (
        !novoPaciente.nome ||
        !novoPaciente.cpf ||
        !novoPaciente.data_nascimento ||
        !novoPaciente.data_consulta ||
        !novoPaciente.comorbidade
      ) {
        alert("Preencha todos os campos obrigatórios (*).");
        return;
      }

      // 2. Enviar dados via FETCH (POST)
      try {
        const response = await fetch(API_BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken, // Envia o token de segurança
          },
          body: JSON.stringify(novoPaciente),
        });

        if (!response.ok) {
          const erroData = await response.json();
          // Tenta mostrar um erro mais amigável (ex: CPF duplicado)
          let errorMsg = "Erro ao salvar paciente.";
          if (erroData.cpf) errorMsg = `Erro: ${erroData.cpf.join(" ")}`;
          throw new Error(errorMsg);
        }

        // 3. Sucesso!
        closeModal();
        alert(`Paciente ${novoPaciente.nome} adicionado com sucesso!`);
        await carregarEAtualizarTudo(); // Recarrega a lista da API
      } catch (error) {
        console.error("Erro ao adicionar paciente:", error);
        alert(error.message || "Falha ao salvar paciente.");
      }
    });
  };

  /* -------------------------------------------------------------------------- */
  /* ------------------ MODAL: DETALHES (GET, PUT, DELETE) ------------------- */
  /* -------------------------------------------------------------------------- */

  const gerenciarModalDetalhes = () => {
    const modal = document.getElementById("patient-details-modal");
    if (!modal) return;

    const closeBtn = document.getElementById("close-details-btn");
    const editarBtn = document.getElementById("editar-paciente-btn");
    const excluirBtn = document.getElementById("excluir-paciente-btn");
    const salvarBtn = document.getElementById("salvar-edicao-btn");
    const form = modal.querySelector(".patient-details-form");

    let pacienteAtualId = null; // Armazena o ID do paciente em visualização
    let editMode = false;

    // 1. Abrir modal (GET)
    document.addEventListener("click", async (e) => {
      const target = e.target.closest && e.target.closest(".action-link");
      if (!target) return;
      e.preventDefault();

      const id = parseInt(target.dataset.id, 10);
      if (Number.isNaN(id)) return;

      // Busca os dados ATUAIS do paciente na API
      try {
        const response = await fetch(`${API_BASE_URL}${id}/`);
        if (!response.ok) throw new Error("Paciente não encontrado");
        const paciente = await response.json();

        pacienteAtualId = paciente.id; // Armazena o ID
        preencherModalDetalhes(paciente); // Preenche o form com dados da API
        modal.classList.add("active");
        editMode = false;
        alternarModoEdicao(false);
      } catch (error) {
        console.error("Erro ao buscar detalhes do paciente:", error);
        alert("Não foi possível carregar os dados do paciente.");
      }
    });

    if (closeBtn)
      closeBtn.addEventListener("click", () =>
        modal.classList.remove("active")
      );

    if (editarBtn) {
      editarBtn.addEventListener("click", () => {
        editMode = !editMode;
        alternarModoEdicao(editMode);
      });
    }

    // 2. Excluir paciente (DELETE)
    if (excluirBtn) {
      excluirBtn.addEventListener("click", async () => {
        if (!pacienteAtualId) return;
        if (
          !confirm(
            "Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita."
          )
        )
          return;

        try {
          const response = await fetch(`${API_BASE_URL}${pacienteAtualId}/`, {
            method: "DELETE",
            headers: {
              "X-CSRFToken": csrftoken,
            },
          });

          if (!response.ok && response.status !== 204) {
            // 204 No Content é sucesso
            throw new Error("Erro ao excluir paciente");
          }

          modal.classList.remove("active");
          await carregarEAtualizarTudo(); // Recarrega a lista
        } catch (error) {
          console.error("Erro ao excluir paciente:", error);
          alert("Não foi possível excluir o paciente.");
        }
      });
    }

    // 3. Salvar edição (PUT)
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!pacienteAtualId) return;

        // Mapeia o valor do select (ex: 'hipertensao') para o texto ('Hipertensão')
        const comorbSelect = form.querySelector("#detalhe-comorbidade");
        const comorbidadeTexto =
          comorbSelect.options[comorbSelect.selectedIndex]?.text || "";

        const pacienteEditado = {
          nome: form.querySelector("#detalhe-nome").value,
          cpf: form.querySelector("#detalhe-cpf").value,
          data_nascimento: form.querySelector("#detalhe-data-nasc").value,
          telefone: form.querySelector("#detalhe-telefone").value,
          comorbidade: comorbidadeTexto,
          data_consulta: form.querySelector("#detalhe-data-consulta").value,
          observacoes: form.querySelector("#detalhe-observacoes").value,
        };

        try {
          const response = await fetch(`${API_BASE_URL}${pacienteAtualId}/`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrftoken,
            },
            body: JSON.stringify(pacienteEditado),
          });

          if (!response.ok) {
            const erroData = await response.json();
            let errorMsg = "Erro ao salvar edição.";
            if (erroData.cpf) errorMsg = `Erro: ${erroData.cpf.join(" ")}`;
            throw new Error(errorMsg);
          }

          modal.classList.remove("active");
          await carregarEAtualizarTudo(); // Recarrega a lista
        } catch (error) {
          console.error("Erro ao salvar edição:", error);
          alert(error.message || "Falha ao salvar edição.");
        }
      });
    }

    function alternarModoEdicao(editar) {
      if (!form) return;
      const inputs = form.querySelectorAll("input, textarea, select");
      inputs.forEach((input) => {
        if (["detalhe-proxima-consulta", "detalhe-status"].includes(input.id))
          return; // Campos read-only
        input.readOnly = !editar;
        input.disabled = !editar;
      });
      if (salvarBtn) salvarBtn.style.display = editar ? "inline-flex" : "none";
      if (editarBtn) editarBtn.textContent = editar ? "Cancelar" : "Editar";
    }

    function preencherModalDetalhes(p) {
      if (!form) return;
      form.querySelector("#detalhe-nome").value = p.nome || "";
      form.querySelector("#detalhe-cpf").value = p.cpf || "";
      form.querySelector("#detalhe-data-nasc").value = p.data_nascimento || "";
      form.querySelector("#detalhe-telefone").value = p.telefone || "";

      // Map para select (o valor do select é 'hipertensao', 'diabetes', etc.)
      const mapParaSelect = {
        Hipertensão: "hipertensao",
        Diabetes: "diabetes",
        Gestante: "gestante",
      };
      const detalheSelectValue =
        mapParaSelect[p.comorbidade] || slugify(p.comorbidade || "") || "";
      const detalheSelect = form.querySelector("#detalhe-comorbidade");
      if (detalheSelect) detalheSelect.value = detalheSelectValue;

      form.querySelector("#detalhe-data-consulta").value =
        p.data_consulta || "";

      // Campos calculados vêm prontos da API
      form.querySelector("#detalhe-proxima-consulta").value =
        p.proxima_consulta || "";
      form.querySelector("#detalhe-status").value = p.status || "";

      form.querySelector("#detalhe-observacoes").value = p.observacoes || "";
    }
  };

  /* -------------------------------------------------------------------------- */
  /* ---------------------------- INICIALIZAÇÃO -------------------------------- */
  /* -------------------------------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", () => {
    // Inicialização dos gerenciadores de modal (adição e detalhes)
    gerenciarModalAdicao();
    gerenciarModalDetalhes();

    // Configura listeners de filtro e ordenação
    const searchInput = document.querySelector(".search-bar input");
    const orderSelect = document.querySelector("#order-select");

    // Em vez de recarregar da API a cada tecla, filtramos a lista local
    if (searchInput)
      searchInput.addEventListener("input", atualizarVisualizacoes);
    if (orderSelect)
      orderSelect.addEventListener("change", atualizarVisualizacoes);

    // Carga inicial dos dados!
    carregarEAtualizarTudo();
  });
})();
