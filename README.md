# 🕵️ Impostors AI – AI-Powered Social Deduction Game

Impostors AI is a **fully on-chain AI social deduction game** where players must identify the **hidden traitor** among a group of **intelligent AI agents**. These AI agents engage in **real-time discussions and strategy planning**, but one of them is secretly **sabotaging the plans**.

Players analyze the AI-generated conversations and vote to eliminate the **suspected impostor** before time runs out. The game is **completely autonomous**, leveraging **AI agents, blockchain smart contracts (Sui Move), and real-time interactions**.

---

## 🚀 Tech Stack

The project is built using a **modern Web3 and AI tech stack**:

| **Component**  | **Technology**                                 |
| -------------- | ---------------------------------------------- |
| **Blockchain** | Sui (Move Smart Contracts)                     |
| **Frontend**   | Next.js (Monorepo)                             |
| **Backend**    | NestJS (API, Keeper/Listener, AI integration)  |
| **AI Agents**  | LangGraph (Orchestrates AI-driven discussions) |
| **LLM**        | TogetherAI, DeepSeek, or Ollama (local/remote) |

---

## 🛠️ Running the Project Locally

**1️⃣ Install Dependencies**

```sh
yarn install
```

**2️⃣ Build and Publish Sui Move Packages**

```sh
yarn move:build
yarn move:publish
```

* This compiles and deploys the Move contracts to your selected Sui network (`localnet`, `devnet`, etc).

**3️⃣ Set Up API Environment Variables**

Navigate to `packages/api/` and create a `.env` file:

```env
TOGETHERAI_API_KEY=        # Optional (required for TogetherAI)
SUI_NETWORK=localnet       # or devnet, testnet, mainnet
PKG_ID=                    # The package ID from Move publish
GAME_SESSION_LIST_ID=      # The shared GameSessionList object ID
ADMIN_CAP_ID=              # The AdminCap object ID
ADMIN_SECRET_KEY=          # The private key that owns AdminCap
```

**4️⃣ Run the Backend API**

```sh
yarn start:api
```

* This starts the NestJS API and session/game keeper logic.
* You can optionally use `--model=deepseek` to use DeepSeek/Ollama.

**5️⃣ Set Up Frontend Environment Variables**

Navigate to `packages/nextjs/` and create a `.env` file:

```env
NEXT_PUBLIC_SUI_NETWORK=localnet       # or devnet, etc
NEXT_PUBLIC_GAME_SESSION_LIST_ID=      # The shared GameSessionList object ID
NEXT_PUBLIC_PKG_ID=                    # The package ID from Move publish
API_URL=http://localhost:8080          # The API URL
```

**6️⃣ Start the Frontend**

```sh
yarn start
```

* This runs the Next.js frontend in development mode.

**7️⃣ Open the App**

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧩 Useful Scripts

| Script              | What it Does                          |
| ------------------- | ------------------------------------- |
| `yarn move:build`   | Compile Move smart contracts          |
| `yarn move:publish` | Publish Move contracts to Sui         |
| `yarn start:api`    | Run backend API & game/session keeper |
| `yarn start`        | Run Next.js frontend in dev mode      |
| `yarn next:build`   | Build the frontend for production     |
| `yarn next:lint`    | Lint the frontend code                |

---

## 💡 Contributing

We welcome contributions! If you’d like to improve Impostors AI, feel free to:

* Fork the repo
* Create a new branch
* Submit a pull request

---

## 📜 License

This project is licensed under the MIT License.
