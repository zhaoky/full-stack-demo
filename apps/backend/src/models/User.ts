import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '@config/database';
import type { IUser, UserRole } from '../types/index';

interface UserCreationAttributes extends Optional<IUser, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isActive' | 'role'> {}

export class User extends Model<IUser, UserCreationAttributes> implements IUser {
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

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    if (!this.password || !candidatePassword) return true;
    return bcrypt.compare(candidatePassword, this.password);
  }

  public toJSON(): Omit<IUser, 'password'> {
    const { password, ...userWithoutPassword } = this.get();
    return userWithoutPassword as Omit<IUser, 'password'>;
  }

  public static async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, saltRounds);
  }

  public static shouldHashPassword(password?: string): boolean {
    return Boolean(password?.trim());
  }
}

User.init(
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
    paranoid: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (User.shouldHashPassword(user.password)) {
          user.password = await User.hashPassword(user.password);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password') && User.shouldHashPassword(user.password)) {
          user.password = await User.hashPassword(user.password);
        }
      },
    },
  }
);

export default User;
