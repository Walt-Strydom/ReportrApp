# Reportr

Reportr is a civic engagement progressive web application that enables citizens to anonymously report and track public infrastructure issues in Pretoria, South Africa, with advanced geospatial tracking and comprehensive mobile support.

## Features

- Anonymous issue reporting system
- Geospatial tracking of infrastructure problems
- Support existing issues to increase their priority
- Mobile-first design with PWA capabilities
- Offline functionality with background synchronization
- Multi-language support for all 11 official South African languages
- Detailed email notifications to municipal officials

## Docker Deployment

The application is containerized and can be easily deployed using Docker and Docker Compose.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
RESEND_API_KEY=your_resend_api_key
```

### Running the Application

To start the application and its dependencies:

```bash
docker-compose up -d
```

This will:
1. Build the Docker image for the application
2. Start a PostgreSQL database container
3. Start the application container
4. Make the application available at http://localhost:5000

### Stopping the Application

To stop the application:

```bash
docker-compose down
```

To stop the application and remove all data (including the database):

```bash
docker-compose down -v
```

## Development Setup

For local development without Docker:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file with the required variables (see above).

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The application will be available at http://localhost:5000

## Building for Production

To build the application for production:

```bash
npm run build
```

## License

[MIT](LICENSE)