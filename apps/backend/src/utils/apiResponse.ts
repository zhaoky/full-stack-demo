import type { Response } from 'express';
import type { ApiResponse, PaginatedResponse } from '@types/index';

export class ApiResponseUtil {
  /**
   * 发送成功响应
   */
  static success<T>(res: Response, message: string = 'Success', data?: T, statusCode: number = 200): Response<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * 发送错误响应
   */
  static error(res: Response, message: string = 'Internal Server Error', error?: string, statusCode: number = 500): Response<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * 发送分页响应
   */
  static paginated<T>(res: Response, data: T[], page: number, limit: number, total: number, message: string = 'Data retrieved successfully'): Response<ApiResponse<PaginatedResponse<T>>> {
    const totalPages = Math.ceil(total / limit);

    const paginatedData: PaginatedResponse<T> = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return this.success(res, message, paginatedData);
  }

  /**
   * 发送创建成功响应
   */
  static created<T>(res: Response, message: string = 'Resource created successfully', data?: T): Response<ApiResponse<T>> {
    return this.success(res, message, data, 201);
  }

  /**
   * 发送无内容响应
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * 发送未找到响应
   */
  static notFound(res: Response, message: string = 'Resource not found'): Response<ApiResponse> {
    return this.error(res, message, undefined, 404);
  }

  /**
   * 发送未授权响应
   */
  static unauthorized(res: Response, message: string = 'Unauthorized access'): Response<ApiResponse> {
    return this.error(res, message, undefined, 401);
  }

  /**
   * 发送禁止访问响应
   */
  static forbidden(res: Response, message: string = 'Access forbidden'): Response<ApiResponse> {
    return this.error(res, message, undefined, 403);
  }

  /**
   * 发送验证错误响应
   */
  static validationError(res: Response, message: string = 'Validation failed', errors?: any): Response<ApiResponse> {
    return this.error(res, message, errors, 422);
  }

  /**
   * 发送冲突响应
   */
  static conflict(res: Response, message: string = 'Resource conflict'): Response<ApiResponse> {
    return this.error(res, message, undefined, 409);
  }
}
