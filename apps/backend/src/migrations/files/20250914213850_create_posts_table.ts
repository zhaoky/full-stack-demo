import type { MigrationContext } from '../core/MigrationRunner';

export async function up({ queryInterface, Sequelize }: MigrationContext): Promise<void> {
  await queryInterface.createTable('posts', {
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    content: {
      type: Sequelize.TEXT,
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
  
  });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('posts');
}
