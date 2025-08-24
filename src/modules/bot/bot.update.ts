import { Action, Command, Ctx, On, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import * as path from 'path';
import { InjectModel } from '@nestjs/sequelize';
import { LessonsStatus, UserModel } from './model';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { where } from 'sequelize';
import * as fs from 'fs';

interface Lessons {
  videPath1: string;
  videPath2: string;
  videPath3: string;
  videPath4: string;
  videPath5: string;
  videPath6: string;
}

@Update()
export class BotUpdate {
  deletedata: number[];
  allLessons: Lessons;
  adminEnter: boolean;
  constructor(
    private readonly bot: Telegraf,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
  ) {
    this.deletedata = [];
    this.getVideosFn();
    this.adminEnter = false;
  }

  getVideosFn() {
    const videpPath = path.join(
      process.cwd(),
      'public',
      'videos',
      'smmvideo.mp4',
    );

    this.allLessons = {
      videPath1: videpPath,
      videPath2: videpPath,
      videPath3: videpPath,
      videPath4: videpPath,
      videPath5: videpPath,
      videPath6: videpPath,
    };
  }

  async deleteIdsFn(ctx: Context) {
    while (this.deletedata.length > 0) {
      const id = this.deletedata.pop();
      try {
        if (id) {
          await ctx.deleteMessage(id);
        }
      } catch (e) {
        // console.log("Xabar o'chmadi:", id, e.message);
      }
    }
  }

  isValidPhone(phone: string): boolean {
    phone = phone.split('-').join('');
    const regex = /^\+?[1-9]\d{1,14}$/;
    return regex.test(phone.replace(/\s+/g, ''));
  }

  @Start()
  async start(@Ctx() ctx: Context & { message: any }) {
    try {
      this.adminEnter = false;
      const username = ctx.from?.first_name || ctx.from?.username;

      const loading = await ctx.reply('Biroz kuting...');

      const videpPath = path.join(
        process.cwd(),
        'public',
        'videos',
        'smmvideo.mp4',
      );
      await ctx.replyWithVideo(
        { source: videpPath },
        { caption: `Assalomu Alaykum ${username} 👋` },
      );

      await ctx.reply(
        "Sizga va'da qilingan «O'z xizmatini qimmatroqqa sotish» video darsligi shu yerda👇",
      );

      await ctx.reply(
        "Ushbu darsda qanday qilib muzokara o'tkazish, sotuv qilish ketma-ketligi va qimmat sotishni 0dan o'rgatdim",
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Darsni boshlash',
                  callback_data: 'start_lesson',
                },
              ],
            ],
          },
        },
      );

      const chatId = ctx.message?.chat?.id;
      await ctx.telegram.deleteMessage(chatId, loading?.message_id);

      const messageId = ctx.message?.message_id;
      await ctx.telegram.deleteMessage(chatId, messageId);
    } catch (error) {
      console.error('Video yuborishda xato:', error);
    }
  }

  @Action('start_lesson')
  async beginLesson(@Ctx() ctx: Context) {
    const data = await ctx.reply("Iltimos To'liq Ismingizni kiriting", {
      reply_markup: {
        force_reply: true,
      },
    });
    this.deletedata.push(data?.message_id);
  }

  @On('photo')
  async handleAdminImages(@Ctx() ctx: Context & { message: any }) {
    if (!this.adminEnter) return;

    const photo = ctx.message.photo;
    const caption = ctx.message.caption || null;

    const users = await this.userModel.findAll();

    for (const user of users) {
      try {
        const fileId = photo[photo.length - 1].file_id;

        await this.bot.telegram.sendPhoto(user.userTelId, fileId, {
          caption,
        });
      } catch (e) {
        console.log(`Rasm yuborilmadi: ${user.userTelId}`, e.message);
      }
    }
  }

  @On('video_note')
  async handleAdminRoundVideo(@Ctx() ctx: Context & { message: any }) {
    if (!this.adminEnter) return;

    const videoNote = ctx.message.video_note;

    const users = await this.userModel.findAll();

    for (const user of users) {
      try {
        await this.bot.telegram.sendVideoNote(
          user.userTelId,
          videoNote.file_id,
        );
      } catch (e) {
        console.log(`Video yuborilmadi: ${user.userTelId}`, e.message);
      }
    }
  }

  @On('video')
  async handleAdminVideo(@Ctx() ctx: Context & { message: any }) {
    if (!this.adminEnter) return;

    const video = ctx.message.video;
    const caption = ctx.message.caption || '';

    const users = await this.userModel.findAll();

    for (const user of users) {
      try {
        await this.bot.telegram.sendVideo(user.userTelId, video.file_id, {
          caption: caption,
        });
      } catch (e) {
        console.log(`Video yuborilmadi: ${user.userTelId}`, e.message);
      }
    }
  }

  @On('text')
  async getUserInfo(@Ctx() ctx: Context & { message: any }) {
    const userText = ctx.message.text;

    if(!userText) return;

    this.deletedata.push(ctx.message?.message_id);
    this.deletedata.push(ctx.message?.reply_to_message?.message_id);

    if (this.adminEnter) {
      this.sendPostToAllUsers(ctx, userText);
    }

    if (userText == '/admin') {
      const data = await ctx.reply('Iltimos parol kiriting', {
        reply_markup: {
          force_reply: true,
        },
      });

      this.deletedata.push(data.message_id);
      return;
    }

    if (
      ctx.message?.reply_to_message &&
      ctx.message?.reply_to_message?.text === 'Iltimos parol kiriting'
    ) {
      const adminParol = process.env.ADMIN_PAROL;

      if (adminParol !== userText) {
        await ctx.reply('Parol Xato ❌');
        return;
      }
      const messageId = await ctx.reply('Parol kiritildi ✅');
      this.adminEnter = true;

      this.deletedata.push(messageId.message_id);
      return;
    }

    if (
      ctx.message?.reply_to_message &&
      ctx.message?.reply_to_message?.text ===
        "Iltimos To'liq Ismingizni kiriting"
    ) {
      const userInfo = ctx.from;
      const existingUser = await this.userModel.findOne({
        where: { userTelId: userInfo?.id },
      });

      if (!existingUser) {
        await this.userModel.create({
          userTelId: userInfo?.id,
          username: userInfo?.username,
          name: userText,
        });
      }

      await this.deleteIdsFn(ctx);

      const data = await ctx.reply('📞 Iltimos Telefon raqamingizni kiriting', {
        reply_markup: { force_reply: true },
      });

      this.deletedata.push(data.message_id);
      return;
    }

    if (
      ctx.message?.reply_to_message &&
      ctx.message?.reply_to_message?.text ===
        '📞 Iltimos Telefon raqamingizni kiriting'
    ) {
      if (!this.isValidPhone(userText)) {
        const replyId = await ctx.reply(
          '❗️ Siz Telefon raqamini xato kiritdingiz iltimos qaytadan kiriting',
        );
        const data = await ctx.reply(
          '📞 Iltimos Telefon raqamingizni kiriting',
          {
            reply_markup: { force_reply: true },
          },
        );
        this.deletedata.push(replyId.message_id);
        this.deletedata.push(data.message_id);
        return;
      }

      const existingUser = await this.userModel.findOne({
        where: { userTelId: ctx.from?.id },
      });

      if (existingUser) {
        await this.userModel.update(
          { phoneNumber: userText },
          {
            where: { id: existingUser?.id },
          },
        );
      }

      await this.deleteIdsFn(ctx);
      const data = await ctx.reply('🧍 Iltimos Yoshingizni kiriting', {
        reply_markup: {
          force_reply: true,
        },
      });
      this.deletedata.push(data.message_id);
      return;
    }

    if (
      ctx.message?.reply_to_message &&
      ctx.message?.reply_to_message?.text === '🧍 Iltimos Yoshingizni kiriting'
    ) {
      const cleaned = userText.replace(/\D/g, '');
      const age = parseInt(cleaned, 10);

      if (!age || age < 10 || age > 100) {
        const message = await ctx.reply(
          "❌ Iltimos, yoshingizni to'g'ri kiriting (10-100 oralig'ida)",
        );
        const data = await ctx.reply('🧍 Iltimos Yoshingizni kiriting', {
          reply_markup: {
            force_reply: true,
          },
        });
        this.deletedata.push(data.message_id);
        this.deletedata.push(message.message_id);
        return;
      }

      const existingUser = await this.userModel.findOne({
        where: { userTelId: ctx.from?.id },
      });

      if (existingUser) {
        await this.userModel.update(
          { age: age },
          {
            where: { id: existingUser?.id },
          },
        );
      }
      await this.deleteIdsFn(ctx);

      const data = await ctx.reply('👱🏻‍♂️ 👩🏻‍🦰 Iltimos Jinsingizni tanlang', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Erkak', callback_data: 'gender_male' },
              { text: 'Ayol', callback_data: 'gender_female' },
            ],
          ],
        },
      });

      this.deletedata.push(data.message_id);
      return;
    }
  }

  async sendGoogle(ctx: Context & { message: any }) {

    const existingUser = await this.userModel.findOne({
      where: { userTelId: ctx.from?.id },
    });

    if (existingUser) {


      const sendData = {
        telegramUsername: existingUser?.username,
        fullname: existingUser?.name,
        age: existingUser?.age,
        gender: existingUser?.gender,
        phoneNumber: existingUser?.phoneNumber,
      };

      const data = await ctx.replyWithVideo(
        { source: this.allLessons.videPath1 },
        {
          caption: `1 - darsga xush kelibsiz 🎉 ${ctx.from?.first_name} 🎉`,
        },
      );

      this.deletedata.push(data.message_id);

      // Motivatsion xabar
      await ctx.reply(
        `👏 Ajoyib, ${ctx.from?.first_name}! Siz darsni boshladingiz va har bir qadam sizni bilimlaringizni kengaytirishga yaqinlashtiradi.\n\n` +
          `💡 Harakatlaringizni davom ettiring, savollar bo'lsa yozing va o'rganishni zavq bilan davom ettiring! 🚀\n\n` +
          `Siz bilan birga o'sib borish juda hayajonli! 🌟`,
      );

      const founUser = await this.userModel.findOne({
        where: { userTelId: ctx.from?.id },
      });

      if (founUser) {
        await this.userModel.update(
          {
            dateTwentyFour: new Date(Date.now() + 24 * 60 * 60 * 1000),
            dateTwelve: new Date(Date.now() + 35 * 60 * 60 * 1000),
            dateLastHour: new Date(Date.now() + 36 * 60 * 60 * 1000),
            dateHour: new Date(Date.now() + 37 * 60 * 60 * 1000),
          },
          { where: { id: founUser.id } },
        );
      }

      try {
        const adminId = process.env.ADMIN_ID;

        if (adminId) {
          await this.bot.telegram.sendMessage(
            adminId,
            `Yangi user qo'shildi ✅

            Full name: ${sendData.fullname || 'N/A'}
            Username: @${sendData.telegramUsername || 'N/A'}
            Phone: ${sendData.phoneNumber || 'N/A'}
            Age: ${sendData.age || 'N/A'}
            Gender: ${sendData.gender || 'N/A'}`,
          );
        }

        await fetch(
          'https://script.google.com/macros/s/AKfycbx-QYG1a7dO8C9Xf0r-aTas_nluaKevhvti71dVi1HzL8qi2LAOZpaUuIQAxh3fqunIlg/exec',
          {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sendData),
          },
        );
      } catch (error) {
        console.log('fetch qilisgda xatolik', error);
      }
    }
  }

  @Action('gender_male')
  async selectMale(@Ctx() ctx: Context) {
    const foundUser = await this.userModel.findOne({
      where: { userTelId: ctx.from?.id },
    });
    if (foundUser) {
      await this.userModel.update(
        { gender: 'erkak' },
        { where: { id: foundUser.id } },
      );
    }

    this.deleteIdsFn(ctx);
    this.sendGoogle(ctx);
  }

  @Action('gender_female')
  async selectFemale(@Ctx() ctx: Context) {
    const foundUser = await this.userModel.findOne({
      where: { userTelId: ctx.from?.id },
    });
    if (foundUser) {
      await this.userModel.update(
        { gender: 'ayol' },
        { where: { id: foundUser.id } },
      );
    }
    this.deleteIdsFn(ctx);
    this.sendGoogle(ctx);
  }

  @Cron('*/5 * * * *')
  async sendLessonFn() {
    const allData = await this.userModel.findAll();

    for (let user of allData) {
      const now = new Date();
      if (user.dateHour && user.dateHour <= now) {
        if (user) {
          const updatedLessonOrder =
            user.lessonOrder !== undefined ? user.lessonOrder + 1 : 1;

          if (user.lastVideoId) {
            await this.bot.telegram.deleteMessage(
              user.userTelId,
              user.lastVideoId,
            );
          }

          const lesssonPath = this.allLessons[`videPath${updatedLessonOrder}`];

          const videoStream = fs.createReadStream(lesssonPath);
          const data = await this.bot.telegram.sendVideo(
            user.userTelId,
            { source: videoStream },
            {
              caption: `${updatedLessonOrder} - darsga xush kelibsiz 🎉 ${user.name} 🎉`,
            },
          );

          // Motivatsion xabar
          await this.bot.telegram.sendMessage(
            user.userTelId,
            `👏 Ajoyib, ${user.name}! Siz darsni boshladingiz va har bir qadam sizni bilimlaringizni kengaytirishga yaqinlashtiradi.\n\n` +
              `💡 Harakatlaringizni davom ettiring, savollar bo'lsa yozing va o'rganishni zavq bilan davom ettiring! 🚀\n\n` +
              `Siz bilan birga o'sib borish juda hayajonli! 🌟`,
          );

          const lessonKey = `lesson${updatedLessonOrder}`;

          if (updatedLessonOrder > 5) {
            await this.bot.telegram.sendMessage(
              user.userTelId,
              `🎉 Ajoyib, ${user.name}! \n\n` +
                `Siz darsni muvaffaqiyatli tugatdingiz! 👏\n\n` +
                `📚 Har bir o'rganilgan qadam sizning bilimlaringizni kuchaytiradi. ` +
                `Davom eting, yangi darslar sizni kutmoqda! 🚀\n\n` +
                `Siz bilan birga o'sish juda quvonchli! 🌟`,
            );


            await this.userModel.update(
              {
                dateHour: null,
                dateLastHour: null,
                dateTwelve: null,
                dateTwentyFour: null,
              },
              {where: {id: user.id}}
            );
            return;
          }

          const updatedLessons = {
            ...user.checkLessons,
            [lessonKey]: true,
          } as LessonsStatus;

          await this.userModel.update(
            {
              lessonOrder: updatedLessonOrder,
              checkLessons: updatedLessons,
              dateHour: new Date(Date.now() + 37 * 60 * 60 * 1000),
              lastVideoId: data.message_id,
            },
            {
              where: { id: user.id },
            },
          );
        }
      }
    }
  }

  async sendPostToAllUsers(ctx: Context, content: string) {
    const users = await this.userModel.findAll();

    for (const user of users) {
      try {
        await ctx.telegram.sendMessage(user.userTelId, content);
      } catch (e) {
        console.log(`Xabar yuborilmadi: ${user.userTelId}`, e.message);
      }
    }
  }

  @Cron('*/5 * * * *')
  async sendWarnMessageFn() {
    const allUser = await this.userModel.findAll();

    for (let user of allUser) {
      const now = new Date();
      if (user.dateTwentyFour && user.dateTwentyFour <= now) {
        try {
          await this.bot.telegram.sendMessage(
            user.userTelId,
            `Salom ${user.name}! 👋\n\n` +
              `Bugun siz darsni koirib chiqa oldingizmi? 🧐\n` +
              `Bizning yangi darslarimiz sizning bilimlaringizni kengaytirishga yordam beradi. ` +
              `Agar hali boshlamagan boilsangiz, hoziroq boshlashingiz mumkin! 🚀\n\n` +
              `Savollaringiz boilsa, bemalol yozing. Biz har doim yordam berishga tayyormiz! 💡\n\n` +
              `24 soatdan keyin sizga yangi darslar va qiziqarli mashqlar haqida yana xabar yuboramiz! 🔔`,
          );

          await this.userModel.update(
            { dateTwentyFour: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            { where: { id: user.id } },
          );
        } catch (error) {
          console.log('message yuborishda xatolik 24');
        }
      }
    }
  }

  @Cron('*/5 * * * *')
  async messageTwelveFn() {
    const allUser = await this.userModel.findAll();

    for (let user of allUser) {
      const now = new Date();
      if (user.dateTwelve && user.dateTwelve <= now) {
        try {
          await this.bot.telegram.sendMessage(
            user.userTelId,
            `⏰ Salom ${user.name}!\n\n` +
              `12 soatdan keyin dars yopiladi. Siz darsni ko'rib ulgurdingizmi? 🧐\n\n` +
              `📚 Agar hali boshlamagan bo'lsangiz, hoziroq kirib, bilimlaringizni oshirishni boshlang! 🚀\n\n` +
              `Har bir qadam sizni maqsadingizga yaqinlashtiradi! 💡`,
          );

          await this.userModel.update(
            { dateTwelve: new Date(Date.now() + 35 * 60 * 60 * 1000) },
            { where: { id: user.id } },
          );
        } catch (error) {
          console.log('message yuborishda xatolik 12');
        }
      }
    }
  }

  @Cron('*/5 * * * *')
  async lastHourMessage() {
    const allUsers = await this.userModel.findAll();

    for (let user of allUsers) {
      const now = new Date();
      if (user.dateLastHour && user.dateLastHour <= now) {
        try {
          await this.bot.telegram.sendMessage(
            user.userTelId,
            `⚠️ Diqqat, ${user.name}! \n\n` +
              `Dars yopilishiga atigi 1 soat qoldi! 🕐\n\n` +
              `Agar hali darsni ko'rmagan bo'lsangiz, hoziroq kirib, barcha materiallarni o'rganing! 📚🚀\n\n` +
              `Har bir daqiqa sizni bilimlaringizga yaqinlashtiradi! 💡`,
          );

          await this.userModel.update(
            { dateLastHour: new Date(Date.now() + 36 * 60 * 60 * 1000) },
            { where: { id: user.id } },
          );
        } catch (error) {
          console.log('message yuborishda xatolik 1');
        }
      }
    }
  }
}
