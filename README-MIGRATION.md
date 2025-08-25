# MyHealthPrices - Spring WebFlux Migration

This project has been migrated from Node.js/Express to Java Spring WebFlux while preserving the React frontend.

## Architecture

### Backend (Java Spring WebFlux)
- **Location**: `./backend/`
- **Technology**: Java 17, Spring Boot 3.2.0, Spring WebFlux, Maven
- **Database**: MongoDB Atlas (same connection as before)
- **Port**: 5000

### Frontend (React)
- **Location**: `./src/`
- **Technology**: React 18, Webpack, Node.js tooling
- **Development**: Webpack Dev Server with proxy to backend

## Running the Application

### Development Mode

1. **Start Backend**:
   ```bash
   npm run start
   # OR
   cd backend && mvn spring-boot:run
   ```

2. **Start Frontend** (in separate terminal):
   ```bash
   npm run start:frontend
   # OR
   npm run dev
   ```

### Production Build

1. **Build Backend**:
   ```bash
   npm run build:backend
   ```

2. **Build Frontend**:
   ```bash
   npm run build
   ```

3. **Run Production**:
   ```bash
   npm run start
   ```

## API Endpoints

Both backends provide identical API contracts:

- `GET /api/drugs?name={drugName}` - Search drugs by name
- `GET /api/health` - Health check endpoint

## Testing

- **Frontend Tests**: `npm test`
- **Backend Tests**: `npm run test:backend`

## Migration Notes

- ✅ API endpoints maintain same contract
- ✅ MongoDB schema unchanged (drug_name, ndc, nadac_price)
- ✅ React frontend unchanged
- ✅ Static file serving preserved
- ✅ Environment variables supported
- ✅ Health check endpoint maintained
- ✅ CORS configuration included

## Data Import

The Java backend includes `DataImporter` utility for importing NADAC CSV data:

```java
@Autowired
private DataImporter dataImporter;

// Import NADAC data
dataImporter.importNadacData("path/to/nadac-data.csv");
```
