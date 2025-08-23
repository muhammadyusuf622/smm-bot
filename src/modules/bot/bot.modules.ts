import { Module } from "@nestjs/common";
import { BotUpdate } from "./bot.update";
import { Telegraf } from "telegraf";
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from "@nestjs/sequelize";
import { UserModel } from "./model";
import { ScheduleModule } from "@nestjs/schedule";


@Module({
  providers: [
    BotUpdate,
    {
      provide: Telegraf,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('BOT_SECRET_TOKEN'); // .env dan o'qish
        return new Telegraf(token as string);
      },
    },
  ],

  imports: [
    SequelizeModule.forFeature([UserModel]),
    ScheduleModule.forRoot(),
  ]
})
export class BotModule {};