<div align="center">

# GitAid

### Chat with your codebase, powered by RAG + LLMs

**GitAid** is a full-stack AI developer tool that lets you connect your GitHub account, index any repository into a vector database, and have a context-aware conversation with your codebase — complete with file-level citations linking back to the exact lines of code the AI used to answer.

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1.1-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat-square&logo=postgresql&logoColor=white)
![pgvector](https://img.shields.io/badge/pgvector-HNSW-blue?style=flat-square)
![Spring AI](https://img.shields.io/badge/Spring_AI-2.0.1-6DB33F?style=flat-square&logo=spring&logoColor=white)

</div>

---

## Table of Contents

1. [What is GitAid?](#what-is-gitaid)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Architecture Overview](#architecture-overview)
5. [System Architecture Diagram](#system-architecture-diagram)
6. [Backend Deep Dive](#backend-deep-dive)
   - [Package Structure](#package-structure)
   - [Security & Authentication](#security--authentication)
   - [REST API Reference](#rest-api-reference)
   - [Database Schema](#database-schema)
   - [Indexing Pipeline](#indexing-pipeline)
   - [RAG Chat Pipeline](#rag-chat-pipeline)
7. [Frontend Deep Dive](#frontend-deep-dive)
   - [App Router Structure](#app-router-structure)
   - [State Management](#state-management)
   - [Streaming SSE Client](#streaming-sse-client)
8. [Data Flows (End-to-End)](#data-flows-end-to-end)
9. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Environment Variables](#environment-variables)
   - [Running Locally](#running-locally)
10. [Project Structure](#project-structure)
11. [Design Decisions](#design-decisions)

---

## What is GitAid?

GitAid solves a problem every developer faces: **large codebases are hard to navigate**. Understanding an unfamiliar project, finding where a feature lives, or tracing why a bug exists requires reading dozens of files. GitAid collapses that workflow into a single chat interface.

The user connects their GitHub account, picks any repository — public or private — and triggers an index. GitAid fetches every source file via the GitHub API, breaks the code into semantically meaningful chunks, and embeds them into a vector database using OpenAI's embedding model. From that point on, the user can ask natural-language questions about the codebase: *"How does authentication work?"*, *"Where is the payment logic?"*, *"What does this function return?"*. The AI answers using only the code it actually retrieved, and every response is annotated with citations — clickable links that open the relevant file on GitHub at the exact line range.

---

## Key Features

- **GitHub OAuth 2.0** — Sign in with GitHub. GitAid requests `read:user,repo` scope, giving it access to both public and private repositories.
- **Automatic repository sync** — All repositories are fetched and kept up to date with a single refresh call (up to 1,000 repos across up to 10 pages).
- **Async vector indexing** — Repository indexing runs in a background thread pool. The UI polls for real-time progress: file count, chunk count, and status transitions (`PENDING → INDEXING → READY`).
- **Smart file filtering** — The indexer skips binaries, lock files, hidden files, generated directories (`node_modules`, `.next`, `dist`, `target`, `__pycache__`), and files over 100 KB. 40+ code and config extensions are whitelisted.
- **RAG (Retrieval-Augmented Generation)** — Each question is embedded and used to perform a HNSW cosine similarity search over the repository's vector store, retrieving the top-8 most relevant code chunks. Those chunks are injected into the LLM prompt as context — the model never hallucinates from general knowledge.
- **Real-time streaming replies** — LLM responses are streamed token-by-token from the backend to the browser via **Server-Sent Events (SSE)**. The frontend renders a live typing effect as tokens arrive.
- **File-level citations** — Every AI response includes citation chips showing the exact `filePath:startLine–endLine` for each code chunk that informed the answer, with direct links to GitHub.
- **Secure token storage** — GitHub access tokens are AES-encrypted with Spring Security's `TextEncryptor` before being written to the database. They are decrypted in-memory only when a GitHub API call needs to be made.
- **Dark/light mode** — Full theming support via `next-themes`, respecting the system preference by default.

---

## Tech Stack

### Backend

| Concern | Technology |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 4.1.1 |
| Web layer | Spring MVC (servlet-based, not reactive) |
| Security | Spring Security — Session-based OAuth 2.0 |
| ORM | Spring Data JPA / Hibernate (`ddl-auto: update`) |
| Database | PostgreSQL 16 |
| Vector store | pgvector via `spring-ai-starter-vector-store-pgvector` |
| AI / LLM | Spring AI 2.0.1 — OpenAI-compatible API pointed at **OpenRouter** |
| Chat model | `openai/gpt-4o-mini` |
| Embedding model | `openai/text-embedding-3-small` (1536 dimensions) |
| Vector index | HNSW, cosine distance |
| HTTP client | Spring `RestClient` (for GitHub API) |
| Async threading | `ThreadPoolTaskExecutor` (core 2, max 4, queue 50) |
| Token encryption | Spring Security `Encryptors.text()` (AES-256) |
| Build | Maven + Spring Boot Maven Plugin |
| Boilerplate reduction | Lombok |

### Frontend

| Concern | Technology |
|---|---|
| Framework | Next.js 16.3.5 (React 19, TypeScript 5) |
| Routing | Next.js App Router (file-based, server + client components) |
| Styling | Tailwind CSS v4, PostCSS |
| UI components | shadcn/ui + Base UI (`@base-ui/react`) |
| Icons | Lucide React, React Icons |
| Server state | TanStack React Query v5 |
| SSE streaming | Native `fetch` + `ReadableStream` reader |
| Markdown rendering | `streamdown` + `@streamdown/code` (streaming-safe) |
| Date formatting | `date-fns` |
| Theming | `next-themes` |
| Route protection | Next.js Middleware (cookie-based guard) |

### Infrastructure

| Concern | Technology |
|---|---|
| Database container | `pgvector/pgvector:pg16` (Docker) |
| DB extensions | `vector`, `hstore`, `uuid-ossp` (bootstrapped via init SQL) |
| Data persistence | Named Docker volume `gitaid_pg_data` |
| Orchestration | Docker Compose |

---

## Architecture Overview

GitAid is a classic **three-tier application** with a specialised AI layer:

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Next.js)                  │
│  App Router · React Query · SSE Client · shadcn/ui   │
└────────────────────────┬────────────────────────────┘
                         │  HTTP + SSE
                         │  (session cookie)
┌────────────────────────▼────────────────────────────┐
│                Spring Boot Backend                    │
│                                                       │
│  ┌───────────┐  ┌────────────┐  ┌────────────────┐  │
│  │Auth Layer │  │ REST API   │  │  Async Workers  │  │
│  │(OAuth 2.0 │  │Controllers │  │ (ThreadPool)    │  │
│  │ Sessions) │  │            │  │                 │  │
│  └───────────┘  └─────┬──────┘  └───────┬─────────┘  │
│                        │                │             │
│         ┌──────────────┼────────────────┘             │
│         │              │                              │
│  ┌──────▼──────┐  ┌────▼──────────┐                  │
│  │  Services   │  │  RAG Pipeline │                  │
│  │             │  │               │                  │
│  │ UserService │  │ CodeContext   │                  │
│  │ RepoService │  │ Retriever     │                  │
│  │ ChatService │  │ PromptBuilder │                  │
│  └──────┬──────┘  └────┬──────────┘                  │
│         │              │                              │
└─────────┼──────────────┼──────────────────────────────┘
          │              │
  ┌───────▼──┐   ┌───────▼──────────────┐
  │PostgreSQL│   │  External APIs       │
  │          │   │                      │
  │ users    │   │ ┌──────────────────┐ │
  │ repos    │   │ │ GitHub API v3    │ │
  │ sessions │   │ │ (file content,   │ │
  │ messages │   │ │  repo tree)      │ │
  │          │   │ └──────────────────┘ │
  │ pgvector │   │ ┌──────────────────┐ │
  │ (chunks) │   │ │ OpenRouter API   │ │
  │          │   │ │ (gpt-4o-mini +   │ │
  └──────────┘   │ │  embeddings)     │ │
                 │ └──────────────────┘ │
                 └──────────────────────┘
```

---

## System Architecture Diagram

### Indexing Flow

```
User triggers "Index"
        │
        ▼
POST /api/repos/{id}/index
        │
        ├── [Sync] Mark repo INDEXING → save → return 202
        │
        └── [Async — indexingExecutor thread pool]
                │
                ├── Decrypt GitHub token (AES)
                ├── Delete existing vectors for this repoId
                ├── GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
                │        (GitHub API — full file tree)
                │
                ├── CodeFileFilter.isEligible()
                │        skip: node_modules, .git, dist, build, target,
                │               .next, vendor, __pycache__, lock files,
                │               hidden files, files > 100 KB
                │
                └── For each eligible file:
                        │
                        ├── GET /repos/{owner}/{repo}/contents/{path}
                        │        (GitHub API — Base64 encoded content)
                        │
                        ├── Base64 decode → raw source text
                        │
                        ├── CodeChunker.chunkFile()
                        │        prefix: "// File: {path}\n"
                        │        TokenTextSplitter (Spring AI)
                        │        chunk-size=800, overlap=100
                        │        metadata: repoId, filePath, language, chunkIndex
                        │
                        ├── Batch 32 documents → VectorStore.add()
                        │        Spring AI → text-embedding-3-small
                        │        → INSERT into pgvector (HNSW index)
                        │
                        ├── GitHubRateLimiter.pause() (50ms)
                        └── updateProgress() every 5 files
                                │
                                ▼
                        repo.indexStatus = READY
```

### RAG Chat Flow

```
User types question → POST /api/chat/sessions/{id}/messages
                                │
                                ▼ [returns SseEmitter immediately]
                                │
              ┌─────────────────┴──────────────────────┐
              │        SSE event: user_message          │
              │   (persisted USER ChatMessage)          │
              └─────────────────┬──────────────────────┘
                                │
              ┌─────────────────▼──────────────────────┐
              │     CodeContextRetriever.retrieve()     │
              │                                         │
              │  1. Embed question                      │
              │     → text-embedding-3-small (1536d)    │
              │                                         │
              │  2. VectorStore.similaritySearch()      │
              │     filter: repoId == {repositoryId}    │
              │     topK:   8                           │
              │     metric: cosine distance (HNSW)      │
              │                                         │
              │  3. Build citations from metadata       │
              │     (filePath, startLine, endLine)      │
              │                                         │
              │  4. Join chunk texts → contextText      │
              └─────────────────┬──────────────────────┘
                                │
              ┌─────────────────▼──────────────────────┐
              │       ChatPromptBuilder                 │
              │                                         │
              │  systemPrompt: "You are GitAid,         │
              │   expert for {repo}. Answer ONLY        │
              │   from provided context. Cite           │
              │   file paths and line ranges."          │
              │                                         │
              │  userPrompt:  [code context]            │
              │               [user question]           │
              └─────────────────┬──────────────────────┘
                                │
              ┌─────────────────▼──────────────────────┐
              │       ChatStreamHandler.stream()        │
              │                                         │
              │  ChatClient (Spring AI)                 │
              │    → OpenRouter API                     │
              │    → gpt-4o-mini (streaming)            │
              │                                         │
              │  For each token:                        │
              │    SSE event: token → "..."             │
              │                                         │
              │  On complete:                           │
              │    persist ASSISTANT ChatMessage        │
              │    (content + citations JSON)           │
              │    SSE event: assistant_message         │
              │    SSE event: done → "[DONE]"           │
              └─────────────────────────────────────────┘
```

---

## Backend Deep Dive

### Package Structure

```
gitaid.backend/
├── BackendApplication.java          # @SpringBootApplication entry point
│
├── config/
│   ├── AppConfig.java               # RestClient.Builder bean; async ThreadPoolTaskExecutor
│   │                                  (core=2, max=4, queue=50, threadNamePrefix=indexing-)
│   ├── CorsConfig.java              # CORS config — configurable allowed origins, all methods,
│   │                                  credentials=true (required for session cookie)
│   ├── CryptoConfig.java            # Spring Security TextEncryptor bean (AES)
│   └── SecurityConfig.java          # OAuth2 login, session policy, route protection,
│                                      success/failure redirect handlers
│
├── controllers/
│   ├── AuthController.java          # GET /api/auth/login-url, GET /api/auth/me
│   ├── RepoController.java          # GET|POST /api/repos/**
│   └── ChatController.java          # POST|GET /api/chat/sessions/** (SSE streaming)
│
├── dto/                             # Java records — API request/response contracts
│   ├── UserResponse
│   ├── RepositoryResponse
│   ├── IndexStatusResponse
│   ├── CreateChatSessionRequest
│   ├── ChatSessionResponse
│   ├── ChatMessageRequest
│   ├── ChatMessageResponse
│   └── CitationDto
│
├── entity/                          # JPA entities — database tables
│   ├── User                         # users table
│   ├── Repository                   # repositories table
│   ├── IndexStatus                  # enum: PENDING | INDEXING | READY | FAILED
│   ├── ChatSession                  # chat_sessions table
│   ├── ChatMessage                  # chat_messages table (citations stored as JSON text)
│   └── MessageRole                  # enum: USER | ASSISTANT
│
├── repository/                      # Spring Data JPA interfaces
│   ├── UserRepository               # findByGithubId(Long)
│   ├── RepositoryRepository         # findByUserId*, findByIdAndUserId, upsert by githubRepoId
│   ├── ChatSessionRepository        # findByUserIdAndRepositoryIdOrderByCreatedAtDesc
│   └── ChatMessageRepository        # findBySessionIdOrderByCreatedAtAsc
│
├── security/
│   ├── AppUserPrincipal             # OAuth2User impl; wraps User entity + raw GitHub attributes
│   ├── CurrentUser                  # @Component; reads AppUserPrincipal from SecurityContext
│   └── GithubOAuth2UserService      # Custom OAuth2UserService; upserts User on login
│
├── services/
│   ├── UserServices                 # upsertFromGithub, decryptAccessToken, requiredById
│   ├── RepoService                  # syncAndListRepo (GitHub API → DB upsert), listStored,
│   │                                  requireOwned, status polling
│   ├── ChatService                  # createSession, listSessions, getMessages, streamReply
│   │
│   ├── github/
│   │   ├── GithubApiClient          # listUserRepos (paginated ≤1000), getRepoTree (recursive),
│   │   │                              getFileContent (Base64 decode)
│   │   └── GitHubRateLimiter        # Thread.sleep between file fetches (default 50 ms)
│   │
│   ├── indexing/
│   │   ├── IndexingService          # startIndexing (sync), @Async indexAsync, full doIndex pipeline
│   │   ├── CodeChunker              # Spring AI TokenTextSplitter; adds metadata per Document
│   │   └── CodeFileFilter           # Extension whitelist, skip-dir list, skip-filename list,
│   │                                  max size guard
│   │
│   └── ai/
│       ├── RagSettings              # Constants: TOP_K_CHUNKS=8, STREAM_TIMEOUT=3min, METADATA keys
│       ├── RetrievedContext         # record(List<CitationDto>, String contextText)
│       ├── CodeContextRetriever     # VectorStore.similaritySearch, citation mapping
│       ├── ChatPromptBuilder        # System + user prompt templates
│       ├── ChatStreamHandler        # SseEmitter, Spring AI ChatClient streaming, SSE event dispatch
│       └── CitationMapper           # Document metadata ↔ CitationDto; Jackson JSON serialization
│
└── exceptions/
    ├── NotFoundException            # → HTTP 404
    ├── BadRequestException          # → HTTP 400
    ├── UnauthorizedException        # → HTTP 401
    └── GlobalExceptionHandler       # @RestControllerAdvice; uniform {status, error, message, timestamp}
```

### Security & Authentication

GitAid uses **session-based OAuth 2.0** — not JWT. This is a deliberate choice: sessions are server-controlled (immediate invalidation on logout), more secure for web apps with a same-origin backend, and simpler to manage than token refresh cycles.

**Authentication flow:**

```
1. Browser → GET /oauth2/authorization/github
2. Spring Security redirects to:
   https://github.com/login/oauth/authorize?client_id=...&scope=read:user,repo
3. User approves → GitHub redirects to:
   /login/oauth2/code/github?code=...&state=...
4. Spring Security exchanges code → access token
5. GithubOAuth2UserService.loadUser():
   a. DefaultOAuth2UserService fetches GitHub user profile
   b. UserServices.upsertFromGithub():
      - Insert or update user row (matched by github_id)
      - AES-encrypt the GitHub access token → store in DB
   c. Returns AppUserPrincipal(user, githubAttributes)
6. On success → redirect to {frontendUrl}/auth/callback
7. On failure → redirect to {frontendUrl}/login?error=oauth_failed
```

**Session configuration:**
- Cookie name: `GITAID_SESSION`
- Timeout: 7 days
- `httpOnly: true` (XSS protection)
- `SameSite: Lax`
- Session creation policy: `IF_REQUIRED`
- Unauthenticated requests to `/api/**` → `401 Unauthorized` (no login redirect)

**Token security:** GitHub access tokens are never stored in plaintext. They are encrypted with Spring Security's `Encryptors.text(password, salt)` (AES-256) using a secret key injected from environment variables. Decryption happens in-memory only within `UserServices.decryptAccessToken()`, called only when a GitHub API request is actually needed.

### REST API Reference

#### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/auth/login-url` | Public | Returns `{"url": "/oauth2/authorization/github"}` |
| `GET` | `/api/auth/me` | Required | Returns current `UserResponse` |
| `POST` | `/api/auth/logout` | Required | Invalidates session, deletes `GITAID_SESSION` cookie → `204 No Content` |

#### Repositories — `/api/repos`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/repos?refresh=true\|false` | Required | List repos. `refresh=true` syncs from GitHub API first (upserts all repos). Returns array of `RepositoryResponse`. |
| `GET` | `/api/repos/{id}` | Required | Get single repository by UUID |
| `POST` | `/api/repos/{id}/index` | Required | Trigger async indexing → `202 Accepted` with `RepositoryResponse` (status = INDEXING) |
| `GET` | `/api/repos/{id}/status` | Required | Poll indexing progress → `IndexStatusResponse` |

#### Chat — `/api/chat`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chat/sessions` | Required | Create chat session for a READY repository. Body: `{repositoryId, title?}` |
| `GET` | `/api/chat/sessions?repositoryId={id}` | Required | List sessions for a repo (newest first) |
| `GET` | `/api/chat/sessions/{id}` | Required | Get all messages for a session (chronological) |
| `POST` | `/api/chat/sessions/{id}/messages` | Required | Send message; **returns `text/event-stream`** (SSE). Streams `user_message`, `token`×N, `assistant_message`, `done` events. |

**SSE event schema:**

```
event: user_message
data: { "id": "...", "role": "USER", "content": "...", "citations": [], "createdAt": "..." }

event: token
data: " partial"

event: assistant_message
data: { "id": "...", "role": "ASSISTANT", "content": "...", "citations": [...], "createdAt": "..." }

event: done
data: [DONE]
```

### Database Schema

GitAid uses PostgreSQL 16. Hibernate manages DDL (`ddl-auto: update`). The `pgvector` extension is bootstrapped via a Docker init script. Relationships are maintained by UUID foreign key columns — no JPA cascade annotations, avoiding n+1 issues.

```sql
-- users
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id       BIGINT UNIQUE NOT NULL,
    github_username VARCHAR NOT NULL,
    display_name    VARCHAR,
    avatar_url      VARCHAR,
    access_token    TEXT NOT NULL,        -- AES-256 encrypted
    token_scopes    VARCHAR,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- repositories
CREATE TABLE repositories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL,
    github_repo_id  BIGINT NOT NULL,
    owner           VARCHAR NOT NULL,
    name            VARCHAR NOT NULL,
    full_name       VARCHAR NOT NULL,
    is_private      BOOLEAN NOT NULL DEFAULT false,
    default_branch  VARCHAR NOT NULL DEFAULT 'main',
    language        VARCHAR,
    html_url        VARCHAR,
    description     TEXT,
    index_status    VARCHAR NOT NULL DEFAULT 'PENDING',  -- PENDING|INDEXING|READY|FAILED
    indexed_at      TIMESTAMPTZ,
    chunk_count     INT NOT NULL DEFAULT 0,
    files_total     INT NOT NULL DEFAULT 0,
    files_processed INT NOT NULL DEFAULT 0,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, github_repo_id)
);

-- chat_sessions
CREATE TABLE chat_sessions (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL,
    repository_id  UUID NOT NULL,
    title          VARCHAR NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- chat_messages
CREATE TABLE chat_messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id  UUID NOT NULL,
    role        VARCHAR NOT NULL,   -- USER | ASSISTANT
    content     TEXT NOT NULL,
    citations   TEXT,               -- JSON array of CitationDto
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- vector_store (auto-created by Spring AI pgvector)
-- Stores document chunks with 1536-dimensional embeddings
-- HNSW index on the embedding column, cosine distance
-- Metadata: repoId, filePath, language, chunkIndex
```

### Indexing Pipeline

The indexing pipeline is the most technically involved part of GitAid. It runs entirely in a background `ThreadPoolTaskExecutor` (thread prefix: `indexing-`, core 2, max 4, queue 50) so it never blocks the HTTP thread or the main Spring context.

**Stage 1: Kick-off (synchronous)**
`POST /api/repos/{id}/index` calls `startIndexing()` synchronously. This marks the repo `INDEXING`, resets all counters, and persists. The HTTP response returns `202 Accepted` immediately. The background task fires via `@Async`.

**Stage 2: File discovery**
`GithubApiClient.getRepoTree()` calls the GitHub Trees API with `?recursive=1`, returning every blob path, size, and type in the repository in a single request (GitHub's Git Trees API traverses the entire tree recursively).

**Stage 3: Filtering (`CodeFileFilter`)**
Each path is evaluated against:
- **Skip directories**: `node_modules`, `.git`, `dist`, `build`, `target`, `.next`, `vendor`, `__pycache__`, `.idea`, `.vscode`, `coverage`, `out`
- **Skip filenames**: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `composer.lock`, `cargo.lock`, `poetry.lock`
- **Skip hidden files**: paths starting with `.`
- **Size guard**: files over 100 KB (configurable) are skipped
- **Extension whitelist**: 40+ extensions across Java, Kotlin, Scala, TypeScript, JavaScript, Python, Go, Rust, Ruby, PHP, C/C++, C#, Swift, Markdown, YAML, JSON, TOML, XML, SQL, Shell, Dockerfile, HTML, CSS, Vue, Svelte, and more

**Stage 4: Chunking (`CodeChunker`)**
Each file is prefixed with `// File: {path}\n` before chunking so the LLM always has path context inside the chunk itself. Spring AI's `TokenTextSplitter` splits the text with `chunkSize=800` characters and `chunkOverlap=100` characters. Each resulting `Document` carries metadata:
- `repoId` — used as the filter key in vector search
- `filePath` — for citation rendering
- `language` — detected from file extension
- `chunkIndex` — position of this chunk within the file

**Stage 5: Embedding + storage**
Documents are accumulated in batches of 32 and flushed to the `VectorStore`. Spring AI transparently calls the OpenRouter embeddings API (`text-embedding-3-small`, 1536 dimensions) and inserts the result into pgvector's `vector_store` table. The HNSW index ensures sub-millisecond approximate nearest-neighbour lookups at query time.

**Stage 6: Progress tracking**
`updateProgress()` is called every 5 files and on completion. It is `@Transactional` — each call opens its own transaction so progress writes are visible to polling clients immediately (no long-running transactions holding locks).

**Failure handling:**
Any exception in the background thread calls `markFailed()`, which persists the error message (truncated to 2,000 characters) and sets the status to `FAILED`. The UI surfaces this with a retry button.

### RAG Chat Pipeline

The chat pipeline transforms a natural-language question into a grounded, codebase-specific answer using the **Retrieval-Augmented Generation** pattern.

```
Question
  │
  ├── 1. Persist USER message
  │
  ├── 2. Embed question → 1536d vector (text-embedding-3-small)
  │
  ├── 3. HNSW similarity search in pgvector
  │        filter: repoId = {this repository}
  │        topK:   8 chunks
  │
  ├── 4. Extract citations from Document metadata
  │        filePath, startLine, endLine, language
  │
  ├── 5. Join chunk texts as code context
  │
  ├── 6. Build prompts
  │        systemPrompt: domain-expert persona, context-only constraint
  │        userPrompt:   [code context block] + [question]
  │
  ├── 7. Stream to gpt-4o-mini via OpenRouter (Spring AI ChatClient)
  │        token events → SSE → frontend ReadableStream
  │
  └── 8. On completion:
           persist ASSISTANT message + citations JSON
           emit assistant_message SSE event
           emit done event
```

The `topK=8` and `STREAM_TIMEOUT=180_000 ms` (3 minutes) are constants in `RagSettings`. The system prompt explicitly instructs the model to answer **only from the provided context** and to say "I am unsure" if context is insufficient — preventing confabulation.

---

## Frontend Deep Dive

### App Router Structure

```
client/app/
├── layout.tsx                    # Root layout — QueryProvider + ThemeProvider + Google fonts
├── page.tsx                      # / — Landing page (hero, feature cards, GitHub CTA)
│
├── login/
│   └── page.tsx                  # /login — OAuth sign-in card; redirects to /dashboard if authed
│
├── auth/
│   └── callback/
│       └── page.tsx              # /auth/callback — post-OAuth redirect; calls /api/auth/me;
│                                   sets gitaid_auth=1 cookie; redirects to /dashboard
│
├── dashboard/
│   ├── page.tsx                  # /dashboard — RepoDashboard; repo grid with search, filter,
│   │                               status badges, index/chat actions; auto-polls while INDEXING
│   ├── overview/
│   │   └── page.tsx              # /dashboard/overview — stats cards (total repos, ready, chunks,
│   │                               needs-attention); list of recently indexed repos
│   └── settings/
│       └── page.tsx              # /dashboard/settings — profile card; dark mode toggle; logout
│
└── chat/
    └── [repoId]/
        └── page.tsx              # /chat/{repoId} — full chat interface; IndexingState if not READY;
                                    ChatSidebar + ChatMessages + ChatComposer when READY
```

**Route protection** is handled by Next.js Middleware (`proxy.ts`):
- `/dashboard/**` and `/chat/**` → requires `gitaid_auth=1` cookie → redirects to `/login?next={path}` if absent
- `/login` → redirects to `/dashboard` if already authenticated
- `/auth/callback` → always passes through

### State Management

There is no Redux, Zustand, or React Context for server state. **TanStack React Query v5** is the sole server state manager — it handles caching, background refetching, polling intervals, and optimistic updates.

**Query key hierarchy:**

```typescript
auth.me()                    → ["auth", "me"]
repos.list()                 → ["repos", "list"]
repos.detail(id)             → ["repos", "detail", id]
repos.status(id)             → ["repos", "status", id]
chat.sessions(repositoryId)  → ["chat", "sessions", repositoryId]
chat.messages(sessionId)     → ["chat", "messages", sessionId]
```

**Key hooks:**

| Hook | Behaviour |
|---|---|
| `useCurrentUser()` | Queries `/api/auth/me`. On success, sets `gitaid_auth=1` cookie (middleware guard). |
| `useLogout()` | Mutation → `POST /api/auth/logout` → clears cookie, invalidates auth queries, redirects to `/login`. |
| `useRepos()` | Queries `/api/repos?refresh=false`. If response is empty, auto-triggers a `refresh=true` call. Polls every 2 seconds while any repo has `INDEXING` status. |
| `useRepository(id)` | Single repo; polls every 2 seconds while `INDEXING`. |
| `useIndexStatus(id)` | Index progress; polls every 1.5 seconds while `INDEXING`. |
| `useStartIndexing()` | Mutation → `POST /api/repos/{id}/index`. |
| `useStreamChat(sessionId)` | SSE streaming state: `streaming`, `streamText`, `send()`, `stop()`. Manages optimistic updates, token accumulation, and abort controller. |

### Streaming SSE Client

`lib/stream-chat.ts` implements the SSE consumer without any library — raw `fetch` + `ReadableStream`:

```typescript
// Simplified view of the streaming logic
const res = await fetch(`${API}/api/chat/sessions/${id}/messages`, {
  method: "POST",
  credentials: "include",
  body: JSON.stringify({ content }),
});

const reader = res.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  // Parse SSE protocol: split on \n\n, extract event: and data: lines
  for (const eventBlock of parseSSE(decoder.decode(value))) {
    switch (eventBlock.name) {
      case "user_message":    onUserMessage(JSON.parse(eventBlock.data)); break;
      case "token":           onToken(JSON.parse(eventBlock.data)); break;
      case "assistant_message": onAssistantMessage(JSON.parse(eventBlock.data)); break;
      case "done":            onDone(); break;
    }
  }
}
```

The `useStreamChat` hook uses an `AbortController` to cancel the in-flight fetch when the user clicks the stop button, and manages the streamed token buffer (`streamText`) separately from the persisted message cache — the live typing animation uses `streamText`; once `assistant_message` arrives, the full message is committed to the React Query cache and `streamText` is cleared.

**Citation rendering (`CitationChips`):**  
Each citation from the server includes `filePath`, `startLine`, and `endLine`. The component constructs a GitHub deep link:
```
https://github.com/{owner}/{repo}/blob/{branch}/{filePath}#L{startLine}-L{endLine}
```
These render as clickable badges under each assistant message, opening the relevant code directly in the GitHub UI.

---

## Data Flows (End-to-End)

### 1. Authentication

```
User                     Frontend                  Backend                  GitHub
  │                         │                         │                       │
  ├─ clicks "Login" ────────►│                         │                       │
  │                         ├── window.location =     │                       │
  │                         │   /oauth2/authorization/github                  │
  │                         │                         ├── redirect ──────────►│
  │                         │                         │   (client_id, scope)  │
  │◄────────────────────────────────────────────────────── GitHub login UI ───┤
  ├─ approves ──────────────────────────────────────────────────────────────►│
  │                         │                         │◄── code + state ──────┤
  │                         │                         │                       │
  │                         │                         ├── exchange code       │
  │                         │                         │── upsert user ──┐     │
  │                         │                         │   encrypt token │     │
  │                         │                         │◄────────────────┘     │
  │                         │◄── redirect /auth/callback ────────────────────│
  │                         ├── GET /api/auth/me       │                       │
  │                         │◄── UserResponse ─────────┤                       │
  │                         ├── set cookie             │                       │
  │                         ├── redirect /dashboard    │                       │
```

### 2. Repository Indexing

```
User              Frontend (React Query)         Backend              GitHub API       pgvector
  │                       │                         │                     │               │
  ├─ click "Index" ───────►│                         │                     │               │
  │                       ├── POST /repos/{id}/index►│                     │               │
  │                       │◄── 202 {status:INDEXING} ┤                     │               │
  │                       │   (poll /status every 1.5s)                    │               │
  │                       │                         ├── @Async thread ─────┤               │
  │                       │                         │◄── repo tree ────────┤               │
  │                       │                         │                     │               │
  │                       │                         │  for each file:     │               │
  │                       │                         ├── GET /contents/{path}►│             │
  │                       │                         │◄── base64 content ──┤               │
  │                       │                         │                     │               │
  │                       │◄── {processed: N/total} ┤ (progress update)   │               │
  │                       │                         │                     │               │
  │                       │                         ├── embed chunks ─────────────────────►│
  │                       │                         │◄── vectors ──────────────────────────┤
  │                       │                         ├── INSERT into pgvector ──────────────►│
  │                       │                         │                     │               │
  │                       │◄── {status: READY} ─────┤                     │               │
  │◄─ chat button unlocks ─┤                         │                     │               │
```

### 3. Chat (RAG)

```
User        Frontend (useStreamChat)      Backend (SSE)         OpenRouter       pgvector
  │                  │                        │                     │               │
  ├─ types + sends ──►│                        │                     │               │
  │                  ├─ POST /sessions/{id}/messages ──────────────►│               │
  │                  │  (SSE response)         │                     │               │
  │                  │◄── event: user_message ─┤                     │               │
  │                  │                        ├── embed question ────►│               │
  │                  │                        │                     │               │
  │                  │                        ├── similarity search ─────────────────►│
  │                  │                        │◄── top-8 chunks ─────────────────────┤
  │                  │                        │                     │               │
  │                  │                        ├── build prompt      │               │
  │                  │                        ├── stream request ───►│               │
  │                  │◄── event: token ────────┤◄── token ───────────┤               │
  │◄─ typing effect ─┤◄── event: token ────────┤◄── token ───────────┤               │
  │                  │◄── ...                  │                     │               │
  │                  │◄── event: assistant_message (persist + citations)             │
  │                  │◄── event: done          │                     │               │
  │◄─ full reply + citations rendered          │                     │               │
```

---

## Getting Started

### Prerequisites

- **Java 17+**
- **Maven 3.9+**
- **Node.js 20+** (LTS)
- **Docker** + **Docker Compose** (for the database)
- A **GitHub OAuth App** ([create one here](https://github.com/settings/developers))
  - Homepage URL: `http://localhost:3000`
  - Authorization callback URL: `http://localhost:8080/login/oauth2/code/github`
- An **OpenRouter API key** ([openrouter.ai](https://openrouter.ai))

### Environment Variables

Create a `.env` file in the repository root:

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret

# OpenRouter (OpenAI-compatible)
OPENAI_API_KEY=your_openrouter_api_key

# Token encryption — change these in any non-local environment
TOKEN_ENCRYPTOR_PASSWORD=change-me-to-a-long-random-string
TOKEN_ENCRYPTOR_SALT=0123456789abcdef0123456789abcdef

# Database (defaults work with docker-compose)
DB_URL=jdbc:postgresql://localhost:5433/gitaid
DB_USERNAME=postgres
DB_PASSWORD=postgres

# URLs
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Create a `.env.local` file inside the `client/` directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### Running Locally

**1. Start the database**

```bash
docker compose up -d
```

This starts PostgreSQL 16 with the `pgvector`, `hstore`, and `uuid-ossp` extensions pre-installed on port `5433`.

**2. Start the backend**

```bash
cd backend
./mvnw spring-boot:run
```

The backend starts on `http://localhost:8080`. Spring JPA auto-creates all tables on first boot (`ddl-auto: update`).

**3. Start the frontend**

```bash
cd client
npm install
npm run dev
```

The frontend starts on `http://localhost:3000`.

**4. Open the app**

Navigate to `http://localhost:3000`, click **Continue with GitHub**, authorize the app, and you're in.

---

## Project Structure

```
gitaid/
├── backend/                        # Spring Boot application
│   ├── pom.xml
│   └── src/main/
│       ├── java/gitaid/backend/    # All Java source (see Package Structure above)
│       └── resources/
│           └── application.properties
│
├── client/                         # Next.js application
│   ├── package.json
│   ├── app/                        # App Router pages
│   ├── components/                 # Shared UI components (AppShell, ChatView, RepoCard, ...)
│   ├── hooks/                      # React Query hooks (use-auth, use-repos, use-chat, ...)
│   └── lib/                        # Utilities (api.ts, stream-chat.ts, query-keys.ts)
│
├── docker/
│   └── postgres/
│       └── init-extensions.sql     # Bootstraps pgvector, hstore, uuid-ossp
│
├── docker-compose.yml              # PostgreSQL 16 with pgvector
└── .env                            # Root environment variables (loaded by Spring Boot)
```

---

## Design Decisions

**Session-based auth over JWT** — Spring Session with a database-backed session cookie is simpler and more secure for a web-first app. Sessions can be immediately invalidated; there is no token refresh complexity; CSRF is manageable with SameSite cookies.

**OpenRouter instead of direct OpenAI** — OpenRouter acts as an OpenAI-compatible proxy that provides access to multiple model providers through a single API key and billing account, making it easy to swap models (`gpt-4o-mini` today, anything else tomorrow) without changing code.

**pgvector over a standalone vector DB** — Keeping vectors in PostgreSQL (with the pgvector extension) means one less infrastructure dependency. HNSW indexing gives millisecond query times for retrieval, and existing JPA/transaction semantics apply to vector data alongside relational data.

**RAG over fine-tuning** — Fine-tuning would bake in stale knowledge. RAG keeps the retrieval layer up to date: re-indexing a repository refreshes all vectors. The model never "knows" the codebase; it only sees what is explicitly retrieved per query.

**Spring AI** — Abstracts the LLM client, embedding client, and vector store behind interfaces. Swapping from OpenRouter to a local Ollama instance, or from pgvector to Chroma, requires only a configuration change — no application code changes.

**SSE over WebSockets** — Server-Sent Events are unidirectional (server → client), which is exactly the shape of a streaming LLM response. SSE is simpler to implement, works natively with `fetch`, and doesn't require a persistent bidirectional connection.

**No JPA cascade relations** — Entities reference each other by UUID foreign key columns only. This avoids accidental cascade deletes, eager-loading surprises, and Hibernate session scope confusion in async threads. Queries are explicit and predictable.

---

<div align="center">

Built with Spring Boot · Spring AI · pgvector · Next.js · TanStack Query

</div>
