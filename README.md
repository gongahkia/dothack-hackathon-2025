# classroom.ai
This SMU DBTT AY2024/2025 T2

## Setting Up a Virtual Environment

This guide explains how to set up a Python virtual environment for both macOS and Windows.

### Prerequisites
- Install **Python (>=3.8, <=3.11.5)** from [Python's official website](https://www.python.org/downloads/)
- Install [pip](https://pip.pypa.io/en/stable/installation/)
- Ensure `pip` and `venv` are available in your system

**Check your Python version:**
```sh
python --version
```
If the output is outside the range **3.8 - 3.11.5**, install the correct version before proceeding.

---

## For macOS and Linux

### Step 1: Open a Terminal
Press `Command + Space` and search for "Terminal".

### Step 2: Navigate to the Project Directory
```sh
cd path/to/your/project
```

### Step 3: Create a Virtual Environment
```sh
python3 -m venv venv
```

### Step 4: Activate the Virtual Environment
```sh
source venv/bin/activate
```

You should see `(venv)` in your terminal, indicating the virtual environment is active.

### Step 5: Install Dependencies
```sh
pip install -r requirements.txt
```

---

## For Windows

### Step 1: Open Command Prompt or PowerShell
- Press `Win + R`, type `cmd`, and hit Enter.
- Alternatively, open PowerShell (`Win + X` → "Windows Terminal").

### Step 2: Navigate to the Project Directory
```cmd
cd path	o\your\project
```

### Step 3: Create a Virtual Environment
```cmd
python -m venv venv
```

### Step 4: Activate the Virtual Environment
For **Command Prompt**:
```cmd
venv\Scripts\activate
```

For **PowerShell** (if Command Prompt doesn't work):
```powershell
venv\Scripts\Activate.ps1
```

*Note:* If you get a security error in PowerShell, run:
```powershell
Set-ExecutionPolicy Unrestricted -Scope Process
```
and then retry activating the virtual environment.

### Step 5: Install Dependencies
```cmd
pip install -r requirements.txt
```

---

## Deactivating the Virtual Environment
To deactivate the virtual environment, simply run:
```sh
deactivate
```

---

## Running the Streamlit Frontend

Once you have set up the virtual environment and installed all dependencies, you can run the Streamlit frontend. Follow these steps:

### Step 1: Make Sure Backend is Running
Before running the frontend, ensure that the backend (`backend.py`) is running, as the frontend will send requests to it. Start the backend server with:
```sh
python backend.py
```
Ensure that it is listening on `http://127.0.0.1:5000`.

### Step 2: Run the Streamlit App
After the backend is running, open a new terminal window, navigate to the project directory, and run the Streamlit frontend with:
```sh
streamlit run frontend.py
```

This will start the Streamlit app and automatically open it in your default browser (usually at `http://localhost:8501`). If it doesn’t open, you can manually navigate to the provided URL.
```
