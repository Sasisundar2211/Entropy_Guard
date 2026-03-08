# Contributing to EntropyGuard 🛡️

Thank you for your interest in contributing to **EntropyGuard**! We welcome contributions of all kinds — bug reports, feature requests, documentation improvements, and code changes.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Commit Message Convention](#commit-message-convention)
- [Development Setup](#development-setup)

---

## Code of Conduct

By participating in this project, you agree to be respectful and constructive. We are committed to fostering a welcoming environment for everyone, regardless of background or experience level.

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Entropy_Guard.git
   cd Entropy_Guard
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Create** your `.env.local` file with your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. **Start** the dev server:
   ```bash
   npm run dev
   ```

---

## How to Contribute

### Reporting Bugs

If you find a bug, please [open an issue](https://github.com/Sasisundar2211/Entropy_Guard/issues/new) and include:

- A clear and descriptive title
- Steps to reproduce the bug
- Expected vs. actual behaviour
- Screenshots or screen recordings (if applicable)
- Your OS, browser, and Node.js version

### Suggesting Features

Have an idea to improve EntropyGuard? [Open a feature request](https://github.com/Sasisundar2211/Entropy_Guard/issues/new) with:

- A clear description of the feature
- Why it would be valuable
- Any relevant examples or mockups

### Submitting Pull Requests

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes, keeping them focused and minimal.
3. Test your changes locally (`npm run dev`, `npm run build`).
4. Commit with a meaningful message (see convention below).
5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
6. Open a Pull Request against the `main` branch of this repository.

**PR Guidelines:**
- Keep PRs focused on a single concern.
- Reference any related issues (e.g., `Closes #42`).
- Include a clear description of what you changed and why.
- Add screenshots for UI changes.

---

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>
```

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting, whitespace (no logic changes) |
| `refactor` | Code change that's neither a fix nor a feature |
| `perf` | Performance improvement |
| `chore` | Build process, dependency updates, tooling |

**Examples:**
```
feat: add PDF export for compliance reports
fix: resolve webcam freeze on Firefox
docs: update contributing guide
```

---

## Development Setup

| Command | Description |
|---|---|
| `npm install` | Install all dependencies |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |

---

Thank you for helping make EntropyGuard better! 🙌
