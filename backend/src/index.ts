import app from './infrastructure/http/app.js';
import { db } from './prisma/db.js';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

bootstrap();
