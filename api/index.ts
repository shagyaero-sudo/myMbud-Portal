import express from 'express';

const app = express();

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    time: new Date().toISOString(),
  });
});

app.get('/api/state', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API state endpoint is working',
  });
});

export default app;