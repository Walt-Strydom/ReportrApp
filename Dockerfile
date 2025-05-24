# Use Node.js LTS as base image
FROM node:20-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json/yarn.lock
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose port 5000 (matching your server configuration)
EXPOSE 5000

# Set NODE_ENV environment variable
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "dist/index.js"]