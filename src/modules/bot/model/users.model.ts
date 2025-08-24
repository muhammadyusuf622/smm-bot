import {
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface LessonsStatus {
  lesson1: boolean;
  lesson2: boolean;
  lesson3: boolean;
  lesson4: boolean;
  lesson5: boolean;
  lesson6: boolean;
}

interface UserAttributes {
  id: string;
  userTelId: number;
  name?: string;
  username?: string;
  phoneNumber?: string;
  age?: number;
  gender?: string;
  lessonOrder?: number;
  checkLessons?: LessonsStatus;
  dateTwentyFour?: Date | null;
  dateTwelve?: Date | null;
  dateHour?: Date | null;
  lastVideoId?: number | null;
  dateLastHour?: Date | null;
}

@Table({ tableName: 'users', timestamps: true })
export class UserModel extends Model<UserAttributes, Partial<UserAttributes>> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  declare id: string;

  @Column({ type: DataType.BIGINT, unique: true })
  declare userTelId: number;

  @Column({ type: DataType.STRING, allowNull: true })
  declare name?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare username?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare phoneNumber?: string;

  @Column({ type: DataType.SMALLINT, allowNull: true })
  declare age?: number;

  @Column({ type: DataType.STRING, allowNull: true })
  declare gender?: string;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  declare lessonOrder?: number;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {
      lesson1: false,
      lesson2: false,
      lesson3: false,
      lesson4: false,
      lesson5: false,
      lesson6: false,
    },
  })
  declare checkLessons?: LessonsStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: DataType.NOW,
  })
  declare dateTwentyFour?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: DataType.NOW,
  })
  declare dateTwelve?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: DataType.NOW,
  })
  declare dateHour?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: DataType.NOW,
  })
  declare dateLastHour?: Date;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  declare lastVideoId?: number;
}