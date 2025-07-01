# Chat com Documentos (PDF) usando Gemini e React

Este é um projeto de chat interativo que permite aos usuários fazerem perguntas sobre o conteúdo de um documento PDF. O back-end é construído com Flask e utiliza a API do Google Gemini através da biblioteca LangChain. O front-end é uma aplicação moderna feita em React.

![Screenshot da Aplicação](https://i.imgur.com/LgDRn7U.png) ---

### Tecnologias Utilizadas

* **Back-end:**
    * Python 3.10+
    * Flask
    * LangChain
    * Google Generative AI (Gemini)
    * FAISS (para busca vetorial)

* **Front-end:**
    * Node.js e NPM
    * React (com Vite)
    * Axios

---

### Pré-requisitos

Antes de começar, garanta que você tem as seguintes ferramentas instaladas na sua máquina:
* [Python](https://www.python.org/downloads/) (versão 3.10 ou superior)
* [Node.js](https://nodejs.org/) (versão 18 ou superior)
* [Git](https://git-scm.com/)

---

### Como Rodar o Projeto

Siga os passos abaixo para configurar e executar a aplicação localmente.

#### 1. Clonar o Repositório

```bash
git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
cd seu-repositorio
```

#### 2. Configuração do Back-end (Python)

As instruções a seguir devem ser executadas a partir da pasta `backend/`.

```bash
cd backend
```

**a. Crie e Ative um Ambiente Virtual:**

* **Windows:**
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```
* **macOS / Linux:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

**b. Instale as Dependências:**

Com o ambiente virtual ativado, instale todas as bibliotecas Python necessárias com um único comando:
```bash
pip install -r requirements.txt
```

#### 3. Configuração do Front-end (React)

As instruções a seguir devem ser executadas a partir da pasta `frontend/`.

```bash
# Se você estiver na pasta backend, volte para a raiz: cd ..
cd frontend
```

**a. Instale as Dependências:**

```bash
npm install
```

---

### Executando a Aplicação

Para rodar a aplicação, você precisará de **dois terminais abertos simultaneamente**.

**Terminal 1: Rodar o Back-end**
1.  Navegue até a pasta `backend`.
2.  Ative o ambiente virtual (se não estiver ativo).
3.  Inicie o servidor Flask:
    ```bash
    python app.py
    ```
O back-end estará rodando em `http://127.0.0.1:5000`.

**Terminal 2: Rodar o Front-end**
1.  Navegue até a pasta `frontend`.
2.  Inicie o servidor de desenvolvimento do React:
    ```bash
    npm run dev
    ```
O front-end estará acessível em `http://localhost:5173/` (ou a porta que o Vite indicar).

### Uso

1.  Abra o endereço do front-end no seu navegador.
2.  Obtenha uma chave de API no [Google AI Studio](https://aistudio.google.com/).
3.  Insira sua chave de API no campo correspondente.
4.  Faça o upload de um arquivo PDF.
5.  Aguarde o processamento e comece a fazer suas perguntas!