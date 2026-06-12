import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Pinterest API Server]: Running successfully on http://localhost:${PORT}`);
});
