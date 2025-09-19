import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@config/database';
import type { IRanking } from '../types/index';

// Ranking 创建属性接口
interface RankingCreationAttributes extends Optional<IRanking, 'id' | 'createdAt' | 'updatedAt' | 'rankPosition' | 'deletedAt'> {}

export class Ranking extends Model<IRanking, RankingCreationAttributes> implements IRanking {
  public id!: number;
  public name!: string;
  public score!: number;
  public rankPosition?: number;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt?: Date;

  // 静态方法声明
  static recalculateRankings: () => Promise<void>;
  static getStats: () => Promise<any>;

  // 实例方法 - 格式化排名显示
  public getDisplayRank(): string {
    if (!this.rankPosition) return '未排名';
    return `第${this.rankPosition}名`;
  }

  // 实例方法 - 获取分数等级
  public getScoreGrade(): string {
    if (this.score >= 900) return 'S';
    if (this.score >= 800) return 'A';
    if (this.score >= 700) return 'B';
    if (this.score >= 600) return 'C';
    if (this.score >= 500) return 'D';
    return 'E';
  }
}

// 初始化 Ranking 模型
Ranking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: '排名ID',
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '姓名',
      validate: {
        len: [1, 50],
        notEmpty: true,
      },
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '分数（0-1000）',
      validate: {
        min: 0,
        max: 1000,
        isInt: true,
      },
    },
    rankPosition: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '排名位置',
      field: 'rank_position',
      validate: {
        min: 1,
        isInt: true,
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间',
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '更新时间',
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '删除时间（软删除）',
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    modelName: 'Ranking',
    tableName: 'ranking',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_score',
        fields: [{ name: 'score', order: 'DESC' }],
      },
      {
        name: 'idx_rank',
        fields: ['rank_position'],
      },
      {
        name: 'idx_name',
        fields: ['name'],
      },
    ],
    hooks: {
      // 更新后重新计算排名
      afterCreate: async () => {
        await Ranking.recalculateRankings();
      },
      afterUpdate: async (instance: Ranking) => {
        // 只有当分数更新时才重新计算排名
        if (instance.changed('score')) {
          await Ranking.recalculateRankings();
        }
      },
      afterDestroy: async () => {
        await Ranking.recalculateRankings();
      },
    },
  }
);

// 静态方法 - 重新计算所有排名
Ranking.recalculateRankings = async function (): Promise<void> {
  const transaction = await sequelize.transaction();

  try {
    // 先清空所有排名
    await Ranking.update({ rankPosition: undefined as any }, { where: {}, transaction });

    // 按分数降序重新排名
    const rankings = await Ranking.findAll({
      order: [
        ['score', 'DESC'],
        ['id', 'ASC'],
      ],
      transaction,
    });

    // 批量更新排名位置
    const updatePromises = rankings.map((ranking, index) =>
      ranking.update(
        { rankPosition: index + 1 },
        {
          transaction,
          hooks: false, // 避免触发hooks导致无限循环
        }
      )
    );

    await Promise.all(updatePromises);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// 静态方法 - 获取排名统计信息
Ranking.getStats = async function () {
  const stats = await Ranking.findOne({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
      [sequelize.fn('MAX', sequelize.col('score')), 'maxScore'],
      [sequelize.fn('MIN', sequelize.col('score')), 'minScore'],
      [sequelize.fn('AVG', sequelize.col('score')), 'avgScore'],
    ],
    raw: true,
  });

  const scoreDistribution = await Ranking.findAll({
    attributes: [
      [sequelize.literal('CASE WHEN score >= 900 THEN "S" WHEN score >= 800 THEN "A" WHEN score >= 700 THEN "B" WHEN score >= 600 THEN "C" WHEN score >= 500 THEN "D" ELSE "E" END'), 'grade'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: ['grade'],
    raw: true,
  });

  return {
    ...stats,
    scoreDistribution,
  };
};

export default Ranking;
