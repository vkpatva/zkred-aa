import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import verifierRoutes from './routes/verifierRoutes';

dotenv.config();

const app: Express = express();
const port = process.env.VERIFIER_BACKEND_PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Basic routes
app.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/verifier', verifierRoutes);

app.listen(port, () => {
    console.log(`server running on port ${port}`);
}); 