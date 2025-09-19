import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponseUtil } from '@utils/apiResponse';
import { logger } from '@utils/logger';

type ValidationSource = 'body' | 'query' | 'params';

/**
 * 验证中间件
 */
export const validate = (schema: Joi.ObjectSchema, source: ValidationSource = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = req[source];

      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));

        logger.debug(`Validation failed for ${source}:`, errors);
        ApiResponseUtil.validationError(res, '验证失败', errors);
        return;
      }

      // 将验证后的数据替换原始数据
      req[source] = value;
      next();
    } catch (err) {
      logger.error('验证中间件错误:', err);
      ApiResponseUtil.serverError(res, '发生验证错误');
    }
  };
};

/**
 * 验证请求体
 */
export const validateBody = (schema: Joi.ObjectSchema) => validate(schema, 'body');

/**
 * 验证查询参数
 */
export const validateQuery = (schema: Joi.ObjectSchema) => validate(schema, 'query');

/**
 * 验证路径参数
 */
export const validateParams = (schema: Joi.ObjectSchema) => validate(schema, 'params');
