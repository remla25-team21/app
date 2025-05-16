# REMLA25 Team 21 – Frontend Application

This repository contains the backend service and frontend ui of the REMLA25 project developed by Team 21. The backend is built using Python and Flask, the frontend is developed using HTML, CSS and JavaScript and they are containerized using Docker for easy setup and deployment.

## ✅ Prerequisites

- Docker installed on your system ([Download Docker](https://www.docker.com/products/docker-desktop))
- For development mode: Python 3.10+ and Node.js 20+

## 🚀 Development

> [!NOTE]
> The instructions below will only run the frontend and backend services. The complete application requires the `model-service` container as well. For full application deployment, please refer to the [operation](https://github.com/remla25-team21/operation) repository.


**Clone the Repository**

```bash
git clone https://github.com/remla25-team21/app.git
cd app
```

### Running the Frontend

1. **Navigate to the frontend directory**

```bash
cd app-frontend
```

2. **Install a local server (if not already installed)**

```bash
npm install -g serve
```

3. **Serve the static files**

```bash
serve . -l 3000
```

4. **Access the frontend**

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running the Backend Service

1. **Navigate to the backend directory**

```bash
cd app-service
```

2. **Create and activate a virtual environment (optional but recommended)**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Run the Flask application**

```bash
python app.py
```

5. **Access the backend API**

The API will be available at [http://localhost:5000](http://localhost:5000) with documentation at [http://localhost:5000/apidocs/](http://localhost:5000/apidocs/)