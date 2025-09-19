import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@config/database';
import type { IRanking, RankingStats } from '../types/index';

// 分数等级配置
const SCORE_GRADES = [
  { min: 900, grade: 'S' },
  { min: 800, grade: 'A' },
  { min: 700, grade: 'B' },
  { min: 600, grade: 'C' },
  { min: 500, grade: 'D' },
] as const;

interface RankingCreationAttributes extends Optional<IRanking, 'id' | 'createdAt' | 'updatedAt' | 'rankPosition' | 'deletedAt'> {}

export class Ranking extends Model<IRanking, RankingCreationAttributes> implements IRanking {
  public id!: number;
  public name!: string;
  public score!: number;
  public rankPosition?: number;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt?: Date;

  public getDisplayRank(): string {
    return this.rankPosition ? `第${this.rankPosition}名` : '未排名';
  }

  public getScoreGrade(): string {
    const grade = SCORE_GRADES.find(({ min }) => this.score >= min);
    return grade?.grade ?? 'E';
  }

  // 静态方法 - 重新计算所有排名
  static async recalculateRankings(): Promise<void> {
    await sequelize.transaction(async (transaction) => {
      // 清空所有排名
      await Ranking.update({ rankPosition: null as any }, { where: {}, transaction });

      // 按分数降序获取所有记录
      const rankings = await Ranking.findAll({
        order: [
          ['score', 'DESC'],
          ['id', 'ASC'],
        ],
        transaction,
      });

      // 批量更新排名位置
      const updatePromises = rankings.map((ranking, index) => ranking.update({ rankPosition: index + 1 }, { transaction, hooks: false }));

      await Promise.all(updatePromises);
    });
  }

  // 静态方法 - 获取排名统计信息
  static async getStats(): Promise<RankingStats> {
    const [stats, scoreDistribution] = await Promise.all([
      Ranking.findOne({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('MAX', sequelize.col('score')), 'maxScore'],
          [sequelize.fn('MIN', sequelize.col('score')), 'minScore'],
          [sequelize.fn('AVG', sequelize.col('score')), 'avgScore'],
        ],
        raw: true,
      }),
      Ranking.findAll({
        attributes: [
          [
            sequelize.literal(`
            CASE 
              WHEN score >= 900 THEN 'S' 
              WHEN score >= 800 THEN 'A' 
              WHEN score >= 700 THEN 'B' 
              WHEN score >= 600 THEN 'C' 
              WHEN score >= 500 THEN 'D' 
              ELSE 'E' 
            END
          `),
            'grade',
          ],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['grade'],
        raw: true,
      }),
    ]);

    const statsData = stats as any;
    return {
      total: Number(statsData?.total || 0),
      maxScore: Number(statsData?.maxScore || 0),
      minScore: Number(statsData?.minScore || 0),
      avgScore: Number(statsData?.avgScore || 0),
      scoreDistribution: scoreDistribution.map((item: any) => ({
        grade: item.grade,
        count: Number(item.count),
      })),
    };
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
      afterCreate: () => Ranking.recalculateRankings(),
      afterUpdate: async (instance: Ranking) => {
        if (instance.changed('score')) {
          await Ranking.recalculateRankings();
        }
      },
      afterDestroy: () => Ranking.recalculateRankings(),
    },
  }
);

export default Ranking;
