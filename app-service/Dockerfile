# Stage 1: The "builder" stage
FROM python:3.12.3-slim AS builder

# Install build-time system dependencies.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install Python dependencies into the virtual environment.
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# Stage 2: The "final" production stage
FROM python:3.12.3-slim

# Set the working directory
WORKDIR /app/app-service

# --- The Magic of Multi-Stage Builds ---
COPY --from=builder /opt/venv /opt/venv

# Copy the application code from the build context into the container.
COPY . /app/app-service

# Set the PATH to include the virtual environment's bin directory,
ENV PATH="/opt/venv/bin:$PATH"

# Expose the application port
EXPOSE 5000

# Set the command to run the application.
CMD ["python", "app.py"]