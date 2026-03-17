require('dotenv').config();
const { createApp } = require('./app');
const { testConnection } = require('./config/db');

const PORT = Number(process.env.PORT || 3001);
const app = createApp();

async function bootstrap() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Backend started at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect database:', error.message);
    process.exit(1);
  }
}

bootstrap();
