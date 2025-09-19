import { DataTypes, Model, Optional } from 'sequelize';
import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { sequelize } from '@config/database';
import type { IUser, UserRole } from '../types/index';

// MySQL 用户模型 (Sequelize)
interface UserCreationAttributes extends Optional<IUser, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isActive' | 'role'> {}

export class MySQLUser extends Model<IUser, UserCreationAttributes> implements IUser {
  public id!: string;
  public email!: string;
  public username!: string;
  public password!: string;
  public firstName?: string;
  public lastName?: string;
  public avatar?: string;
  public isActive!: boolean;
  public lastLogin?: Date;
  public role!: UserRole;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt?: Date | null;

  // 实例方法
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    // 如果密码为空，直接返回true（无验证模式）
    if (!this.password || !candidatePassword) {
      return true;
    }
    return bcrypt.compare(candidatePassword, this.password);
  }

  public toJSON(): Omit<IUser, 'password'> {
    const { password, ...userWithoutPassword } = this.get();
    return userWithoutPassword as Omit<IUser, 'password'>;
  }
}

// 初始化 MySQL User 模型
MySQLUser.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 50],
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 50],
      },
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'moderator'),
      defaultValue: 'user',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    paranoid: true, // 启用软删除
    hooks: {
      beforeCreate: async (user: MySQLUser) => {
        // 无验证模式：只有当密码存在且不为空时才进行哈希
        if (user.password && user.password.trim() !== '') {
          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
      beforeUpdate: async (user: MySQLUser) => {
        // 无验证模式：只有当密码更改且不为空时才进行哈希
        if (user.changed('password') && user.password && user.password.trim() !== '') {
          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
    },
  }
);

// MongoDB 用户模式 (Mongoose)
export interface MongoUser extends Document, Omit<IUser, 'id'> {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const mongoUserSchema = new Schema<MongoUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username must be less than 30 characters'],
    },
    password: {
      type: String,
      required: true,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // 默认不查询密码字段
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name must be less than 50 characters'],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name must be less than 50 characters'],
    },
    avatar: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'moderator'] as const,
      default: 'user' as const,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// MongoDB 中间件
mongoUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// MongoDB 实例方法
mongoUserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  // 如果密码为空，直接返回true（无验证模式）
  if (!this.password || !candidatePassword) {
    return true;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

export const MongoDBUser = model<MongoUser>('User', mongoUserSchema);

// 导出统一的用户模型接口
export { MySQLUser as User };
