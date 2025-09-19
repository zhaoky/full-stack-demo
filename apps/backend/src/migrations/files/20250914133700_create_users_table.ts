import type { MigrationContext } from '../core/MigrationRunner';

export async function up({ queryInterface, Sequelize }: MigrationContext): Promise<void> {
  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: '用户唯一标识符',
    },
    email: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
      comment: '用户邮箱',
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
      comment: '用户名',
      validate: {
        len: [3, 50],
      },
    },
    password: {
      type: Sequelize.STRING(255),
      allowNull: false,
      comment: '加密后的密码',
    },
    first_name: {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: '名字',
    },
    last_name: {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: '姓氏',
    },
    avatar: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: '头像URL',
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '用户是否激活',
    },
    last_login: {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '最后登录时间',
    },
    role: {
      type: Sequelize.ENUM('admin', 'user', 'moderator'),
      allowNull: false,
      defaultValue: 'user',
      comment: '用户角色',
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      comment: '创建时间',
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      comment: '更新时间',
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '软删除时间',
    },
  });

  // 添加索引
  await queryInterface.addIndex('users', ['email'], {
    name: 'idx_users_email',
    unique: true,
  });

  await queryInterface.addIndex('users', ['username'], {
    name: 'idx_users_username',
    unique: true,
  });

  await queryInterface.addIndex('users', ['role'], {
    name: 'idx_users_role',
  });

  await queryInterface.addIndex('users', ['is_active'], {
    name: 'idx_users_is_active',
  });

  await queryInterface.addIndex('users', ['created_at'], {
    name: 'idx_users_created_at',
  });

  // 软删除复合索引
  await queryInterface.addIndex('users', ['deleted_at', 'is_active'], {
    name: 'idx_users_deleted_at_is_active',
  });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('users');
}
