# Deployment with Docker (Real-time Support)

This project has been configured for full real-time capabilities (WebSockets) using Docker and MongoDB. This is the recommended deployment method as it avoids the limitations of serverless environments like Vercel.

## Prerequisites

1.  **Docker Desktop** (or Docker Engine on Linux) installed and running.
2.  **Git** to clone/pull the repository.

## Setup & Running

1.  **Start the System**:
    Run the following command in the project root:
    ```bash
    docker-compose up --build
    ```
    *   This will build the Backend and Frontend images.
    *   Start a local MongoDB container.
    *   Connect everything automatically.

2.  **Access the Application**:
    *   **Frontend**: http://localhost (or http://YOUR_IP if accessing from network)
    *   **Backend API**: http://localhost/api (proxied via Nginx)

## Production Deployment (VPS/Cloud)

To deploy on a VPS (like DigitalOcean, AWS EC2, or Hetzner):

1.  **Server Setup**:
    *   Install Docker & Docker Compose on the server.
    *   Clone this repository to the server.

2.  **Environment Variables**:
    *   Create a `.env` file or set variables in `docker-compose.yml`:
        *   `JWT_SECRET`: Set a strong secret.
        *   `NODE_ENV`: Ensure it is `production`.

3.  **Run**:
    ```bash
    docker-compose up -d --build
    ```

## TroubleShooting

*   **Database Connection**: The backend waits for MongoDB to start. If it fails initially, it will restart automatically until connected.
*   **Rebuilding**: If you make code changes, run `docker-compose up --build` to apply them.
*   **Data Persistence**: Database data is stored in the `mongodb_data` Docker volume. It persists across restarts.
