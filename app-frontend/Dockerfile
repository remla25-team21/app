# Stage 1: The "builder" stage
FROM node:20-alpine AS builder

# Install 'serve' globally inside this temporary stage
RUN npm install -g serve


# Stage 2: The "final" production stage
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy ONLY what we need from the 'builder' stage:
COPY --from=builder /usr/local/lib/node_modules/serve /usr/local/lib/node_modules/serve
COPY --from=builder /usr/local/bin/serve /usr/local/bin/serve

# Copy the application's static files (HTML, CSS, JS)
COPY . .

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh
# Make it executable
RUN chmod +x /entrypoint.sh

# Expose port 3000
EXPOSE 3000

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Use 'serve' to serve the static files. This command still works because
CMD ["serve", ".", "-l", "3000"]