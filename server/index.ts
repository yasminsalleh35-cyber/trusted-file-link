import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import adminRoutes from './routes/admin';

const app = express();
app.use(express.json());

// CORS
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.corsOrigins.length === 0) return callback(null, true);
    if (config.corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/admin', adminRoutes);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${config.port}`);
});