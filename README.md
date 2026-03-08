<div align="center">
<img width="1200" height="475" alt="EntropyGuard Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# EntropyGuard 🛡️

**AI-Powered Industrial Safety & Compliance Supervisor**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?logo=react)](https://reactjs.org/)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?logo=google)](https://ai.google.dev/)

*Prevent mistakes before they happen — in real time.*

</div>

---

## 📖 About the Project

**EntropyGuard** is a high-stakes industrial compliance agent built by [Sasisundar2211](https://github.com/Sasisundar2211). It combines **computer vision**, **AI analysis**, and **audio feedback** to act as a real-time AI Safety Supervisor — watching your hands and comparing your actions against reference manuals (PDFs, images, or YouTube tutorials) to catch deviations before they escalate.

Whether you're in a manufacturing floor, a lab, or any procedure-driven environment, EntropyGuard keeps you compliant, step by step.

---

## ✨ Features

- 🎥 **Live Webcam Monitoring** — Real-time camera feed with AR overlay for drift warnings
- 📄 **Multi-format Knowledge Ingestion** — Upload PDF manuals, paste YouTube URLs, or provide image references
- 🤖 **Gemini AI Analysis** — Powered by Google Gemini for intelligent frame-by-frame compliance checking
- 🔊 **Audio Feedback** — Spoken alerts when deviations are detected
- 📋 **Auto-generated Task Checklists** — Automatically extracts step-by-step instructions from YouTube videos
- 🌍 **Multi-language Support** — Auto-detects and supports English, Spanish, German, Hindi, Chinese, French, Japanese
- 📊 **Compliance Reports** — Downloadable PDF reports of monitoring sessions
- 🔒 **Privacy Mode** — Simulation mode for testing without real AI calls
- ⚙️ **Calibration Wizard** — Guided workspace calibration before each session
- 🖥️ **Terminal Log** — Real-time event log with INFO, WARNING, ERROR, SUCCESS, and AI entries

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript |
| AI Backend | Google Gemini (`@google/genai`) |
| Styling | Tailwind CSS |
| Camera | `react-webcam` |
| Icons | `lucide-react` |
| PDF Export | `jspdf` |
| Bundler | Vite |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Google Gemini API Key](https://ai.google.dev/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sasisundar2211/Entropy_Guard.git
   cd Entropy_Guard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your API key**

   Create a `.env.local` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🎮 How to Use

1. **Launch** the app and click through the welcome tutorial.
2. **Ingest Knowledge** — Upload a PDF manual or paste a YouTube URL in the *Ingest* panel.
3. **Calibrate** — Follow the calibration wizard to define your workspace boundaries.
4. **Start Guard** — Click *Initialize Guard* to begin the AI safety loop.
5. **Work** — The AI supervisor monitors your actions in real time and alerts you on any drift.
6. **Report** — Download a full compliance report at the end of your session.

---

## 🤝 Contributing

Contributions are what make open source amazing! All contributions are **welcome and appreciated**. 🎉

### Ways to Contribute

- 🐛 **Report bugs** — Open an [issue](https://github.com/Sasisundar2211/Entropy_Guard/issues) with a clear description
- 💡 **Suggest features** — Share ideas via [GitHub Discussions](https://github.com/Sasisundar2211/Entropy_Guard/discussions)
- 🔧 **Submit Pull Requests** — Fix bugs, add features, or improve documentation

### How to Submit a Pull Request

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** your changes with a clear message
   ```bash
   git commit -m "feat: add your feature description"
   ```
4. **Push** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open** a Pull Request against the `main` branch

### Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Description |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code style / formatting |
| `refactor:` | Code restructuring |
| `chore:` | Maintenance tasks |

### Good First Issues

Look for issues labelled [`good first issue`](https://github.com/Sasisundar2211/Entropy_Guard/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — these are a great starting point for new contributors!

---

## 📁 Project Structure

```
Entropy_Guard/
├── App.tsx               # Root application component & state management
├── index.tsx             # Entry point
├── types.ts              # TypeScript types and enums
├── components/
│   ├── LandingScreen.tsx       # Splash / welcome screen
│   ├── CalibrationWizard.tsx   # Workspace calibration flow
│   ├── TutorialOverlay.tsx     # First-run tutorial
│   ├── SettingsModal.tsx       # API key & app settings
│   ├── ComplianceModal.tsx     # Compliance result display
│   ├── ReferenceViewer.tsx     # Reference material viewer
│   └── TerminalLog.tsx         # Real-time event log
├── services/
│   └── geminiService.ts        # Google Gemini AI integration
├── index.html
├── vite.config.ts
└── tsconfig.json
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this project for personal and commercial purposes.

---

## 🙏 Acknowledgements

- [Google Gemini](https://ai.google.dev/) for the powerful multimodal AI API
- [React Webcam](https://github.com/mozmorris/react-webcam) for camera integration
- [Lucide React](https://lucide.dev/) for the icon library
- [jsPDF](https://github.com/parallax/jsPDF) for PDF report generation
- All contributors who help make this project better ❤️

---

<div align="center">

**Made with ❤️ by [Sasisundar2211](https://github.com/Sasisundar2211)**

⭐ Star this repo if you find it useful!

</div>
