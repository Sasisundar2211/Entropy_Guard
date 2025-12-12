# 🛡️ EntropyGuard: The Thermodynamic Operating System

[![Built with Gemini 3](https://img.shields.io/badge/Built%20with-Gemini%203%20Pro-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Vibe Coding](https://img.shields.io/badge/Vibe%20Coding-Google%20AI%20Studio-FF6F00?style=for-the-badge)](https://aistudio.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](./LICENSE)

> **Winner/Entrant for the Google DeepMind "Vibe Code" Competition 2025**

**EntropyGuard** is a multimodal "Reality Supervisor." It bridges the dangerous gap between static documentation (PDFs, Manuals) and dynamic reality. By turning a simple webcam into an intelligent agent, it enforces compliance, prevents accidents, and democratizes technical expertise in real-time.

---

## 🚧 The Problem: "Process Drift"
The physical world suffers from entropy. Whether it's a technician cutting the wrong wire, a student struggling with a kit, or a senior taking the wrong medication, mistakes happen when humans drift from the instructions. Static manuals cannot correct dynamic errors.

## 💡 The Solution
EntropyGuard uses **Gemini 3 Pro's** advanced reasoning and native multimodality to:
1.  **See** the physical world via webcam.
2.  **Read** the technical manual (PDF/SOP).
3.  **Reason** about the variance ("Drift") between the two.
4.  **Intervene** instantly with AR overlays and voice guidance.

---

## ✨ Key Features

### 👻 Ghost Alignment (AR)
Projects a semi-transparent "Golden Sample" overlay onto the live video feed. This acts as a visual "jig," allowing users to align tools and components perfectly with the schematic.

### 🚨 Active Drift Detection
The core "Safety Engine." It monitors user actions in real-time. If a hand moves toward a hazardous zone or grabs the wrong component, the system triggers:
* **Visual:** Red "CRITICAL DRIFT" bounding boxes.
* **Audio:** Text-to-Speech warnings ("Stop. Wrong Polarity.").
* **Haptic:** Device vibration for noisy environments.

### 🗣️ Context-Aware Babel Protocol
Detects the user's spoken language using **visual cues** (e.g., reading a warning sign in the background to bias the language model). Instantly translates technical expertise from English manuals into the worker's native tongue.

### 🧠 Neural SOP Engine (YouTube-to-Manual)
Solves the "Missing Manual" problem. Paste any YouTube tutorial URL, and EntropyGuard:
* Watches the video.
* Extracts "Golden Frame" screenshots.
* Generates a step-by-step interactive safety protocol automatically.

---

## 🏗️ Architecture

EntropyGuard was built using **Vibe Coding** in Google AI Studio.

* **Brain:** [Google Gemini 3 Pro](https://deepmind.google/technologies/gemini/) (Multimodal Vision + Reasoning).
* **Frontend:** React.js + Tailwind CSS (Generated via Vibe Code).
* **Perception:** `react-webcam` + HTML5 Canvas (AR Overlays).
* **Input:** Web Speech API (Voice Command) + Drag-and-Drop (PDF/Video Analysis).

---

## 🚀 Getting Started

### Prerequisites
* Node.js v18+
* A Google Gemini API Key (Get it [here](https://aistudio.google.com/))

### Installation

1.  **Clone the repo**
    ```bash
    git clone [https://github.com/yourusername/entropy-guard.git](https://github.com/yourusername/entropy-guard.git)
    cd entropy-guard
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Key**
    Create a `.env` file in the root directory:
    ```bash
    REACT_APP_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the App**
    ```bash
    npm start
    ```

---

## 🎮 Usage Guide

1.  **Select Mode:** Choose **Work** (Industrial), **Learn** (Education), or **Care** (Accessibility) from the top toggle.
2.  **Load Standard:** Upload a PDF schematic OR paste a YouTube URL to generate a protocol.
3.  **Scan Environment:** Point camera at workspace to verify tools.
4.  **Arm System:** Click **"INITIATE COMPLIANCE CHECK"**. The system is now watching.
5.  **Work:** Perform your task. If you make a mistake, EntropyGuard will stop you.

---

## 🤝 Contributing
Contributions are welcome! Please read `CONTRIBUTING.md` for details on our code of conduct and the process for submitting pull requests.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

<div align="center">
  <sub>Built with ❤️ and ☕ by [Your Name] using Google AI Studio.</sub>
</div>
