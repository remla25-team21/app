FROM python:3.12.3-slim

RUN apt-get update && apt-get install -y \
    libjpeg-dev \
    git

WORKDIR /app/app-service

# Download Python dependencies from txt file
COPY requirements.txt /app/app-service/
RUN pip install -r /app/app-service/requirements.txt

# Copy the entire `app-service` directory into the container
COPY . /app/app-service

EXPOSE 5000

CMD ["python", "app.py"]
