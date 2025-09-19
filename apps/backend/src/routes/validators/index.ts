import { validateBody, validateParams, validateQuery } from '@middleware/validation';
import { userValidationSchemas, rankingValidationSchemas, paginationSchema, uuidSchema, numberIdSchema, batchDeleteSchema } from '@utils/validation';
import Joi from 'joi';

/**
 * 验证器集中管理
 * 将所有验证逻辑按模块组织，便于复用和维护
 */
export const validators = {
  /**
   * 用户相关验证器
   */
  user: {
    create: validateBody(userValidationSchemas.createUser),
    update: validateBody(userValidationSchemas.updateUser),
    login: validateBody(userValidationSchemas.login),
    params: validateParams(Joi.object({ id: uuidSchema })),
    refreshToken: validateBody(
      Joi.object({
        refreshToken: Joi.string().required().messages({
          'any.required': '刷新令牌是必需的',
          'string.empty': '刷新令牌不能为空',
        }),
      })
    ),
    changePassword: validateBody(
      Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string()
          .min(6)
          .max(100)
          .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
          .required()
          .messages({
            'string.min': '新密码至少需要6个字符',
            'string.max': '新密码不能超过100个字符',
            'string.pattern.base': '新密码必须包含至少一个小写字母、一个大写字母和一个数字',
            'any.required': '新密码是必需的',
          }),
      })
    ),
  },

  /**
   * 排名相关验证器
   */
  ranking: {
    create: validateBody(rankingValidationSchemas.createRanking),
    update: validateBody(rankingValidationSchemas.updateRanking),
    query: validateQuery(rankingValidationSchemas.rankingQuery),
    params: validateParams(Joi.object({ id: numberIdSchema })),
    batchDelete: validateBody(batchDeleteSchema),
    topQuery: validateQuery(
      Joi.object({
        limit: Joi.number().integer().min(1).max(100).default(10).messages({
          'number.base': '限制数必须是数字',
          'number.integer': '限制数必须是整数',
          'number.min': '限制数至少为1',
          'number.max': '限制数最多为100',
        }),
      })
    ),
    searchQuery: validateQuery(
      Joi.object({
        name: Joi.string().min(1).max(50).required().messages({
          'string.min': '搜索姓名至少需要1个字符',
          'string.max': '搜索姓名不能超过50个字符',
          'any.required': '请提供要搜索的姓名',
        }),
      })
    ),
  },

  /**
   * 通用验证器
   */
  common: {
    pagination: validateQuery(paginationSchema),
    uuidParams: validateParams(Joi.object({ id: uuidSchema })),
    numberParams: validateParams(Joi.object({ id: numberIdSchema })),
  },
};

/**
 * 验证器组合工厂函数
 * 用于组合多个验证器
 */
export const combineValidators = (...validators: any[]) => {
  return validators.flat();
};
