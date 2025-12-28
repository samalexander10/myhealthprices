# MyHealthPrices

MyHealthPrices is a full-stack web application designed to provide transparency in drug pricing. It allows users to search for medications, view nationwide average prices, and compare state-specific pricing data derived from Medicaid utilization records.

## Features

-   **Fast Drug Search**: Real-time, debounced search for drugs by name or NDC.
-   **Nationwide Pricing Summary**: Displays average, minimum, and maximum prices across all reporting states.
-   **State-Specific Filtering**: Allows users to select specific states to compare local pricing against the national average.
-   **Interactive Dashboard**: dynamic cards showing price breakdowns and trends.
-   **Data Import Pipeline**: Automated ingestion and optimization of large CMS Medicaid drug utilization datasets.

## Architecture & Design

### Microfrontend Design
The frontend is built using a **Microfrontend Architecture** powered by **Vite Module Federation**.
-   **Host/Remote**: The main application serves as a host that can consume remote modules or be consumed itself.
-   **Scalability**: Allows independent development and deployment of different functional areas (e.g., search, dashboards) in the future.
-   **Composition**: Components like `DrugDashboard` and `SearchBar` are designed to be loosely coupled and reusable.

### Backend: Spring Boot Reactive
The backend is a **Reactive** system built with **Spring WebFlux**.
-   **Non-Blocking I/O**: Designed to handle high concurrency and large data streams efficiently.
-   **Data Aggregation**: Uses MongoDB Aggregation Framework pipelines to pre-calculate summaries and optimize read performance.

## Technology Stack

### Frontend
-   **Framework**: React 18
-   **Build Tool**: Vite
-   **Language**: JavaScript (ES6+)
-   **Styling**: SCSS (Sass)
-   **Testing**: Playwright (End-to-End)

### Backend
-   **Framework**: Spring Boot 3.3.4 (WebFlux)
-   **Language**: Java 21
-   **Database Access**: Spring Data Reactive MongoDB
-   **Testing**: JUnit 5, Mockito, Flapdoodle Embedded MongoDB

### Database
-   **Local Development**: MongoDB (Local, Docker, or Embedded) OR MongoDB Atlas (Remote)
-   **Production (Future)**: MongoDB Atlas (Cloud)
-   **Data Source**: CMS Medicaid State Drug Utilization Data (SDUD)

## Testing

### Unit Tests (Backend)
Backend unit tests cover controllers, services, and repositories. They use **Flapdoodle Embedded MongoDB** to spin up an in-memory database for integration testing without external dependencies.

```bash
mvn test
```

### End-to-End Tests (Frontend)
Functional testing is performed using **Playwright**. The tests follow a BDD (Behavior Driven Development) style using Cucumber-like feature files.

**Prerequisites**: Ensure both the backend and frontend servers are running.

**Running Tests**:
```bash
cd frontend
npx playwright test
```

To run a specific test file:
```bash
cd frontend
npx playwright test tests/search.spec.js
```

## Running Locally

### 1. Prerequisites
-   Java 21 or higher installed.
-   Node.js (v18+) and npm installed.
-   MongoDB running locally on port `27017` OR Docker container.
    -   *If using Docker:* `docker run -d -p 27017:27017 --name mongodb mongo:latest`

### 2. Backend Setup
The backend will automatically import the `medicaid-sdud-2024.csv` file if the database is empty. Ensure this file is present in the project root.

```bash
# In the project root
mvn spring-boot:run
```
*The server will start at `http://localhost:8080`*

### 3. Frontend Setup
The frontend is configured to proxy API requests to the backend.

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The app will be accessible at `http://localhost:5173`*

### 4. Running with Profiles (Local vs. Embedded vs. Atlas)

You can switch between different database configurations using Spring Profiles.

1.  **Default (Local MongoDB)**:
    Uses `mongodb://localhost:27017/myhealthprices`.
    ```bash
    mvn spring-boot:run
    ```

2.  **Embedded MongoDB (Flapdoodle)**:
    Runs an in-memory MongoDB instance (no installation required).
    ```bash
    mvn spring-boot:run -Dspring-boot.run.profiles=local-embedded
    ```

3.  **MongoDB Atlas (Remote)**:
    Connects to your Atlas cluster.
    ```bash
    export SPRING_DATA_MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/db"
    mvn spring-boot:run -Dspring-boot.run.profiles=atlas
    ```

## Future Deployment
Deployment configurations for **Heroku** or **AWS** will be added in upcoming releases. The architecture is cloud-ready, with the Spring Boot application containerizable via Docker and the React frontend deployable to any static site host or CDN.
