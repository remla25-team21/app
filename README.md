# REMLA25 Team 21 – Frontend Application

This repository contains the backend service and frontend ui of the REMLA25 project developed by Team 21. The backend is built using Python and Flask, the frontend is developed using HTML, CSS and JavaScript and they are containerized using Docker for easy setup and deployment.

## ✅ Prerequisites

- Docker installed on your system ([Download Docker](https://www.docker.com/products/docker-desktop))

## 🚀 How to Build and Run the Project

1. **Clone the Repository**

```bash
git clone https://github.com/remla25-team21/app.git
cd app
```

2. **Build and Run with Docker Compose**

Docker Compose will build two services (from two docker images):
- Frontend service (running on port 3000)
- Backend service (running on port 5000)
``` bash
docker-compose up --build
```

3. **Now run the app**

The frontend should run on (http://localhost:3000/)
The backend can be accessed on (http://localhost:5000/apidocs/)