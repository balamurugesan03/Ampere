require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Log instead of letting a stray rejection take the whole server down.
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection', err);
});

const PORT =process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Ampere backend running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
