# Apex Legends AI Agent

An intelligent, full-stack AI agent that can answer any question about the game Apex Legends. This project uses a Retrieval-Augmented Generation (RAG) architecture to provide accurate, context-aware answers about game mechanics, lore, characters, and real-time game data.

![Project Demo GIF (Placeholder)](https://placehold.co/800x400/1a1a1a/ffffff?text=Project+Demo+Placeholder)

---

## Features

* **Comprehensive Knowledge:** Answers questions about legends, weapons, abilities, maps, and game mechanics.
* **Real-time Data:** Can provide live information like the current map rotation.
* **Accurate & Factual:** Utilizes a RAG pipeline to ground responses in real data from the Apex Legends Wiki, preventing LLM "hallucinations".
* **High-Performance Stack:** Built with a modern, serverless-first technology stack optimized for speed and scalability.
* **Conversational UI:** A clean, responsive chat interface for a natural user experience.

## Architecture Overview

This project is built using a **unified monorepo** architecture, which contains the logically separate frontend and backend code but allows for a streamlined development and deployment process. The core of the agent is a **Retrieval-Augmented Generation (RAG)** pipeline.

**How it works:**

1.  **User Query:** The user asks a question in the React frontend.
2.  **API Request:** The frontend sends the query to our Hono backend API, running on a Cloudflare Worker.
3.  **Embedding:** The backend converts the user's question into a numerical representation (a vector embedding).
4.  **Similarity Search:** This embedding is used to search a **Vector Database** (e.g., Pinecone) to find the most relevant text chunks from our scraped Apex Legends knowledge base.
5.  **Augmented Prompt:** The backend constructs a new, detailed prompt for the Large Language Model (LLM), including both the original question and the relevant context retrieved from the database.
6.  **LLM Generation:** The LLM generates a high-quality, factual answer based *only* on the provided context.
7.  **Streaming Response:** The answer is streamed back to the frontend, creating a real-time typing effect in the UI.

## Tech Stack

This project uses a modern, high-performance, and serverless-first technology stack.

| Component         | Technology                                                       | Purpose                                                                                |
| ----------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Architecture** | Unified Monorepo                                                 | Simplified development and deployment.                                                 |
| **Backend** | [**Hono**](https://hono.dev/)                                    | An ultrafast, lightweight web framework for the API, optimized for edge runtimes.      |
| **Frontend** | [**React**](https://react.dev/) + [**Vite**](https://vitejs.dev/) | For building a fast and modern client-side user interface.                             |
| **Runtime & Toolkit** | [**Bun**](https://bun.sh/)                                       | A fast, all-in-one JavaScript runtime and toolkit for development, testing, and bundling. |
| **Deployment** | [**Cloudflare**](https://www.cloudflare.com/)                    | The entire application is deployed to the Cloudflare edge via **Pages** (for the frontend) and **Workers** (for the backend). |
| **Data Ingestion**| **Hybrid Model** | **Web Scraping** (using `cheerio`) for the static knowledge base and **API Calls** for real-time data. |
| **Language** | [**TypeScript**](https://www.typescriptlang.org/)                | For type safety and a better developer experience across the entire stack.             |

## Project Structure

The project is managed as a unified monorepo, created using the official Cloudflare template.

```
/apex-agent
├── public/                 # Static assets for the frontend
├── src/                    # Frontend source code (Vite + React)
│   ├── App.tsx
│   └── ...
├── worker/                 # Backend source code (Hono)
│   ├── index.ts
│   └── ...
├── package.json
├── tsconfig.json
├── vite.config.ts          # Vite configuration
└── wrangler.toml           # Cloudflare Worker configuration
```

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

* [Bun](https://bun.sh/docs/installation) installed on your machine.
* A [Cloudflare account](https://dash.cloudflare.com/sign-up).
* API keys for your chosen LLM (e.g., OpenAI, Google Gemini) and Vector Database (e.g., Pinecone).

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd apex-agent
    ```

2.  **Install dependencies:**
    Bun will read the `package.json` and install all necessary packages from the npm registry.
    ```sh
    bun install
    ```

### Configuration

1.  Create a `.dev.vars` file in the root of the project. This file is used by Cloudflare Wrangler for local development secrets and is not committed to Git.
    ```sh
    touch .dev.vars
    ```

2.  Add your secret API keys to the `.dev.vars` file:
    ```ini
    OPENAI_API_KEY="sk-..."
    PINECONE_API_KEY="..."
    PINECONE_ENVIRONMENT="..."
    ```

### Running the Development Server

This single command starts the Vite development server for the frontend and the Hono backend on a Cloudflare Worker simultaneously, with hot-reloading enabled.

```sh
bun run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Deployment

This project is configured for a simple, one-command deployment to the Cloudflare global network.

1.  **Login to Cloudflare:**
    ```sh
    bunx wrangler login
    ```

2.  **Deploy the application:**
    This command will build the frontend, bundle the backend worker, and deploy both to Cloudflare.
    ```sh
    bun run deploy
    ```

## Data Ingestion

The agent's knowledge base is built from a hybrid of web scraping and API calls. The scraping process is an offline script that needs to be run periodically to keep the data fresh.

* **To run the scraper:**
    ```sh
    bun run scrape
    ```
    *(Note: This script will need to be created as part of the project development.)*

## Contributing

Contributions are welcome! If you have ideas for new features, find a bug, or want to improve the documentation, please feel free to open an issue or submit a pull request.

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
