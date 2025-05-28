# Simple single-stage build for Elastic Beanstalk
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies and build
RUN npm install && npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]