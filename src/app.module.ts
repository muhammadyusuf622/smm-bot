import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotModule, BotUpdate } from './modules';
import { TelegrafModule } from 'nestjs-telegraf';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TelegrafModule.forRoot({
      token: process.env.BOT_SECRET_TOKEN as string,
    }),

    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT as string) || 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      sync: {
        // force: true
        alter: true,
      },
      autoLoadModels: true,
    }),

    BotModule,
  ],
})
export class AppModule {}
