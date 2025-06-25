# REMLA25 Team 21 – Frontend Application

This repository contains the backend service and frontend UI of the REMLA25 project developed by Team 21. The backend is built using Python and Flask, the frontend is developed using HTML, CSS, and JavaScript and they are containerized using Docker for easy setup and deployment. 

## Prerequisites

- Docker installed on your system ([Download Docker](https://www.docker.com/products/docker-desktop))
- For development mode: Python 3.10+ and Node.js 20+

## Development

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

## Metrics and Monitoring

The app-service includes built-in Prometheus metrics for monitoring application performance and user behavior. These metrics are particularly useful for observability and measuring the effectiveness of the sentiment analysis model.

### Available Metrics

The following metrics are collected by the app-service:

- **sentiment_predictions_total**: Counter that tracks total predictions by sentiment (positive/negative/unknown)
- **sentiment_positive_ratio**: Gauge that shows the ratio of positive to total sentiments (0-1)
- **sentiment_prediction_latency_seconds**: Histogram tracking prediction response times
- **model_usage_total**: Counter tracking model usage by experiment variant (for A/B testing)
- **user_session_duration_seconds**: Histogram tracking user session duration
- **user_star_ratings**: Histogram tracking distribution of user satisfaction ratings on a 1-5 star scale

### Accessing Metrics

Metrics can be accessed in two ways:

1. **Prometheus Endpoint**:
   - Access raw metrics at [http://localhost:5000/metrics](http://localhost:5000/metrics) when running locally
   - In production, this endpoint is scraped by Prometheus

2. **Metrics Info Endpoint**:
   - More readable metrics metadata at [http://localhost:5000/metrics-info](http://localhost:5000/metrics-info)

For the full monitoring setup, please refer to the [helm folder in operations repository](https://github.com/remla25-team21/operation/tree/main/kubernetes/helm/sentiment-analysis#prometheus-monitoring). 
