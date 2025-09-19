import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponseUtil } from '@utils/apiResponse';
import { logger } from '@utils/logger';

/**
 * 验证中间件工厂函数
 */
export const validateSchema = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let dataToValidate;

      switch (source) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        default:
          dataToValidate = req.body;
      }

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
      switch (source) {
        case 'body':
          req.body = value;
          break;
        case 'query':
          req.query = value;
          break;
        case 'params':
          req.params = value;
          break;
      }

      next();
    } catch (err) {
      logger.error('验证中间件错误:', err);
      ApiResponseUtil.error(res, '发生验证错误');
    }
  };
};

/**
 * 验证请求体
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return validateSchema(schema, 'body');
};

/**
 * 验证查询参数
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return validateSchema(schema, 'query');
};

/**
 * 验证路径参数
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return validateSchema(schema, 'params');
};

/**
 * 组合验证中间件
 */
export const validateAll = (schemas: { body?: Joi.ObjectSchema; query?: Joi.ObjectSchema; params?: Joi.ObjectSchema }) => {
  return [...(schemas.params ? [validateParams(schemas.params)] : []), ...(schemas.query ? [validateQuery(schemas.query)] : []), ...(schemas.body ? [validateBody(schemas.body)] : [])];
};
