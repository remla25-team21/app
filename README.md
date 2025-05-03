# REMLA25 Team 21 – Frontend Application

This repository contains the backend service and frontend ui of the REMLA25 project developed by Team 21. The backend is built using Python and Flask, the frontend is developed using HTML, CSS and JavaScript and they are containerized using Docker for easy setup and deployment.

## ✅ Prerequisites

- Docker installed on your system ([Download Docker](https://www.docker.com/products/docker-desktop))

## 🚀 How to Build and Run the Project

**Clone the Repository**

```bash
git clone https://github.com/remla25-team21/app.git
cd app
```
### Backend
1. **Navigate to app-service**
``` bash
cd app-service
```

2. **Build the Docker Image**
``` bash
docker build -t team21-backend . [Dont forget the "."]
```

3. Run the Container
```bash
docker run -p 5000:5000 team21-backend
```

### Frontend
1. **Navigate to app-frontend**
``` bash
cd app-frontend
```

2. **Build the Docker Image**
``` bash
docker build -t team21-frontend . [Dont forget the "."]
```

3. Run the Container
```bash
docker run -p 3000:3000 team21-frontend
```