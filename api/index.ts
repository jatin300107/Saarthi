import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from '../server/api';

dotenv.config();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Defensive header cleanup: Never allow client-supplied x-saarthi-role to reach route handlers
app.use((req, res, next) => {
  if (req.headers['x-saarthi-role']) {
    delete req.headers['x-saarthi-role'];
  }
  next();
});

// Route handling: handle both /api prefixed routes and root routes if rewritten
app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
