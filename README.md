# Amadeus
## About Amadeus-Project
Amadeus is a Steins;Gate-inspired AI character assistant designed to feel less like a chatbot and more like a persistent virtual companion.

The project combines large language models, long-term conversational memory, customizable personalities, bilingual response generation, and neural voice synthesis into a single interactive system. Amadeus remembers previous conversations across sessions, maintains character context over time, and generates both English dialogue for the interface and natural Japanese speech for voice output.

The backend is built in Python and integrates configurable LLMs through OpenRouter, persistent SQLite-based memory, and GPT-SoVITS for character voice synthesis. The system is designed modularly so that components such as the language model, memory system, voice pipeline, and user interface can be developed and replaced independently.

Amadeus began as a small personal experiment inspired by Steins;Gate. Over time, it became a much larger software project and a sandbox for experimenting with conversational AI, persistent memory, speech synthesis, character interaction, and real-time assistant behavior.

The project is still actively evolving. Rather than being a finished product, Amadeus is an ongoing attempt to explore what happens when an AI character is given memory, personality, voice, and continuity.

## Installation

> **Note:** Amadeus is currently transitioning from the old Unity frontend to a React-based WebUI.
> The installation instructions below use the new `backend/` + `Amadeus-WebUI/` structure.

### 0. Requirements

Before installing Amadeus, make sure you have:

* Git
* Conda / Anaconda
* Node.js + npm
* Git LFS
* FFmpeg
* Python 3.10 for GPT-SoVITS
* Visual Studio Build Tools on Windows
* An NVIDIA GPU is recommended for faster voice synthesis, but CPU operation is also supported.

#### Install Conda

Download Anaconda:

https://www.anaconda.com/

#### Install Node.js

Download Node.js:

https://nodejs.org/

Node.js is required for the Amadeus WebUI.

#### Windows Only: Install Visual Studio Build Tools

Download:

https://visualstudio.microsoft.com/downloads/

Scroll to **Tools for Visual Studio** and install **Build Tools for Visual Studio**.

> On Windows, using **Anaconda Prompt** is recommended when working with the Conda environments. PowerShell may cause Conda/environment issues depending on system configuration.

---

## 1. Clone Amadeus

Clone the repository:

```bash
git clone https://github.com/reflectors02/Amadeus-Project.git
cd Amadeus-Project
```

Now clone GPT-SoVITS inside the Amadeus repository:

```bash
git clone https://github.com/RVC-Boss/GPT-SoVITS.git
```

Your repository should now roughly look like this:

```text
Amadeus-Project/
├── backend/
│   ├── main.py
│   ├── app.py
│   ├── Amadeus.py
│   ├── Amadeus_memory.py
│   ├── AmadeusSpeak.py
│   ├── run_gptsovits.py
│   └── environment.yml
│
├── Amadeus-WebUI/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── GPT-SoVITS/
│   ├── requirements.txt
│   └── extra-req.txt
│
└── README.md
```

---

## 2. Create the Amadeus Backend Environment

From the repository root:

```bash
cd backend
conda env create -f environment.yml
```

Activate the environment:

```bash
conda activate amadeus
```

Then return to the repository root:

```bash
cd ..
```

---

## 3. Create the GPT-SoVITS Environment

Enter the GPT-SoVITS directory:

```bash
cd GPT-SoVITS
```

Create the environment:

```bash
conda create -n GPTSoVits python=3.10
conda activate GPTSoVits
```

Install GPT-SoVITS dependencies:

```bash
pip install -r extra-req.txt --no-deps
pip install -r requirements.txt
```

Install FFmpeg:

```bash
conda install ffmpeg
```

Return to the Amadeus project root when finished:

```bash
cd ..
```

---

## 4. Configure PyTorch

### NVIDIA GPU

If you have an NVIDIA GPU and want CUDA acceleration:

```bash
conda activate GPTSoVits
```

Remove the CPU-only PyTorch packages:

```bash
pip uninstall -y torch torchvision torchaudio
```

Install the CUDA-enabled versions:

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### CPU Only

If you do **not** have an NVIDIA GPU:

```bash
conda activate GPTSoVits
```

Remove the existing PyTorch installation:

```bash
pip uninstall -y torch torchvision torchaudio torchcodec
```

Install the known working CPU versions:

```bash
pip install torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 --index-url https://download.pytorch.org/whl/cpu
```

---

## 5. Download GPT-SoVITS Pretrained Models

This step requires Git LFS.

Install Git LFS if necessary:

```bash
git lfs install
```

Clone the pretrained model repository somewhere temporary:

```bash
git clone https://huggingface.co/lj1995/GPT-SoVITS
```

> This download is several gigabytes.

Copy the downloaded pretrained model files into:

```text
Amadeus-Project/
└── GPT-SoVITS/
    └── GPT_SoVITS/
        └── pretrained_models/
```

The directory should contain the GPT-SoVITS pretrained resources required by your installed GPT-SoVITS version.

For example:

```text
GPT-SoVITS/
└── GPT_SoVITS/
    └── pretrained_models/
        ├── chinese-hubert-base/
        ├── chinese-roberta-wwm-ext-large/
        ├── fast_langdetect/
        ├── gsv-v2final-pretrained/
        ├── gsv-v4-pretrained/
        ├── models--nvidia--bigvgan_v2_24khz_100band_256x/
        ├── s1bert25hz-2kh-longer-epoch.ckpt
        ├── s1v3.ckpt
        ├── s2D488k.pth
        ├── s2G488k.pth
        └── s2Gv3.pth
```

---

## 6. Install the Amadeus WebUI

From the Amadeus repository root:

```bash
cd Amadeus-WebUI
npm install
```

This installs the React/Vite frontend dependencies.

You only need to run `npm install` during the initial setup or when frontend dependencies change.

---

# Launching Amadeus

Amadeus currently consists of three processes:

```text
GPT-SoVITS
     ↓
Amadeus Flask Backend
     ↓
Amadeus WebUI
```

Until the automatic launcher is implemented, open **three terminal windows**.

---

## Terminal 1 — Start GPT-SoVITS

From the repository root:

```bash
conda activate GPTSoVits
cd backend
python run_gptsovits.py
```

Wait until GPT-SoVITS has finished starting.

The voice server normally runs at:

```text
http://127.0.0.1:9872
```

---

## Terminal 2 — Start the Amadeus Backend

Open another terminal:

```bash
conda activate amadeus
cd Amadeus-Project/backend
python main.py
```

The Flask backend should start on:

```text
http://127.0.0.1:5000
```

---

## Terminal 3 — Start the WebUI

Open another terminal:

```bash
cd Amadeus-Project/Amadeus-WebUI
npm run dev
```

Vite should display a local address similar to:

```text
http://localhost:5173
```

Open that address in your browser.

Amadeus should now be running.

---

# Updating Amadeus

Amadeus does not currently update automatically.

From the repository root:

```bash
git pull origin main
```

### Update the Backend Environment

```bash
conda activate amadeus
cd backend
conda env update -f environment.yml --prune
cd ..
```

### Update the WebUI

```bash
cd Amadeus-WebUI
npm install
cd ..
```

Running `npm install` again ensures any newly added frontend packages are installed.

### Update GPT-SoVITS

Only do this when Amadeus requires or supports a newer GPT-SoVITS version:

```bash
cd GPT-SoVITS
git pull origin main
pip install -r requirements.txt
cd ..
```

---

# Common Issues

### 1. Git says local changes would be overwritten

If you intentionally want to discard **all local code changes** and reset your repository to match GitHub:

```bash
git reset --hard origin/main
git pull origin main
```

> **Warning:** This permanently deletes uncommitted local changes.

---

### 2. Amadeus cannot connect to the backend

Make sure the Flask server is running:

```text
http://127.0.0.1:5000
```

The WebUI expects the backend on port `5000`.

---

### 3. Amadeus has no voice

Make sure GPT-SoVITS is running before sending a message.

The GPT-SoVITS server should normally be available at:

```text
http://127.0.0.1:9872
```

Also verify that the required pretrained models exist under:

```text
GPT-SoVITS/GPT_SoVITS/pretrained_models/
```

---

### 4. WebUI dependencies are missing

From:

```text
Amadeus-Project/Amadeus-WebUI/
```

run:

```bash
npm install
```

Then restart the WebUI:

```bash
npm run dev
```

---

### 5. Backend dependencies are missing or outdated

Run:

```bash
conda activate amadeus
cd backend
conda env update -f environment.yml --prune
```

---

### 6. GPT-SoVITS dependencies are missing

Run:

```bash
conda activate GPTSoVits
cd GPT-SoVITS
pip install -r requirements.txt
```

---

### 7. Resetting conversation memory

If a database/schema change causes Amadeus to fail after an update, you may need to reset the conversation database.

The database is located at:

```text
backend/txtfiles/memory.db
```

> **WARNING:** Deleting this file permanently deletes Amadeus's stored conversation memories. Back it up first if you want to preserve them.

macOS/Linux:

```bash
rm backend/txtfiles/memory.db
```

Windows:

```bat
del backend\txtfiles\memory.db
```

Restart the backend afterward. A new database will be created automatically.

---

## Planned Improvement: Automatic Startup

The current three-terminal startup process is temporary.

A future launcher will automatically:

1. Start GPT-SoVITS.
2. Wait for the voice server.
3. Start the Amadeus backend.
4. Wait for Flask.
5. Start the WebUI.
6. Open Amadeus automatically.
7. Shut down all services cleanly when Amadeus exits.

The eventual goal is for Amadeus to launch through a single command or application instead of requiring manual terminal setup.

---

# Changelog

## WebUI Migration — September 3, 2026

### New Frontend Architecture

Development has begun on replacing the original Unity frontend with a React + TypeScript WebUI.

The repository has been reorganized into separate frontend and backend components:

```text
backend/
Amadeus-WebUI/
GPT-SoVITS/
```

### Initial WebUI Features

The new WebUI currently supports:

* Conversation display
* Sending messages to the existing Flask backend
* Loading persistent conversation memory
* Runtime LLM model selection
* Conversation memory reset
* Backend connection/status display
* Responsive browser-based interface
* Dedicated viewport prepared for future Live2D Cubism integration

The Python AI backend remains largely independent from the frontend, allowing the Unity interface to be replaced without rewriting Amadeus's core conversational system.

### Planned

Upcoming WebUI work includes:

* Live2D Cubism integration
* Browser-controlled voice playback
* Lip synchronization
* Character expressions and motions
* Improved settings interface
* Automatic startup/launcher system

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

These endpoints provide a clean interface between the frontend and the Python backend.


