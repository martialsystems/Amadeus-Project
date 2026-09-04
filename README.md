# Amadeus

## About Amadeus-Project

Amadeus is a Steins;Gate-inspired AI character assistant designed to feel less like a chatbot and more like a persistent virtual companion.

The project combines large language models, long-term conversational memory, customizable personalities, bilingual response generation, and neural voice synthesis into a single interactive system. Amadeus remembers previous conversations across sessions, maintains character context over time, and generates both English dialogue for the interface and natural Japanese speech for voice output.

The backend is built in Python and integrates configurable LLMs through OpenRouter, persistent SQLite-based memory, and GPT-SoVITS for character voice synthesis. The frontend is built with React, TypeScript, and Vite, with Live2D Cubism integration planned as the next major UI milestone.

Amadeus began as a small personal experiment inspired by Steins;Gate. Over time, it became a larger software project and a sandbox for experimenting with conversational AI, persistent memory, speech synthesis, character interaction, and long-running assistant behavior.

The project is still actively evolving. Rather than being a finished product, Amadeus is an ongoing attempt to explore what happens when an AI character is given memory, personality, voice, and continuity.

---

# Project Structure

```text
Amadeus-Project/
├── backend/
│   ├── main.py
│   ├── api.py
│   ├── chat.py
│   ├── memory.py
│   ├── llm.py
│   ├── tts.py
│   ├── start_gptsovits.py
│   ├── environment.yml
│   ├── requirements.in
│   ├── assets/
│   ├── data/
│   └── generated/
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── scripts/
│   └── launcher.py
│
├── GPT-SoVITS/
├── start_macos.command
├── start_windows.bat
├── README.md
└── .gitignore
```

The three main runtime components are:

```text
GPT-SoVITS        http://127.0.0.1:9872
Amadeus backend   http://127.0.0.1:5050
Amadeus WebUI     http://127.0.0.1:5173
```

---

# Installation

## 0. Requirements

Before installing Amadeus, make sure you have:

- Git
- Conda / Anaconda
- Node.js + npm
- Git LFS
- FFmpeg
- Python 3.10 for GPT-SoVITS
- Visual Studio Build Tools on Windows
- An NVIDIA GPU is strongly recommended for faster local voice synthesis, although CPU operation is possible

### Conda

Download Anaconda or Miniconda and make sure the `conda` command is available.

### Node.js

Install Node.js and npm. The WebUI requires Node.js.

### Windows

Install Visual Studio Build Tools if required by GPT-SoVITS or its dependencies.

---

## 1. Clone Amadeus

```bash
git clone https://github.com/reflectors02/Amadeus-Project.git
cd Amadeus-Project
```

Clone GPT-SoVITS inside the project directory:

```bash
git clone https://github.com/RVC-Boss/GPT-SoVITS.git
```

---

## 2. Create the Amadeus Backend Environment

From the repository root:

```bash
cd backend
conda env create -f environment.yml
```

Activate it:

```bash
conda activate amadeus
```

Return to the project root:

```bash
cd ..
```

The backend Python dependencies are tracked in:

```text
backend/requirements.in
```

---

## 3. Create the GPT-SoVITS Environment

```bash
cd GPT-SoVITS
conda create -n GPTSoVits python=3.10
conda activate GPTSoVits
```

Install GPT-SoVITS dependencies:

```bash
pip install -r extra-req.txt --no-deps
pip install -r requirements.txt
conda install ffmpeg
```

Return to the project root:

```bash
cd ..
```

---

## 4. Configure PyTorch

### NVIDIA GPU

For CUDA acceleration, install the CUDA-enabled PyTorch build appropriate for your system.

For example:

```bash
conda activate GPTSoVits
pip uninstall -y torch torchvision torchaudio
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### CPU Only

A CPU-only configuration is also possible:

```bash
conda activate GPTSoVits
pip uninstall -y torch torchvision torchaudio torchcodec
pip install torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 --index-url https://download.pytorch.org/whl/cpu
```

---

## 5. Download GPT-SoVITS Pretrained Models

Install Git LFS if necessary:

```bash
git lfs install
```

Clone the pretrained model repository somewhere temporary:

```bash
git clone https://huggingface.co/lj1995/GPT-SoVITS
```

Copy the required pretrained model files into:

```text
GPT-SoVITS/GPT_SoVITS/pretrained_models/
```

This directory should contain the pretrained GPT-SoVITS resources required by the installed GPT-SoVITS version.

---

## 6. Install Frontend Dependencies

The automatic launcher installs frontend dependencies if `frontend/node_modules/` is missing.

You can also install them manually:

```bash
cd frontend
npm install
cd ..
```

---

# Launching Amadeus

Amadeus uses a single launcher that starts the entire stack automatically.

The launcher:

1. Clears stale Amadeus processes from ports `9872`, `5050`, and `5173`.
2. Starts GPT-SoVITS in the `GPTSoVits` Conda environment.
3. Waits for the voice server to become available.
4. Starts the Flask backend in the `amadeus` environment.
5. Waits for the backend to become available.
6. Starts the React/Vite frontend.
7. Waits for the WebUI to become available.
8. Opens Amadeus automatically in the browser.
9. Shuts down all launcher-owned processes when the launcher exits.

Runtime logs are written locally to:

```text
.runtime/logs/
```

The `.runtime/` directory is ignored by Git.

---

## macOS

The first time you clone or copy the project, make the launcher executable:

```bash
chmod +x start_macos.command
```

Then either run:

```bash
./start_macos.command
```

or double-click:

```text
start_macos.command
```

in Finder.

The launcher will open Amadeus automatically once all services are ready.

Press `Ctrl+C` in the launcher terminal to shut down the complete Amadeus stack.

If Amadeus is launched again while stale development processes are still present, the launcher clears the Amadeus-owned ports before restarting the stack.

---

## Windows

Double-click:

```text
start_windows.bat
```

or run it from Command Prompt:

```bat
start_windows.bat
```

The Windows launcher performs the same startup sequence as the macOS launcher.

---

# Manual Startup

Manual startup is only intended for development or debugging.

## GPT-SoVITS

```bash
conda activate GPTSoVits
cd backend
python start_gptsovits.py
```

GPT-SoVITS normally listens on:

```text
http://127.0.0.1:9872
```

## Backend

```bash
conda activate amadeus
cd backend
python main.py
```

The backend listens on:

```text
http://127.0.0.1:5050
```

## Frontend

```bash
cd frontend
npm run dev
```

The frontend normally listens on:

```text
http://127.0.0.1:5173
```

---

# Updating Amadeus

Pull the latest project changes:

```bash
git pull origin main
```

## Update Backend Environment

```bash
conda activate amadeus
cd backend
conda env update -f environment.yml --prune
cd ..
```

## Update Frontend

```bash
cd frontend
npm install
cd ..
```

## Update GPT-SoVITS

Only update GPT-SoVITS when Amadeus is known to support the newer version:

```bash
cd GPT-SoVITS
git pull origin main
pip install -r requirements.txt
cd ..
```

---

# Runtime Data and Secrets

The following files are local runtime data and should not be committed:

```text
backend/data/api_key.txt
backend/data/memory.db
backend/generated/
.runtime/
frontend/node_modules/
```

The OpenRouter API key is stored locally in:

```text
backend/data/api_key.txt
```

Do not commit this file.

Conversation history is stored in:

```text
backend/data/memory.db
```

Deleting this file permanently removes the locally stored conversation history.

---

# Common Issues

## Launcher says a port is already in use

The current launcher automatically clears stale Amadeus listeners from:

```text
9872
5050
5173
```

If one of these ports cannot be cleared, inspect the service logs under:

```text
.runtime/logs/
```

The backend intentionally uses port `5050` rather than `5000` to avoid conflicts with macOS system services such as AirPlay/Control Center.

---

## macOS says `start_macos.command` cannot be executed

Make it executable:

```bash
chmod +x start_macos.command
```

Then try again.

---

## Amadeus cannot connect to the backend

Make sure the backend is available at:

```text
http://127.0.0.1:5050
```

---

## Amadeus has no voice

Make sure GPT-SoVITS is available at:

```text
http://127.0.0.1:9872
```

Also verify the required pretrained models exist under:

```text
GPT-SoVITS/GPT_SoVITS/pretrained_models/
```

---

## Frontend dependencies are missing

Run:

```bash
cd frontend
npm install
```

The automatic launcher also performs this step if `node_modules/` does not exist.

---

## Backend dependencies are missing or outdated

```bash
conda activate amadeus
cd backend
conda env update -f environment.yml --prune
```

---

## Resetting conversation memory

Back up the database first if you want to preserve the conversation history.

macOS/Linux:

```bash
rm backend/data/memory.db
```

Windows:

```bat
del backend\data\memory.db
```

Restart Amadeus afterward. A new database will be created automatically.

---

# Changelog

## Automatic Launcher + Project Reorganization — September 3, 2026

### Automatic Startup

Added cross-platform launchers:

```text
start_macos.command
start_windows.bat
```

Both use the shared:

```text
scripts/launcher.py
```

The launcher now starts GPT-SoVITS, the backend, and the WebUI automatically, waits for each service to become ready, opens the browser, writes runtime logs, and cleans up stale Amadeus processes during development restarts.

### Backend Port Change

The Flask backend moved from port `5000` to port `5050` to avoid macOS Control Center / AirPlay conflicts.

### Repository Cleanup

The repository now uses a clearer frontend/backend layout:

```text
backend/
frontend/
scripts/
```

Backend modules were renamed to describe their responsibilities directly:

```text
api.py
chat.py
memory.py
llm.py
tts.py
start_gptsovits.py
```

Runtime data, generated files, frontend dependencies, and secrets are excluded from source control.

---

## WebUI Migration — September 3, 2026

Development began on replacing the original Unity frontend with a React + TypeScript WebUI.

### Initial WebUI Features

- Conversation display
- Sending messages to the Flask backend
- Loading persistent conversation memory
- Runtime LLM model selection
- Conversation memory reset
- Backend connection/status display
- Responsive browser-based interface
- Dedicated viewport prepared for Live2D Cubism integration

The Python AI backend remains independent from the frontend, allowing the user interface to be replaced without rewriting the conversational core.

### Planned

- Live2D Cubism integration
- Browser-controlled voice playback
- Lip synchronization
- Character expressions and motions
- Improved settings interface
- Polished character animation system

---

## Model Control + Backend Stability — December 20, 2025

### Runtime LLM Model Switching

Added support for changing the active LLM model while Amadeus is running.

Users can enter a model name such as:

```text
deepseek/deepseek-chat-v3-0324
```

and apply it without restarting the backend.

### Current Model Display

The currently active LLM model can be queried through the backend and displayed by the frontend.

### Frontend ↔ Flask Model API

Implemented:

```text
/setLLMModel
/getCurrLLMModel
```

These endpoints provide the interface between the frontend and the Python backend.
