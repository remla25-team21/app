# Stage 1: The "builder" stage (optional if not building anything)
FROM node:20-alpine AS builder

# You can include build steps here if needed

# Stage 2: The "final" production stage
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install 'serve' globally (this ensures all dependencies are included)
RUN npm install -g serve chalk 

# Copy static app files
COPY . .

# Copy entrypoint script and make it executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose the desired port
EXPOSE 3000

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Serve the static files
CMD ["serve", ".", "-l", "3000"]
