// script.js — Versão com Endereço e Link do Mapa
(() => {
  "use strict";

  /* -------------------------------------------------------------------------- */
  /* ---------------------- CONFIGURAÇÃO DA API E CSRF ------------------------ */
  /* -------------------------------------------------------------------------- */

  const API_BASE_URL = "/api/pacientes/";
  const API_LOGIN_URL = "/api/login/";
  const API_LOGOUT_URL = "/api/logout/";

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
  /* ------------------------ AUTENTICAÇÃO (LOGIN/LOGOUT) --------------------- */
  /* -------------------------------------------------------------------------- */

  const gerenciarLogin = () => {
    const loginForm = document.querySelector(".login-form");
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const button = loginForm.querySelector("button[type='submit']");
      const originalText = button.innerText;
      button.disabled = true;
      button.innerText = "Entrando...";

      const username = loginForm.querySelector("#username").value;
      const password = loginForm.querySelector("#password").value;

      try {
        const response = await fetch(API_LOGIN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
          },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          window.location.href = "/dashboard/";
        } else {
          const data = await response.json();
          showToast(data.detail || "Usuário ou senha inválidos.", "error");
          button.disabled = false;
          button.innerText = originalText;
        }
      } catch (error) {
        console.error("Erro no login:", error);
        showToast("Erro de conexão com o servidor.", "error");
        button.disabled = false;
        button.innerText = originalText;
      }
    });
  };

  const gerenciarLogout = () => {
    const logoutBtns = document.querySelectorAll(".btn-logout");
    logoutBtns.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await fetch(API_LOGOUT_URL, {
            method: "POST",
            headers: { "X-CSRFToken": csrftoken },
          });
          window.location.href = "/login/";
        } catch (error) {
          console.error("Erro no logout:", error);
          window.location.href = "/login/";
        }
      });
    });
  };

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

  const showToast = (message, type = "success") => {
    const colors = {
      success: "#34c759",
      error: "#e53935",
      warning: "#ffcc00",
    };
    if (typeof Toastify === "undefined") {
      console.warn("Toastify não carregado. Fallback para alert.");
      alert(message);
      return;
    }
    Toastify({
      text: message,
      duration: 4000,
      close: true,
      gravity: "top",
      position: "right",
      backgroundColor: colors[type] || "#004aad",
      stopOnFocus: true,
      style: {
        borderRadius: "8px",
        fontFamily: "'Poppins', sans-serif",
        boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
      },
    }).showToast();
  };

  const formatarData = (data) => {
    if (!data) return "-";
    try {
      const d = new Date(data + "T00:00:00");
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    } catch (e) {
      return "-";
    }
  };

  /* -------------------------------------------------------------------------- */
  /* ----------------------- RENDERIZAÇÃO (DASHBOARD/LISTA) ------------------- */
  /* -------------------------------------------------------------------------- */

  const renderizarDashboard = (pacientes = []) => {
    const totalEl = document.querySelector(".total-patients .card-value");
    if (!totalEl) return;

    const greenEl = document.querySelector(".status-green .card-value");
    const yellowEl = document.querySelector(".status-yellow .card-value");
    const redEl = document.querySelector(".status-red .card-value");
    const urgentListContainer = document.querySelector(".urgent-patients");
    const upcomingListContainer = document.querySelector(
      ".upcoming-appointments"
    );

    let verde = 0,
      amarelo = 0,
      vermelho = 0;
    const urgentPatients = [];
    const upcomingPatients = [];
    const total = pacientes.length;

    pacientes.forEach((p) => {
      const diasRestantes =
        p.status === "Urgente"
          ? -1
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
        vermelho++;
        urgentPatients.push(info);
      }
    });

    totalEl.textContent = String(total);
    greenEl.textContent = String(verde);
    yellowEl.textContent = String(amarelo);
    redEl.textContent = String(vermelho);

    const percVerde = total > 0 ? (verde / total) * 100 : 0;
    const percAmarelo = total > 0 ? (amarelo / total) * 100 : 0;
    const percVermelho = total > 0 ? (vermelho / total) * 100 : 0;

    const greenBar = document.querySelector(".status-green .progress-bar");
    const yellowBar = document.querySelector(".status-yellow .progress-bar");
    const redBar = document.querySelector(".status-red .progress-bar");

    if (greenBar) greenBar.style.width = `${percVerde}%`;
    if (yellowBar) yellowBar.style.width = `${percAmarelo}%`;
    if (redBar) redBar.style.width = `${percVermelho}%`;

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
      const comorbClass = slugify(p.comorbidade)
        ? `tag-${slugify(p.comorbidade)}`
        : "";
      return `
        <div class="patient-card">
          <div class="patient-info">
            <span class="patient-name">${p.nome}</span>
            <span class="patient-cpf">CPF: ${p.cpf}</span>
          </div>
          <div class="patient-status">
            <span class="status-tag tag-late">${tagText}</span>
            <span class="comorbidity-tag ${comorbClass}">${p.comorbidade}</span>
            <a href="#" class="action-link small" data-id="${p.id}">Ver detalhes</a>
          </div>
        </div>`;
    };

    const createUpcomingCard = (p) => {
      const comorbClass = slugify(p.comorbidade)
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
            <span class="comorbidity-tag ${comorbClass}">${p.comorbidade}</span>
            <a href="#" class="action-link small" data-id="${p.id}">Ver detalhes</a>
          </div>
        </div>`;
    };

    clearAndRenderList(urgentListContainer, urgentPatients, createUrgentCard);
    clearAndRenderList(
      upcomingListContainer,
      upcomingPatients,
      createUpcomingCard
    );
  };

  const renderizarListaPacientes = (lista = []) => {
    const container = document.querySelector(".patient-list");
    if (!container) return;

    container.innerHTML = `
      <div class="list-header">
        <span class="col-status">STATUS</span>
        <span class="col-patient">PACIENTE</span>
        <span class="col-comorbidity">COMORBIDADE</span>
        <span class="col-appointment">PRÓXIMA CONSULTA</span>
        <span class="col-actions">AÇÕES</span>
      </div>`;

    if (lista.length === 0) {
      container.innerHTML +=
        '<p style="padding: 1rem; text-align: center;">Nenhum paciente encontrado.</p>';
    }

    lista.forEach((p) => {
      const statusClassMap = {
        Urgente: "status-urgent",
        Vermelho: "status-red",
        Amarelo: "status-yellow",
        Verde: "status-green",
      };
      const statusClass = statusClassMap[p.status] || "status-green";
      const comorbClass = slugify(p.comorbidade)
        ? `tag-${slugify(p.comorbidade)}`
        : "";

      container.insertAdjacentHTML(
        "beforeend",
        `
        <div class="patient-row" data-id="${p.id}">
          <span class="col-status"><i class="status-dot ${statusClass}"></i> ${
          p.status
        }</span>
          <div class="col-patient">
            <span class="patient-name">${p.nome}</span>
            <span class="patient-cpf">CPF: ${p.cpf}</span>
          </div>
          <span class="col-comorbidity"><span class="comorbidity-tag ${comorbClass}">${
          p.comorbidade
        }</span></span>
          <span class="col-appointment">${formatarData(
            p.proxima_consulta
          )}</span>
          <span class="col-actions"><a href="#" class="action-link" data-id="${
            p.id
          }">Ver detalhes</a></span>
        </div>`
      );
    });

    const resultsEl = document.querySelector(".results-count");
    if (resultsEl)
      resultsEl.textContent = `${lista.length} pacientes encontrados`;
  };

  /* -------------------------------------------------------------------------- */
  /* ------------------- CARREGAMENTO E FILTRO (FETCH API) -------------------- */
  /* -------------------------------------------------------------------------- */

  let listaCompletaPacientes = [];

  async function fetchPacientes() {
    try {
      const response = await fetch(API_BASE_URL);
      if (response.status === 403 || response.status === 401) {
        window.location.href = "/login/";
        return;
      }
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      listaCompletaPacientes = await response.json();
    } catch (error) {
      console.error("Falha ao buscar pacientes:", error);
    }
  }

  const atualizarVisualizacoes = () => {
    const searchInput = document.querySelector(".search-bar input");
    const orderSelect = document.querySelector("#order-select");
    const searchTerm = (searchInput?.value || "").trim().toLowerCase();
    const sortBy = orderSelect?.value || "status";

    const filtrados = listaCompletaPacientes.filter((p) => {
      if (!searchTerm) return true;
      // Busca agora inclui o endereço
      return (
        p.nome.toLowerCase().includes(searchTerm) ||
        p.cpf.includes(searchTerm) ||
        p.comorbidade.toLowerCase().includes(searchTerm) ||
        (p.endereco && p.endereco.toLowerCase().includes(searchTerm))
      );
    });

    if (sortBy === "status") {
      const ordem = { Urgente: 1, Vermelho: 2, Amarelo: 3, Verde: 4 };
      filtrados.sort(
        (a, b) =>
          (ordem[a.status] || 99) - (ordem[b.status] || 99) ||
          a.nome.localeCompare(b.nome)
      );
    } else {
      filtrados.sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
      );
    }

    if (document.querySelector(".patients-page"))
      renderizarListaPacientes(filtrados);
    if (document.querySelector(".summary-cards"))
      renderizarDashboard(listaCompletaPacientes);
  };

  async function carregarEAtualizarTudo() {
    if (
      document.querySelector(".dashboard-page") ||
      document.querySelector(".patients-page")
    ) {
      await fetchPacientes();
      atualizarVisualizacoes();
    }
  }

  /* -------------------------------------------------------------------------- */
  /* --------------------------- MODAIS (ADICIONAR/DETALHES) ------------------ */
  /* -------------------------------------------------------------------------- */

  const gerenciarModais = () => {
    // --- MODAL ADIÇÃO ---
    const addModal = document.getElementById("add-patient-modal");
    if (addModal) {
      const form = addModal.querySelector("form");

      let cpfAddMask, telAddMask;

      if (typeof IMask !== "undefined") {
        const cpfInput = form.querySelector("#cpf");
        const telInput = form.querySelector("#telefone");

        if (cpfInput) {
          // Armazenamos a instância da máscara
          cpfAddMask = IMask(cpfInput, { mask: "000.000.000-00" });
        }
        if (telInput) {
          // --- ALTERAÇÃO: MÁSCARA DE TELEFONE 10 OU 11 DÍGITOS ---
          telAddMask = IMask(telInput, {
            mask: [
              { mask: "(00) 0000-0000" }, // Fixo
              { mask: "(00) 00000-0000" }, // Celular
            ],
          });
        }
      } else {
        console.warn("Biblioteca IMask.js não carregada.");
      }

      const closeBtns = addModal.querySelectorAll(
        ".close-modal-btn, .cancel-btn"
      );
      const openBtns = document.querySelectorAll(
        "#add-patient-btn, #add-patient-btn-list"
      );

      openBtns.forEach((btn) =>
        btn.addEventListener("click", () => addModal.classList.add("active"))
      );
      closeBtns.forEach((btn) =>
        btn.addEventListener("click", () => {
          addModal.classList.remove("active");
          form.reset();
          if (cpfAddMask) cpfAddMask.value = "";
          if (telAddMask) telAddMask.value = "";
        })
      );

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const comorbSelect = form.querySelector("#comorbidade");

        const cpfValue = cpfAddMask
          ? cpfAddMask.unmaskedValue
          : form.querySelector("#cpf").value;
        const telValue = telAddMask
          ? telAddMask.unmaskedValue
          : form.querySelector("#telefone").value;

        const novoPaciente = {
          nome: form.querySelector("#nome-completo").value.trim(),
          cpf: cpfValue, // Envia o valor sem máscara
          data_nascimento: form.querySelector("#data-nascimento").value,
          telefone: telValue, // Envia o valor sem máscara
          endereco: form.querySelector("#endereco").value.trim(), // --- NOVO CAMPO ADICIONADO ---
          data_consulta: form.querySelector("#data-consulta").value,
          comorbidade:
            comorbSelect.options[comorbSelect.selectedIndex]?.text || "",
          observacoes: form.querySelector("#observacoes").value,
        };

        if (
          !novoPaciente.nome ||
          !novoPaciente.cpf ||
          !novoPaciente.data_nascimento ||
          !novoPaciente.data_consulta ||
          !novoPaciente.comorbidade ||
          !novoPaciente.endereco // --- VALIDAÇÃO DE ENDEREÇO OBRIGATÓRIO ---
        ) {
          showToast(
            "Por favor, preencha todos os campos obrigatórios.",
            "warning"
          );
          return;
        }

        if (cpfValue.length !== 11) {
          showToast("CPF inválido. Deve conter 11 dígitos.", "warning");
          return;
        }

        // --- VALIDAÇÃO DE TELEFONE (10 ou 11 dígitos, se preenchido) ---
        if (
          telValue.length > 0 &&
          (telValue.length < 10 || telValue.length > 11)
        ) {
          showToast(
            "Telefone inválido. Deve conter 10 ou 11 dígitos.",
            "warning"
          );
          return;
        }
        // --- FIM DA VALIDAÇÃO ---

        try {
          const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrftoken,
            },
            body: JSON.stringify(novoPaciente),
          });
          if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.cpf
              ? "Este CPF já está cadastrado."
              : errorData.detail || "Erro ao salvar.";
            throw new Error(errorMsg);
          }

          addModal.classList.remove("active");
          form.reset();
          if (cpfAddMask) cpfAddMask.value = "";
          if (telAddMask) telAddMask.value = "";
          showToast(`Paciente ${novoPaciente.nome} adicionado!`, "success");
          carregarEAtualizarTudo();
        } catch (error) {
          showToast(error.message || "Falha ao salvar paciente.", "error");
        }
      });
    }

    // --- MODAL DETALHES ---
    const detailsModal = document.getElementById("patient-details-modal");
    if (detailsModal) {
      const form = detailsModal.querySelector("form");

      let cpfDetalheMask, telDetalheMask;
      if (typeof IMask !== "undefined") {
        const cpfInput = form.querySelector("#detalhe-cpf");
        const telInput = form.querySelector("#detalhe-telefone");

        if (cpfInput) {
          cpfDetalheMask = IMask(cpfInput, { mask: "000.000.000-00" });
        }
        if (telInput) {
          // --- ALTERAÇÃO: MÁSCARA DE TELEFONE 10 OU 11 DÍGITOS ---
          telDetalheMask = IMask(telInput, {
            mask: [
              { mask: "(00) 0000-0000" }, // Fixo
              { mask: "(00) 00000-0000" }, // Celular
            ],
          });
        }
      } else {
        console.warn("Biblioteca IMask.js não carregada.");
      }

      const closeBtn = detailsModal.querySelector("#close-details-btn");
      const editBtn = detailsModal.querySelector("#editar-paciente-btn");
      const deleteBtn = detailsModal.querySelector("#excluir-paciente-btn");
      const saveBtn = detailsModal.querySelector("#salvar-edicao-btn");
      const linkMapaBtn = detailsModal.querySelector("#link-mapa"); // --- BOTÃO DO MAPA ---
      let currentId = null;

      document.addEventListener("click", async (e) => {
        const link = e.target.closest(".action-link");
        if (!link) return;
        e.preventDefault();
        currentId = link.dataset.id;

        try {
          const res = await fetch(`${API_BASE_URL}${currentId}/`);
          if (!res.ok) throw new Error("Erro ao buscar detalhes.");
          const p = await res.json();

          // Preenche os campos
          form.querySelector("#detalhe-nome").value = p.nome;
          form.querySelector("#detalhe-data-nasc").value = p.data_nascimento;
          form.querySelector("#detalhe-data-consulta").value = p.data_consulta;
          form.querySelector("#detalhe-proxima-consulta").value =
            p.proxima_consulta;
          form.querySelector("#detalhe-status").value = p.status;
          form.querySelector("#detalhe-observacoes").value =
            p.observacoes || "";
          form.querySelector("#detalhe-endereco").value = p.endereco || ""; // --- NOVO CAMPO ---

          if (cpfDetalheMask) cpfDetalheMask.value = p.cpf;
          if (telDetalheMask) telDetalheMask.value = p.telefone || "";

          const mapComorb = {
            Hipertensão: "hipertensao",
            Diabetes: "diabetes",
            Gestante: "gestante",
          };
          form.querySelector("#detalhe-comorbidade").value =
            mapComorb[p.comorbidade] || "";

          // --- LÓGICA DO BOTÃO DO MAPA ---
          if (p.endereco && linkMapaBtn) {
            const query = encodeURIComponent(p.endereco);
            linkMapaBtn.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
            linkMapaBtn.style.display = "inline-flex"; // Mostra o botão
          } else if (linkMapaBtn) {
            linkMapaBtn.style.display = "none"; // Esconde se não há endereço
          }
          // --- FIM DA LÓGICA DO MAPA ---

          setEditMode(false);
          detailsModal.classList.add("active");
        } catch (err) {
          showToast(err.message || "Erro ao carregar dados.", "error");
        }
      });

      closeBtn.addEventListener("click", () =>
        detailsModal.classList.remove("active")
      );

      const setEditMode = (enabled) => {
        // Seleciona TODOS os campos editáveis, incluindo o novo de endereço
        const editableInputs = form.querySelectorAll(
          "#detalhe-nome, #detalhe-cpf, #detalhe-data-nasc, #detalhe-telefone, #detalhe-endereco, #detalhe-comorbidade, #detalhe-data-consulta, #detalhe-observacoes"
        );
        editableInputs.forEach((inp) => {
          inp.readOnly = !enabled;
          inp.disabled = !enabled;
        });
        form.querySelector("#detalhe-comorbidade").disabled = !enabled;
        editBtn.textContent = enabled ? "Cancelar" : "Editar";
        saveBtn.style.display = enabled ? "inline-block" : "none";
        // Esconde o botão do mapa durante a edição (opcional, mas mais limpo)
        if (linkMapaBtn) {
          linkMapaBtn.style.display = enabled
            ? "none"
            : form.querySelector("#detalhe-endereco").value
            ? "inline-flex"
            : "none";
        }
      };

      editBtn.addEventListener("click", () =>
        setEditMode(editBtn.textContent === "Editar")
      );

      deleteBtn.addEventListener("click", async () => {
        if (confirm("Tem certeza que deseja excluir este paciente?")) {
          try {
            const response = await fetch(`${API_BASE_URL}${currentId}/`, {
              method: "DELETE",
              headers: { "X-CSRFToken": csrftoken },
            });
            if (!response.ok && response.status !== 204) {
              throw new Error("Erro ao excluir.");
            }
            detailsModal.classList.remove("active");
            showToast("Paciente excluído com sucesso.", "success");
            carregarEAtualizarTudo();
          } catch (error) {
            showToast("Não foi possível excluir o paciente.", "error");
          }
        }
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const comorbSelect = form.querySelector("#detalhe-comorbidade");

        const cpfValue = cpfDetalheMask
          ? cpfDetalheMask.unmaskedValue
          : form.querySelector("#detalhe-cpf").value;
        const telValue = telDetalheMask
          ? telDetalheMask.unmaskedValue
          : form.querySelector("#detalhe-telefone").value;

        // --- VALIDAÇÃO COMPLETA (Campos obrigatórios, CPF, Telefone) ---
        const nome = form.querySelector("#detalhe-nome").value;
        const dataNasc = form.querySelector("#detalhe-data-nasc").value;
        const dataConsulta = form.querySelector("#detalhe-data-consulta").value;
        const comorb = comorbSelect.options[comorbSelect.selectedIndex].text;
        const endereco = form.querySelector("#detalhe-endereco").value.trim();

        if (
          !nome ||
          !cpfValue ||
          !dataNasc ||
          !dataConsulta ||
          !comorb ||
          !endereco
        ) {
          showToast(
            "Por favor, preencha todos os campos obrigatórios.",
            "warning"
          );
          return;
        }
        if (cpfValue.length !== 11) {
          showToast("CPF inválido. Deve conter 11 dígitos.", "warning");
          return;
        }
        if (
          telValue.length > 0 &&
          (telValue.length < 10 || telValue.length > 11)
        ) {
          showToast(
            "Telefone inválido. Deve conter 10 ou 11 dígitos.",
            "warning"
          );
          return;
        }
        // --- FIM DA VALIDAÇÃO ---

        const data = {
          nome: nome,
          cpf: cpfValue,
          data_nascimento: dataNasc,
          telefone: telValue,
          endereco: endereco, // --- NOVO CAMPO ADICIONADO ---
          comorbidade: comorb,
          data_consulta: dataConsulta,
          observacoes: form.querySelector("#detalhe-observacoes").value,
        };

        try {
          const response = await fetch(`${API_BASE_URL}${currentId}/`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrftoken,
            },
            body: JSON.stringify(data),
          });
          if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.cpf
              ? "Este CPF já está cadastrado."
              : errorData.detail || "Erro ao salvar.";
            throw new Error(errorMsg);
          }
          detailsModal.classList.remove("active");
          showToast("Paciente atualizado com sucesso!", "success");
          carregarEAtualizarTudo();
        } catch (error) {
          showToast(
            error.message || "Não foi possível salvar as alterações.",
            "error"
          );
        }
      });
    }
  };

  /* -------------------------------------------------------------------------- */
  /* ---------------------------- INICIALIZAÇÃO -------------------------------- */
  /* -------------------------------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", () => {
    gerenciarLogin();
    gerenciarLogout();
    gerenciarModais();

    const searchInput = document.querySelector(".search-bar input");
    const orderSelect = document.querySelector("#order-select");
    if (searchInput)
      searchInput.addEventListener("input", atualizarVisualizacoes);
    if (orderSelect)
      orderSelect.addEventListener("change", atualizarVisualizacoes);

    carregarEAtualizarTudo();
  });
})();
