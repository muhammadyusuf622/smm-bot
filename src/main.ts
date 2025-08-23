import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Telegraf } from 'telegraf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const PORT = parseInt(process.env.APP_PORT as string) || 3000;
  const DOMEN = process.env.DOMEN;
  await app.listen(PORT, "0.0.0.0", () => {
    console.log(DOMEN);
  });
}
bootstrap();
