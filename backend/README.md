# MyHealthPrices Backend - Spring WebFlux

This is the Java Spring WebFlux backend for the MyHealthPrices application, replacing the original Node.js/Express server.

## Technology Stack

- **Java 17**
- **Spring Boot 3.2.0**
- **Spring WebFlux** (Reactive Web Framework)
- **Spring Data MongoDB Reactive**
- **Maven** (Dependency Management)
- **MongoDB Atlas** (Database)

## API Endpoints

### Drug Search
- **GET** `/api/drugs?name={drugName}`
- Searches for drugs by name (case-insensitive, partial matching)
- Returns array of matching drugs with `drugName`, `ndc`, and `nadacPrice`

### Health Check
- **GET** `/api/health`
- Returns server health status

## Running the Application

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- MongoDB Atlas connection (configured in application.yml)

### Build and Run
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The server will start on port 5000 (or PORT environment variable).

### Environment Variables
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string

## Testing
```bash
mvn test
```

## Data Import
The `DataImporter` utility class provides functionality to import NADAC CSV data into MongoDB.

## Project Structure
```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/myhealthprices/
│   │   │   ├── MyHealthPricesApplication.java
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── model/
│   │   │   ├── repository/
│   │   │   ├── service/
│   │   │   └── util/
│   │   └── resources/
│   │       └── application.yml
│   └── test/
└── pom.xml
```
