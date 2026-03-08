<div align="center">
<img width="1200" height="475" alt="EntropyGuard Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# EntropyGuard V2.0

**The AI Safety Supervisor that watches your hands, reads the manual, and stops mistakes _before_ they happen.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)

</div>

---

## Overview

EntropyGuard is a high-stakes **industrial compliance agent** that combines **computer vision**, **AI analysis**, and **audio feedback** to prevent procedural errors in real time. It monitors a live camera feed, compares it against a reference manual (PDF, image, or YouTube tutorial), and immediately alerts operators when their actions deviate from the prescribed procedure — before a mistake becomes an incident.

> View the live demo on AI Studio: https://ai.studio/apps/drive/1m0aqroCwpyU2lDysgrfjwTe8HL_NQXrY

---

## ✨ Features

| Feature | Description |
|---|---|
| 📸 **Live Camera Monitoring** | Real-time webcam feed with AR-style overlay warnings projected directly onto the workspace |
| 📄 **PDF Manual Ingestion** | Upload a PDF reference manual; the AI validates your actions against it frame-by-frame |
| 🎬 **YouTube Tutorial Ingestion** | Paste a YouTube URL to auto-generate a timestamped step-by-step checklist |
| 🤖 **Google Gemini AI Analysis** | Powered by the Gemini Vision API to detect compliance drift with confidence scores |
| 🎙️ **Voice Commands** | Hands-free control — say "next", "stop", or "reset" while working |
| ⌨️ **Keyboard Calibration** | Fine-tune the AR overlay position in real time with arrow keys |
| 📊 **Compliance Reports** | Generate and download PDF session reports with full telemetry logs |
| 🔒 **Calibration Wizard** | Guided workspace calibration to align the AI's field of view before monitoring begins |
| 🌐 **Multi-language Support** | Auto-detects language or choose from English, Spanish, German, French, Hindi, Japanese, and Chinese |
| 🎭 **Simulation Mode** | Full offline demo mode — no API key or camera required to evaluate the system |
| 🔐 **Privacy Engine** | Toggle between Simulation (no data sent) and Real AI (live Gemini processing) |
| 📋 **Live Telemetry Log** | Real-time terminal-style system log with color-coded INFO / WARNING / ERROR / AI events |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Frontend)                      │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │  Webcam Feed │ → │  App.tsx     │ → │ Gemini Service │  │
│  │ (react-      │   │  (Orchestr-  │   │ (API calls to  │  │
│  │  webcam)     │   │   ator)      │   │  Python backend│  │
│  └──────────────┘   └──────┬───────┘   └───────┬────────┘  │
│                             │                    │           │
│  ┌──────────────────────────▼────────────────────▼───────┐  │
│  │            Components                                  │  │
│  │  LandingScreen · CalibrationWizard · TerminalLog      │  │
│  │  ComplianceModal · ReferenceViewer · SettingsModal    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP (localhost:8000)
┌──────────────────────────────▼──────────────────────────────┐
│                    Python Backend (FastAPI)                   │
│                                                              │
│   POST /api/analyze         → Gemini Vision analysis         │
│   POST /api/ingest-youtube  → YouTube transcript → steps     │
└──────────────────────────────────────────────────────────────┘
```

**Data Flow during Monitoring:**
1. A webcam frame is captured every few seconds as a Base64 image.
2. The frame + reference data (PDF/image/text) are sent to the FastAPI backend.
3. The backend calls **Google Gemini** to compare the live frame against the reference.
4. The result (MATCH / DRIFT, severity, bounding box) is returned and rendered as an AR overlay.
5. If DRIFT is detected, an audible alert fires and the telemetry log is updated.

---

## 🛠️ Tech Stack

### Frontend
| Library | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 6 | Dev server & bundler |
| Tailwind CSS | (via CDN) | Styling |
| react-webcam | 7.2 | Camera access |
| lucide-react | 0.559 | Icons |
| jspdf | 2.5 | PDF report generation |
| @google/genai | 1.33 | Gemini SDK |

### Backend
| Library | Version | Purpose |
|---|---|---|
| FastAPI | 0.109 | REST API server |
| uvicorn | 0.27 | ASGI server |
| google-generativeai | 0.3 | Gemini API client |
| youtube-transcript-api | 0.6 | YouTube step extraction |
| Pillow | 10.2 | Image processing |
| pydantic | 2.6 | Request validation |

---

## 📋 Prerequisites

- **Node.js** v18 or later
- **Python** 3.10 or later
- A **Google Gemini API key** — get one free at [ai.google.dev](https://ai.google.dev/)
- A webcam (required for live monitoring; optional in Simulation Mode)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Sasisundar2211/Entropy_Guard.git
cd Entropy_Guard
```

### 2. Start the Frontend

```bash
# Install dependencies
npm install

# Create your local environment file
cp .env.local.example .env.local   # or create .env.local manually

# Add your Gemini API key to .env.local
# GEMINI_API_KEY=your_key_here

# Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**

### 3. Start the Backend (optional — required for Real AI mode)

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

The backend API will be available at **http://localhost:8000**

> **Note:** If the backend is not running, the app automatically falls back to **Simulation Mode**, so you can still explore all UI features without a Python environment.

---

## ⚙️ Configuration

All settings are accessible via the **⚙️ Settings** button in the top-right corner of the dashboard.

| Setting | Description |
|---|---|
| **Gemini API Key** | Your Google Gemini API key. Leave empty to use Simulation Mode. |
| **Privacy Engine** | **Simulation** — no data leaves your browser. **Real AI** — live frames are sent to Gemini for analysis. |
| **Language** | Set the language for AI feedback. Defaults to auto-detection. |

---

## 🎮 Voice Commands

When monitoring is active, the system listens for these spoken commands:

| Command | Action |
|---|---|
| `"next"` | Advance to the next step in the task checklist |
| `"stop"` | Stop monitoring and generate a compliance report |
| `"reset"` | Reset the AR overlay calibration to default position |

---

## ⌨️ Keyboard Shortcuts

During monitoring, use these keys to fine-tune the AR overlay alignment in real time:

| Key | Action |
|---|---|
| `↑ ↓ ← →` | Move the overlay 2 px in that direction |
| `Shift + ↑ ↓ ← →` | Move the overlay 10 px (fast mode) |
| `[` | Rotate the overlay counter-clockwise |
| `]` | Rotate the overlay clockwise |

---

## 📁 Project Structure

```
Entropy_Guard/
├── App.tsx                  # Root component & main state orchestrator
├── index.tsx                # React entry point
├── index.html               # HTML shell
├── types.ts                 # Shared TypeScript type definitions
├── metadata.json            # App metadata (name, permissions)
├── vite.config.ts           # Vite build configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Frontend dependencies
│
├── components/
│   ├── LandingScreen.tsx    # Animated splash / welcome screen
│   ├── CalibrationWizard.tsx# Guided workspace calibration overlay
│   ├── TutorialOverlay.tsx  # First-run interactive onboarding
│   ├── TerminalLog.tsx      # Live color-coded telemetry log
│   ├── ComplianceModal.tsx  # Session compliance report modal
│   ├── ReferenceViewer.tsx  # PDF / image reference panel
│   └── SettingsModal.tsx    # API key, privacy & language config
│
├── services/
│   └── geminiService.ts     # API calls to backend (analyze + ingest)
│
└── backend/
    ├── main.py              # FastAPI app with /analyze and /ingest-youtube
    └── requirements.txt     # Python dependencies
```

---

## 🔄 App States

The application moves through these states in sequence:

```
SPLASH → DASHBOARD → CALIBRATION → MONITORING → REPORT
```

| State | Description |
|---|---|
| `SPLASH` | Animated landing screen |
| `DASHBOARD` | Main control panel — ingest reference, configure settings |
| `CALIBRATION` | Guided wizard to align workspace before monitoring |
| `MONITORING` | Live AI compliance loop with real-time AR overlay |
| `REPORT` | Session summary with downloadable PDF report |

---

## 🤝 Contributing

Contributions are welcome! Please open an issue to discuss any major changes before submitting a pull request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

---

## 📄 License

This project is open source. See the repository for license details.

