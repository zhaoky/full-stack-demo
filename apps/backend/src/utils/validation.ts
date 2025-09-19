import Joi from 'joi';
import type { CreateUserRequest, UpdateUserRequest, LoginRequest, CreateRankingRequest, UpdateRankingRequest, RankingQuery } from '../types/index';

// 通用字段验证
const commonFields = {
  email: () => Joi.string().email().messages({ 'string.email': '请提供有效的邮箱地址' }),
  username: () =>
    Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .messages({
        'string.min': '用户名至少需要3个字符',
        'string.max': '用户名不能超过30个字符',
        'string.pattern.base': '用户名只能包含字母、数字和下划线',
      }),
  password: () => Joi.string().min(6).messages({ 'string.min': '密码至少需要6个字符' }),
  name: (min = 1, max = 50) =>
    Joi.string()
      .min(min)
      .max(max)
      .trim()
      .messages({
        'string.min': `名称至少需要${min}个字符`,
        'string.max': `名称不能超过${max}个字符`,
      }),
  role: () => Joi.string().valid('admin', 'user', 'moderator').default('user'),
  score: () =>
    Joi.number().integer().min(0).max(1000).messages({
      'number.base': '分数必须是数字',
      'number.integer': '分数必须是整数',
      'number.min': '分数不能少于0',
      'number.max': '分数不能超过1000',
    }),
};

// 分页查询字段
const paginationFields = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().optional().allow('').trim(),
};

// 用户相关验证规则
export const userValidationSchemas = {
  createUser: Joi.object<CreateUserRequest>({
    email: commonFields.email().required(),
    username: commonFields.username().required(),
    password: commonFields.password().required(),
    firstName: commonFields.name().optional().allow(''),
    lastName: commonFields.name().optional().allow(''),
    role: commonFields.role().optional(),
  }),

  updateUser: Joi.object<UpdateUserRequest>({
    email: commonFields.email().optional(),
    username: commonFields.username().optional(),
    firstName: commonFields.name().optional().allow(''),
    lastName: commonFields.name().optional().allow(''),
    avatar: Joi.string().uri().optional().allow('').messages({ 'string.uri': '头像必须是有效的URL' }),
    isActive: Joi.boolean().optional(),
    role: commonFields.role().optional(),
  }),

  login: Joi.object<LoginRequest>({
    username: Joi.string().required().messages({ 'any.required': '用户名是必需的' }),
    password: Joi.string().required().messages({ 'any.required': '密码是必需的' }),
  }),
};

// 分页查询验证
export const paginationSchema = Joi.object({
  ...paginationFields,
  sortBy: Joi.string().optional().default('createdAt'),
});

// 排行榜相关验证规则
export const rankingValidationSchemas = {
  createRanking: Joi.object<CreateRankingRequest>({
    name: commonFields.name().required().messages({ 'any.required': '姓名是必需的' }),
    score: commonFields.score().required().messages({ 'any.required': '分数是必需的' }),
  }),

  updateRanking: Joi.object<UpdateRankingRequest>({
    name: commonFields.name().optional(),
    score: commonFields.score().optional(),
  })
    .min(1)
    .messages({ 'object.min': '至少需要提供一个要更新的字段' }),

  rankingQuery: Joi.object<RankingQuery>({
    ...paginationFields,
    sortBy: Joi.string().valid('id', 'name', 'score', 'rankPosition', 'createdAt', 'updatedAt').default('rankPosition'),
    sortOrder: paginationFields.sortOrder.default('asc'),
    name: Joi.string().optional().allow('').trim(),
    minScore: commonFields.score().optional(),
    maxScore: commonFields.score().optional(),
    grade: Joi.string().valid('S', 'A', 'B', 'C', 'D', 'E').optional(),
  })
    .custom((value, helpers) => {
      if (value.minScore !== undefined && value.maxScore !== undefined && value.minScore > value.maxScore) {
        return helpers.error('custom.scoreRange');
      }
      return value;
    })
    .messages({ 'custom.scoreRange': '最小分数不能大于最大分数' }),
};

// 通用验证规则
export const commonSchemas = {
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID必须是数字',
    'number.integer': 'ID必须是整数',
    'number.positive': 'ID必须是正数',
    'any.required': 'ID是必需的',
  }),

  uuid: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': '无效的ID格式',
    'any.required': 'ID是必需的',
  }),

  batchDelete: Joi.object({
    ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(100).required().messages({
      'array.base': 'IDs必须是数组',
      'array.min': '至少需要选择一个项目',
      'array.max': '一次最多只能删除100个项目',
      'any.required': 'IDs是必需的',
    }),
  }),
};

// 向后兼容的导出
export const { id: numberIdSchema, uuid: uuidSchema, batchDelete: batchDeleteSchema } = commonSchemas;

/**
 * 验证函数
 */
export const validate = <T>(schema: Joi.ObjectSchema<T>, data: unknown): T => {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });

  if (error) {
    const validationError = new Error('验证失败') as any;
    validationError.name = 'ValidationError';
    validationError.errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value,
    }));
    throw validationError;
  }

  return value;
};
