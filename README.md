# 🚀 CodePilot AI

### AI-Powered Code Analysis, Security & Developer Assistant

CodePilot AI is an AI-powered developer platform designed to help programmers **understand, analyze, debug, optimize, secure, and improve their code** from a single workspace.

It combines deterministic static analysis with AI-powered assistance to provide code explanations, complexity analysis, security findings, refactoring recommendations, test generation, documentation generation, project analysis, architecture visualization, and developer-focused reports.

> **Understand. Analyze. Secure. Optimize. Build Better Code.**

---

## ✨ Features

### 🧠 Intelligent Code Analysis

Analyze source code and receive structured insights about:

* Code quality
* Readability
* Maintainability
* Performance
* Security
* Algorithmic complexity
* Potential bugs
* Code smells
* Improvement opportunities

---

### ⏱️ Time & Space Complexity

CodePilot analyzes common programming patterns and estimates:

* Time complexity
* Space complexity
* Confidence level
* Detected patterns
* Reasoning behind the estimate

Example:

```text
Time Complexity
O(n²)

Confidence
High

Reason
Nested iteration detected over the input size.
```

> Complexity results are static-analysis estimates. They should not be interpreted as formal mathematical proofs for arbitrary programs.

---

### 🛡️ Security Analysis

The security analyzer checks source code for potentially dangerous patterns, including:

* Hardcoded secrets
* API keys and tokens
* `eval()` usage
* Potential SQL injection patterns
* XSS-related patterns
* Unsafe command execution
* Weak cryptography patterns
* Sensitive information logging
* Unsafe HTML rendering

Findings are categorized by severity:

```text
Critical
High
Medium
Low
Informational
```

Each finding includes:

* Issue
* Severity
* Location
* Risk
* Explanation
* Recommended remediation

> Static security analysis identifies known patterns; it does not guarantee that an application is completely secure.

---

## 🤖 AI Developer Assistant

CodePilot AI integrates Google's Gemini API through a server-side backend.

The AI assistant supports:

### Explain Code

Understand how a piece of code works step by step.

### Deep Code Review

Analyze:

* Performance
* Complexity
* Security
* Bugs
* Architecture
* Maintainability

### AI Refactoring

Generate improved implementations with:

* Refactored code
* Explanation
* Complexity comparison
* Changes made
* Trade-offs

### Test Generation

Generate unit tests for supported programming languages and frameworks.

### Documentation Generation

Generate:

* JSDoc
* Docstrings
* Technical documentation
* Code explanations

### AI Chat

Ask questions about the current code and programming concepts.

### Streaming AI Responses

The application also includes a streaming chat endpoint for progressive AI responses.

---

# 🧑‍💻 Supported Languages

The editor currently supports:

* JavaScript
* TypeScript
* Python
* Java
* C
* C++
* HTML
* CSS
* JSON

---

# 🖥️ Developer Workspace

CodePilot provides a developer-oriented workspace containing:

* Dashboard
* Code Analyzer
* Architecture View
* AI Assistant
* Projects
* Analysis History
* Security Center
* Reports
* Settings
* Self-Training / Adaptive Analysis area

---

# 📝 Code Editor

The project uses **Monaco Editor** to provide a modern coding experience.

Features include:

* Syntax highlighting
* Multiple language modes
* Line numbers
* Code editing
* Developer-friendly interface
* Starter code examples
* Analysis workflow

---

# 🏗️ Architecture Visualization

CodePilot includes an architecture view and dependency-analysis utilities designed to help visualize relationships between project components.

The goal is to move beyond analyzing individual snippets and toward understanding how files and modules interact within a codebase.

---

# 📊 Code Health

CodePilot generates a structured code-health score based on several dimensions:

```text
Code Health

Readability
Maintainability
Performance
Security
Complexity
```

Example:

```text
Overall Health: 87/100
```

The score is accompanied by underlying analysis rather than being treated as a standalone measurement.

---

# 📁 Project Management

Projects can contain multiple source files and metadata.

Example:

```text
Project
├── src/
│   ├── components/
│   ├── services/
│   ├── utils/
│   └── api/
├── tests/
└── configuration
```

The current application includes project, analysis-history, and report APIs.

---

# 📜 Analysis History

CodePilot stores analysis results during the current server session.

History can contain information such as:

* Project
* File
* Language
* Complexity
* Security findings
* Bug findings
* Code-health score
* Timestamp

> The current implementation uses in-memory server storage. Persistent PostgreSQL/Prisma storage is planned for the next production architecture.

---

# 📑 Reports

Analysis results can be represented as reports containing:

* Code-health information
* Complexity analysis
* Security findings
* Bug findings
* Quality recommendations
* AI analysis

---

# ⚡ Command Palette

CodePilot includes a developer command palette for quickly accessing common functionality.

The goal is to provide keyboard-driven workflows similar to modern developer tools.

---

# 🧪 Analysis Architecture

The application follows a hybrid analysis approach:

```text
                 Source Code
                      │
                      ▼
               Language Detection
                      │
                      ▼
              Static Code Analysis
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      Complexity   Security    Code Quality
          │           │           │
          └───────────┼───────────┘
                      ▼
                  AI Analysis
                      │
                      ▼
              Combined Results
```

This architecture is important because deterministic analysis and AI reasoning serve different purposes.

---

# 🧩 Technology Stack

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Monaco Editor
* Lucide React
* Motion
* D3

## Backend

* Node.js
* Express
* TypeScript
* `tsx`

## AI

* Google Gemini API
* `@google/genai`

## Static Analysis

* Babel Parser
* Babel Types
* Custom analysis utilities
* AST-based analysis utilities
* Dependency graph utilities

## Authentication / Cloud

* Firebase
* Firestore rules/configuration

## Validation

* Zod
* Custom validation utilities

---

# 📂 Project Structure

```text
codepilot-ai/
│
├── src/
│   ├── components/
│   │   ├── AIAssistant.tsx
│   │   ├── ArchitectureView.tsx
│   │   ├── AuthBadge.tsx
│   │   ├── CodeAnalyzer.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Header.tsx
│   │   ├── HistoryView.tsx
│   │   ├── ProjectsManager.tsx
│   │   ├── ReportsView.tsx
│   │   ├── SecurityView.tsx
│   │   ├── SelfTrainingView.tsx
│   │   ├── SettingsView.tsx
│   │   └── Sidebar.tsx
│   │
│   ├── services/
│   │   ├── aiService.ts
│   │   ├── api.ts
│   │   ├── firebase.ts
│   │   ├── health.ts
│   │   └── httpClient.ts
│   │
│   ├── utils/
│   │   ├── analysisWorker.ts
│   │   ├── astAnalyzer.ts
│   │   ├── chatContextFormatter.ts
│   │   ├── codeRunner.ts
│   │   ├── dependencyGraph.ts
│   │   ├── selfTrainedAI.ts
│   │   ├── starterCode.ts
│   │   ├── staticAnalyzer.ts
│   │   └── validation.js
│   │
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
│
├── server.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
├── firebase-blueprint.json
├── firestore.rules
├── firebase-applet-config.json
├── .env.example
└── README.md
```

---

# 🔌 API

The backend exposes several API endpoints.

## Health

```http
GET /api/health
```

Returns the backend health status.

---

## AI Deep Analysis

```http
POST /api/ai/deep-analyze
```

Example request:

```json
{
  "code": "function example() {}",
  "language": "javascript"
}
```

---

## AI Explanation

```http
POST /api/ai/explain
```

---

## AI Refactoring

```http
POST /api/ai/refactor
```

Returns a structured refactoring result.

---

## AI Test Generation

```http
POST /api/ai/tests
```

---

## AI Documentation

```http
POST /api/ai/document
```

---

## AI Chat

```http
POST /api/ai/chat
```

---

## Streaming AI Chat

```http
POST /api/ai/chat-stream
```

---

## Projects

```http
GET  /api/projects
POST /api/projects
```

---

## History

```http
GET  /api/history
POST /api/history
```

---

## Reports

```http
GET  /api/reports
POST /api/reports
```

---

# ⚙️ Installation

## Prerequisites

Install:

* Node.js 20+
* npm
* Git

Verify:

```bash
node --version
npm --version
```

---

# 📥 Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/codepilot-ai.git
```

Move into the project:

```bash
cd codepilot-ai
```

---

# 📦 Install Dependencies

```bash
npm install
```

---

# 🔐 Environment Configuration

Create a local environment file based on:

```text
.env.example
```

Configure:

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
```

Never commit your real API key to GitHub.

Add `.env` and `.env.local` to `.gitignore`.

---

# ▶️ Run Locally

Start the development server:

```bash
npm run dev
```

The application uses the Express server together with Vite middleware during development.

Open:

```text
http://localhost:3000
```

---

# 🏗️ Production Build

Create a production frontend build:

```bash
npm run build
```

The generated production assets are placed in:

```text
dist/
```

Run the production server with:

```bash
NODE_ENV=production npm start
```

---

# 🧹 Type Checking

Run:

```bash
npm run lint
```

This performs TypeScript checking with:

```bash
tsc --noEmit
```

---

# 🔑 AI Configuration

CodePilot uses the Gemini API from the backend.

The intended architecture is:

```text
Browser
   │
   ▼
CodePilot Backend
   │
   ▼
Gemini API
```

The Gemini API key should remain server-side.

Do not place production API keys directly inside React source code.

---

# 🔒 Security Considerations

CodePilot is designed with security analysis in mind, but its static scanner should not be treated as a complete security audit.

The application can identify potentially dangerous coding patterns, but:

* Static analysis can produce false positives.
* Static analysis can miss vulnerabilities.
* AI-generated recommendations require developer review.
* Complexity estimates may be approximate.
* AI output should be reviewed before applying changes.

Never execute arbitrary user code directly on the production Node.js server.

A future secure execution architecture should use isolated containers or a dedicated sandbox with:

* CPU limits
* Memory limits
* Execution timeout
* Restricted filesystem
* Disabled network access
* Process limits

---

# 🛣️ Roadmap

## Phase 1 — Core Platform

* [x] React developer workspace
* [x] Monaco editor
* [x] Multi-language support
* [x] Code analysis
* [x] Complexity analysis
* [x] Security analysis
* [x] Code-quality scoring
* [x] AI explanations
* [x] AI refactoring
* [x] AI test generation
* [x] AI documentation
* [x] AI chat
* [x] Streaming AI chat
* [x] Projects
* [x] Analysis history
* [x] Reports
* [x] Architecture visualization

## Phase 2 — Intelligence

* [ ] Advanced AST-based analysis for more languages
* [ ] Improved complexity inference
* [ ] Control-flow analysis
* [ ] Data-flow analysis
* [ ] Code dependency graph
* [ ] Repository-level analysis
* [ ] Semantic code search
* [ ] Improved security rule engine
* [ ] Technical-debt analysis

## Phase 3 — AI Engineering

* [ ] Multi-agent AI architecture
* [ ] AI debugging agent
* [ ] Security agent
* [ ] Performance agent
* [ ] Test-generation agent
* [ ] Documentation agent
* [ ] AI orchestration
* [ ] Context-aware repository assistant
* [ ] AI refactoring with validated diffs

## Phase 4 — Production Platform

* [ ] PostgreSQL
* [ ] Prisma ORM
* [ ] Persistent project storage
* [ ] Persistent analysis history
* [ ] User authentication
* [ ] Authorization
* [ ] Redis caching
* [ ] Rate limiting
* [ ] Observability
* [ ] Automated backups

## Phase 5 — Developer Ecosystem

* [ ] GitHub OAuth
* [ ] Repository import
* [ ] Pull Request analysis
* [ ] AI code review
* [ ] Git-aware analysis
* [ ] CI/CD integration
* [ ] Team workspaces
* [ ] Role-based access control

## Phase 6 — Advanced Code Execution

* [ ] Secure execution service
* [ ] Docker sandbox
* [ ] Python execution
* [ ] Java execution
* [ ] C/C++ execution
* [ ] Resource limits
* [ ] Network isolation
* [ ] Execution monitoring

---

# 🎯 Vision

CodePilot AI is being developed toward a broader goal:

```text
                CODEPILOT AI
                     │
                     ▼
              Understand Code
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Analyze     Secure     Optimize
          │          │          │
          └──────────┼──────────┘
                     ▼
                AI Assistant
                     │
                     ▼
              Developer Action
                     │
                     ▼
               Test & Verify
```

The long-term goal is to evolve CodePilot from a code-analysis utility into an **AI-powered software engineering workspace** capable of understanding repositories, reviewing changes, detecting problems, proposing fixes, generating tests, and assisting developers throughout the software-development lifecycle.

---

# 🤝 Contributing

Contributions, ideas, bug reports, and feature suggestions are welcome.

### Development workflow

```bash
git checkout -b feature/your-feature
```

Make your changes, test them, and then create a pull request.

Please ensure:

```bash
npm run lint
npm run build
```

pass before submitting a pull request.

---

# ⚠️ Current Limitations

The current version is an actively evolving project.

Important limitations include:

* Project/history/report storage currently uses in-memory server storage.
* AI functionality requires a configured Gemini API key.
* Static complexity analysis is heuristic and language-dependent.
* Security findings are static-analysis indicators, not proof of vulnerabilities.
* Secure arbitrary-code execution is not implemented as a production sandbox.
* Full repository intelligence and GitHub integration are part of the planned roadmap.

These limitations are intentionally documented rather than presenting unfinished functionality as production infrastructure.

---

# 📄 License

This project includes source files marked under the Apache License 2.0.

See individual source-file license headers and repository licensing information for applicable terms.

---

# 👨‍💻 Author

**Divyanshu Singh**

Computer Science & Engineering

---

## ⭐ If you find this project useful

Give the repository a ⭐ on GitHub and feel free to explore, improve, and contribute.

---

### CodePilot AI

**Understand. Analyze. Secure. Optimize. Build Better Code.**
