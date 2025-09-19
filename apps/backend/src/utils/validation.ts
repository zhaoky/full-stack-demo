import Joi from 'joi';
import type { CreateUserRequest, UpdateUserRequest, LoginRequest, CreateRankingRequest, UpdateRankingRequest, RankingQuery } from '@types/index';

// 用户相关验证规则
export const userValidationSchemas = {
  // 创建用户验证（宽松版本）
  createUser: Joi.object<CreateUserRequest>({
    email: Joi.string().allow('').optional().messages({
      'string.base': '邮箱格式不正确',
    }),
    username: Joi.string().allow('').optional().messages({
      'string.base': '用户名格式不正确',
    }),
    password: Joi.string().allow('').optional().messages({
      'string.base': '密码格式不正确',
    }),
    firstName: Joi.string().allow('').optional().messages({
      'string.base': '名字格式不正确',
    }),
    lastName: Joi.string().allow('').optional().messages({
      'string.base': '姓氏格式不正确',
    }),
    role: Joi.string().valid('admin', 'user', 'moderator').optional().default('user'),
  }),

  // 更新用户验证
  updateUser: Joi.object<UpdateUserRequest>({
    email: Joi.string().email().optional().messages({
      'string.email': '请提供有效的邮箱地址',
    }),
    username: Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .optional()
      .messages({
        'string.min': '用户名至少需要3个字符',
        'string.max': '用户名不能超过30个字符',
        'string.pattern.base': '用户名只能包含字母、数字和下划线',
      }),
    firstName: Joi.string().min(1).max(50).optional().allow('').messages({
      'string.min': '名字至少需要1个字符',
      'string.max': '名字不能超过50个字符',
    }),
    lastName: Joi.string().min(1).max(50).optional().allow('').messages({
      'string.min': '姓氏至少需要1个字符',
      'string.max': '姓氏不能超过50个字符',
    }),
    avatar: Joi.string().uri().optional().allow('').messages({
      'string.uri': '头像必须是有效的URL',
    }),
    isActive: Joi.boolean().optional(),
    role: Joi.string().valid('admin', 'user', 'moderator').optional(),
  }),

  // 登录验证（无验证版本）
  login: Joi.object<LoginRequest>({
    username: Joi.string().allow('').optional().messages({
      'string.base': '用户名格式不正确',
    }),
    password: Joi.string().allow('').optional().messages({
      'string.base': '密码格式不正确',
    }),
  }),
};

// 分页查询验证
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': '页码必须是数字',
    'number.integer': '页码必须是整数',
    'number.min': '页码至少为1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': '限制数必须是数字',
    'number.integer': '限制数必须是整数',
    'number.min': '限制数至少为1',
    'number.max': '限制数最多为100',
  }),
  sortBy: Joi.string().optional().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
  search: Joi.string().optional().allow(''),
});

// 排行榜相关验证规则
export const rankingValidationSchemas = {
  // 创建排名记录验证
  createRanking: Joi.object<CreateRankingRequest>({
    name: Joi.string().min(1).max(50).trim().required().messages({
      'string.min': '姓名至少需要1个字符',
      'string.max': '姓名不能超过50个字符',
      'string.empty': '姓名不能为空',
      'any.required': '姓名是必需的',
    }),
    score: Joi.number().integer().min(0).max(1000).required().messages({
      'number.base': '分数必须是数字',
      'number.integer': '分数必须是整数',
      'number.min': '分数不能少于0',
      'number.max': '分数不能超过1000',
      'any.required': '分数是必需的',
    }),
  }),

  // 更新排名记录验证
  updateRanking: Joi.object<UpdateRankingRequest>({
    name: Joi.string().min(1).max(50).trim().optional().messages({
      'string.min': '姓名至少需要1个字符',
      'string.max': '姓名不能超过50个字符',
      'string.empty': '姓名不能为空',
    }),
    score: Joi.number().integer().min(0).max(1000).optional().messages({
      'number.base': '分数必须是数字',
      'number.integer': '分数必须是整数',
      'number.min': '分数不能少于0',
      'number.max': '分数不能超过1000',
    }),
  })
    .min(1)
    .messages({
      'object.min': '至少需要提供一个要更新的字段',
    }),

  // 排行榜查询验证
  rankingQuery: Joi.object<RankingQuery>({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': '页码必须是数字',
      'number.integer': '页码必须是整数',
      'number.min': '页码至少为1',
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': '限制数必须是数字',
      'number.integer': '限制数必须是整数',
      'number.min': '限制数至少为1',
      'number.max': '限制数最多为100',
    }),
    sortBy: Joi.string().valid('id', 'name', 'score', 'rankPosition', 'createdAt', 'updatedAt').optional().default('rankPosition').messages({
      'any.only': '排序字段只能是: id, name, score, rankPosition, createdAt, updatedAt',
    }),
    sortOrder: Joi.string().valid('asc', 'desc').optional().default('asc').messages({
      'any.only': '排序方向只能是: asc, desc',
    }),
    search: Joi.string().optional().allow('').trim(),
    name: Joi.string().optional().allow('').trim(),
    minScore: Joi.number().integer().min(0).max(1000).optional().messages({
      'number.base': '最小分数必须是数字',
      'number.integer': '最小分数必须是整数',
      'number.min': '最小分数不能少于0',
      'number.max': '最小分数不能超过1000',
    }),
    maxScore: Joi.number().integer().min(0).max(1000).optional().messages({
      'number.base': '最大分数必须是数字',
      'number.integer': '最大分数必须是整数',
      'number.min': '最大分数不能少于0',
      'number.max': '最大分数不能超过1000',
    }),
    grade: Joi.string().valid('S', 'A', 'B', 'C', 'D', 'E').optional().messages({
      'any.only': '等级只能是: S, A, B, C, D, E',
    }),
  })
    .custom((value, helpers) => {
      // 验证分数范围的逻辑
      if (value.minScore !== undefined && value.maxScore !== undefined) {
        if (value.minScore > value.maxScore) {
          return helpers.error('custom.scoreRange');
        }
      }
      return value;
    }, '分数范围验证')
    .messages({
      'custom.scoreRange': '最小分数不能大于最大分数',
    }),
};

// 数字ID验证
export const numberIdSchema = Joi.number().integer().positive().required().messages({
  'number.base': 'ID必须是数字',
  'number.integer': 'ID必须是整数',
  'number.positive': 'ID必须是正数',
  'any.required': 'ID是必需的',
});

// 批量删除验证
export const batchDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(100).required().messages({
    'array.base': 'IDs必须是数组',
    'array.min': '至少需要选择一个项目',
    'array.max': '一次最多只能删除100个项目',
    'any.required': 'IDs是必需的',
  }),
});

// UUID 验证
export const uuidSchema = Joi.string().uuid({ version: 'uuidv4' }).required().messages({
  'string.guid': '无效的ID格式',
  'any.required': 'ID是必需的',
});

/**
 * 验证函数
 */
export const validate = <T>(schema: Joi.ObjectSchema<T>, data: unknown): T => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value,
    }));

    throw {
      name: 'ValidationError',
      message: '验证失败',
      errors,
    };
  }

  return value;
};
