# Use an official Node.js image for serving static files
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the HTML, CSS, and JS files into the container
COPY . /app/

# Install 'serve' globally to serve the static files
RUN npm install -g serve

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh
# Make it executable
RUN chmod +x /entrypoint.sh

# Expose port 3000 (the port your app will run on)
EXPOSE 3000

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Use 'serve' to serve the static files from the current directory
CMD ["serve", ".", "-l", "3000"]
