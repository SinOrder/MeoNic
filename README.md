# Meonic | Academic Assessment Platform (PWA)

Meonic is an offline-capable, local-first Progressive Web App (PWA) engineered for university-level technical assessments, circuit design exams, and digital logic quizzes.

---

## Key Features

1. **Progressive Web App (PWA) & Local-First Resilience:**
   - Pre-cached application shell, Workbox service worker (`/dist/sw.js`), and WebAssembly/Web Worker runtimes.
   - Continuous 500ms debounced autosave to browser **`IndexedDB`** (via Dexie.js) to guarantee zero loss of student work during Wi-Fi drops or session reloads.

2. **Native Technical Rendering & Interactive Logic Widgets:**
   - **Schematex:** Built-in editor with live native SVG circuit schematic viewer (resistors, capacitors, op-amps, logic gates, voltage sources, ground).
   - **Mermaid.js:** Dynamic SVG rendering for flowcharts, sequence diagrams, and state machines with dark-mode styling and syntax validation.
   - **Interactive Karnaugh Map (K-Map) Engine:** 2D interactive grid supporting 2, 3, and 4 variables (up to 4x4) with auto-enforced Gray code ordering (`00`, `01`, `11`, `10`), clickable cell state cycling (`0` &rarr; `1` &rarr; `X`), Shift+Click toroidal multi-cell grouping with high-contrast color overlays, and minimal SOP/POS expression validation.
   - **Binary Arithmetic Columnar Scratchpad:** Monospaced, vertically aligned bit-column scratchpad with carry/borrow row, sign bit distinction, two's complement overflow detection, and carry-out verification.

3. **Composite Multi-Part Question Engine (7 Core Types):**
   - `multiple_choice` (Single or multi-select with negative penalty mitigation)
   - `descriptive` (Free-form essay with concept coverage checking)
   - `numerical` (Numeric value with absolute or percentage tolerance margins)
   - `schematics` (Schematex syntax + live vector canvas)
   - `diagrams` (Mermaid.js syntax + live diagram preview)
   - `binary_arithmetic` (Bit operands, carry rows, and overflow flags)
   - `karnaugh_map` (Interactive Gray-code grid, toroidal loops, and SOP equations)

4. **Dual-Mode Authentication & Multi-LMS Account Linking:**
   - Standalone personal credentials + LTI 1.3 / OAuth2 Single Sign-On (targeting **Canvas LMS** and **Blackboard**).
   - Multi-LMS profile linking allows linking personal accounts to university rosters.
   - Dynamic course-gated access mode (`LMS_GATED` vs `DIRECT`).

5. **Cloud Portability & Draft Interchange:**
   - Export and import self-contained `.schemexam.json` assignment drafts across computers.
   - Direct backup and sync with Google Drive using the least-privilege `drive.file` scope.

6. **Hybrid Deterministic / AI Grading Pipeline:**
   - **Deterministic (0 Token Cost):** Instant evaluation of Multiple Choice, Numerical tolerance, and exact bitmask matching.
   - **AI Semantic & Syntax Evaluation (`gemini-3.8-flash`):**
     - Evaluates Schematex circuit netlists and Mermaid diagrams based on topological/isomorphic equivalence rather than cosmetic formatting.
     - Performs ripple-carry propagation analysis from LSB to MSB in binary arithmetic, isolating single-bit errors and awarding partial credit if subsequent carry logic was executed consistently.
     - Validates K-Map groupings for power-of-two rectangular geometry on a torus, detects redundant prime implicants, and checks algebraic SOP equivalence.
   - **Automated Late Penalty Calculation:** Applies configurable deduction rates, interval decay, grace periods, and penalty caps.
   - **LTI AGS 2.0 Passback:** Simulates automated grade passback to the connected Canvas Gradebook line item.

---

## Getting Started

### 1. Development Server
Run the local Vite development server with HMR:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 2. Production Build
Typecheck and bundle for production:
```bash
npm run build
```

### 3. Production Preview
Preview the production PWA bundle:
```bash
npm run preview
```

---

## Project Structure

```
Meonic/
├── dist/                      # Production PWA build artifacts + Service Worker
├── public/
│   └── favicon.svg            # Custom SVG circuit branding icon
├── src/
│   ├── components/
│   │   ├── authoring/         # Instructor dashboard & assignment modal
│   │   ├── binary/            # Columnar binary arithmetic scratchpad
│   │   ├── diagrams/          # Mermaid.js code editor & SVG renderer
│   │   ├── kmap/              # Interactive 4-variable Gray code K-Map
│   │   ├── layout/            # Top navigation header & portability toolbar
│   │   ├── lms/               # Dual-mode auth & Canvas account linking
│   │   ├── schematex/         # Schematex netlist editor & vector canvas
│   │   └── student/           # Student assessment portal & grade modal
│   ├── db/
│   │   └── dexieDb.ts         # Dexie IndexedDB models & seed dataset
│   ├── engines/
│   │   ├── aiGradingService.ts# Gemini 3.8 Flash & symbolic grading engine
│   │   ├── binaryEngine.ts    # Ripple carry analysis & overflow logic
│   │   ├── deterministicGrader.ts # MCQ & Numerical tolerance evaluation
│   │   ├── kmapEngine.ts      # Toroidal geometry, Gray code, & prime implicants
│   │   ├── latePenaltyCalculator.ts # Configurable interval deduction engine
│   │   ├── mermaidEngine.ts   # Mermaid initialization & sanitization
│   │   └── schematexEngine.ts # Netlist parser & circuit component graph
│   ├── types/                 # TypeScript interfaces for all assessment schemas
│   ├── App.tsx                # Master state controller & view router
│   ├── index.css              # Tailwind CSS v4 directives & styling
│   ├── main.tsx               # Application mounting & PWA registration
│   └── vite-env.d.ts          # Vite client definitions
├── package.json
├── tsconfig.json
└── vite.config.ts             # Vite configuration with Tailwind v4 & PWA plugin
```
