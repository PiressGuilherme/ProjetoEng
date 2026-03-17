#  Gestor de Pacientes UBS (SISMO)

Sistema de gerenciamento e monitoramento de pacientes para Unidades Básicas de Saúde (UBS). O sistema permite o cadastro de pacientes, controle de necessidade específica e define automaticamente a urgência do próximo atendimento com base em regras de negócio específicas de saúde.

---

## Acesso Online

O projeto está implantado e acessível publicamente através do Render. Você pode acessá-lo clicando no link abaixo:

🔗 **Acessar Sistema:** [https://gestor-ubs.onrender.com](https://gestor-ubs.onrender.com)

> **Nota:** Como o servidor utiliza o plano gratuito do Render, o primeiro carregamento pode demorar cerca de 50 segundos para "acordar" a aplicação.

---

## Funcionalidades Principais

* **Autenticação Segura:** Sistema de Login/Logout para profissionais da saúde.
* **Dashboard Interativo:** Visão geral com contagem de pacientes por status de urgência (Verde, Amarelo, Vermelho, Urgente).
* **Gestão de Pacientes (CRUD):** Adicionar, visualizar detalhes, editar e excluir pacientes.
* **Cálculo Automático de Retorno:** A data da próxima consulta é calculada automaticamente baseada na necessidade específica do paciente.
* **Sistema de Cores de Prioridade:** Classificação visual automática da urgência baseada nos dias restantes para a consulta.
* **Busca e Filtros:** Pesquisa em tempo real por nome, CPF ou necessidade específica e ordenação dinâmica.
* **Integração com Mapas:** Link direto para visualizar o endereço do paciente no Google Maps.

---

## Regras de Negócio (Lógica do Sistema)

O sistema possui inteligência para definir prazos e prioridades automaticamente, conforme implementado na API.

### 1. Intervalo de Retorno por Necessidade específica
Ao cadastrar um paciente, a **Próxima Consulta** é calculada automaticamente somando meses à data da última consulta:

| Necessidade Específica | Intervalo de Retorno |
| :--- | :--- |
| **Gestante** | 1 Mês |
| **Hipertensão** | 3 Meses |
| **Diabetes** | 6 Meses |

### 2. Status de Prioridade (Cores)
O status é definido dinamicamente calculando quantos dias faltam para a próxima consulta:

| Status | Cor | Condição (Dias Restantes) | Significado |
| :--- | :--- | :--- | :--- |
| **Urgente** | 🔴 Escuro | Menor que 0 (Negativo) | Consulta atrasada / Vencida |
| **Vermelho** | 🔴 Vermelho | 0 a 15 dias | Prazo crítico, agendar logo |
| **Amarelo** | 🟡 Amarelo | 16 a 45 dias | Atenção, consulta próxima |
| **Verde** | 🟢 Verde | Mais de 45 dias | Situação regular |

---

## Tecnologias Utilizadas

* **Backend:** Python 3.11, Django 5.2, Django REST Framework.
* **Frontend:** HTML5, CSS3 (Responsivo), Javascript (Vanilla + Fetch API).
* **Banco de Dados:** SQLite (Desenvolvimento) / PostgreSQL (Produção).
* **Infraestrutura:** Gunicorn, WhiteNoise (Arquivos estáticos), Render (Deploy).
* **Segurança:** Proteção CSRF, Variáveis de ambiente (.env).

---

## Instalação e Execução Local

Siga os passos abaixo para rodar o projeto na sua máquina a partir do GitHub.

### Pré-requisitos
* Python 3.10 ou superior instalado.
* Git instalado.

### Passo a Passo

1.  **Clone o repositório**
    ```bash
    git clone [https://github.com/SEU-USUARIO/ProjetoEng.git](https://github.com/SEU-USUARIO/ProjetoEng.git)
    cd ProjetoEng
    ```

2.  **Crie um ambiente virtual**
    ```bash
    # Windows
    python -m venv venv
    venv\Scripts\activate

    # Linux/Mac
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Instale as dependências**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure as Variáveis de Ambiente**
    Crie um arquivo `.env` na pasta `src/` (onde está o `manage.py`) ou na raiz, com o seguinte conteúdo básico para local:
    ```env
    DEBUG=True
    SECRET_KEY=sua-chave-secreta-aqui
    ALLOWED_HOSTS=127.0.0.1,localhost
    ```

5.  **Aplique as migrações do banco de dados**
    Navegue até a pasta `src` e execute:
    ```bash
    cd src
    python manage.py migrate
    ```

6.  **Crie um Superusuário (Para acessar o sistema)**
    O sistema exige login. Crie seu usuário administrativo:
    ```bash
    python manage.py createsuperuser
    ```
    *Siga as instruções no terminal para definir usuário e senha.*

7.  **Execute o servidor**
    ```bash
    python manage.py runserver
    ```

8.  **Acesse no navegador**
    Abra `http://127.0.0.1:8000/` e faça login com o usuário criado no passo 6.

---

## Como Utilizar as Funções

### 1. Acessando o Sistema
* Na tela inicial, insira seu **Login Institucional** (username) e **Senha** criados anteriormente.
* Caso não tenha acesso, solicite ao administrador do sistema.

### 2. Dashboard
* Ao logar, você verá cards com o resumo da unidade.
* As barras de progresso mostram a porcentagem de pacientes em cada status de risco.
* Listas rápidas mostram pacientes atrasados (Urgentes) e consultas para os próximos dias.

### 3. Cadastrar Novo Paciente
1.  Clique no botão **"Novo Paciente"** (no topo ou no menu).
2.  Preencha **Nome**, **CPF** (com validação automática), **Data de Nascimento** e **Endereço**.
3.  **Importante:** Selecione a **Necessidade Específica** e a **Data da Última Consulta**.
4.  O sistema calculará automaticamente a próxima data e o status.

### 4. Gerenciar Pacientes (Lista)
* Acesse o menu **"Ver Todos os Pacientes"**.
* **Busca:** Digite no campo de busca para filtrar por nome, CPF ou doença.
* **Ordenar:** Use o seletor para ordenar por "Status" (mais críticos primeiro) ou "Nome".
* **Detalhes/Edição:** Clique em "Ver detalhes" em qualquer paciente para abrir o prontuário, editar dados ou ver a localização no mapa.

---

## Estrutura do Projeto

```text
ProjetoEng/
├── requirements.txt      # Dependências do Python
├── Procfile              # Arquivo de configuração do Render
└── src/
    ├── manage.py         # Gerenciador do Django
    ├── railway_django/   # Configurações principais (settings, urls)
    ├── apps/
    │   └── pacientes/    # App principal (Models, Views, API)
    ├── static/           # Arquivos CSS, JS e Imagens
    └── templates/        # Arquivos HTML (Login, Dashboard, Listas)
