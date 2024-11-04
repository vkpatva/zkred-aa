import express, { Express } from 'express';
import https from 'https';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import fs from 'fs';
import path from 'path';
import verifierRoutes from './routes/verifierRoutes';

dotenv.config();

const app: Express = express();
const port = process.env.VERIFIER_BACKEND_PORT;

const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt')
};


// Middleware
app.use(cors());
app.use(express.json());

// Load Swagger YAML file
const swaggerFile = fs.readFileSync(path.resolve(__dirname, './swagger.yaml'), 'utf8');
const swaggerDocument = yaml.parse(swaggerFile);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Basic routes
app.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/verifier', verifierRoutes);

// Create HTTPS server
const httpsServer = https.createServer(options, app);

httpsServer.listen(port, () => {
    console.log(`HTTPS server running on port ${port}`);
}); 