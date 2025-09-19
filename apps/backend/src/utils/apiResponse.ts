import type { Response } from 'express';
import type { ApiResponse, PaginatedResponse } from '../types/index';

export class ApiResponseUtil {
  private static respond<T>(res: Response, success: boolean, statusCode: number, message: string, data?: T, error?: string): Response<ApiResponse<T>> {
    return res.status(statusCode).json({
      success,
      message,
      data,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  static ok<T>(res: Response, data?: T, message = 'Success'): Response<ApiResponse<T>> {
    return this.respond(res, true, 200, message, data);
  }

  static created<T>(res: Response, data?: T, message = 'Created'): Response<ApiResponse<T>> {
    return this.respond(res, true, 201, message, data);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static badRequest(res: Response, message = 'Bad Request', error?: string): Response<ApiResponse> {
    return this.respond(res, false, 400, message, undefined, error);
  }

  static unauthorized(res: Response, message = 'Unauthorized'): Response<ApiResponse> {
    return this.respond(res, false, 401, message);
  }

  static forbidden(res: Response, message = 'Forbidden'): Response<ApiResponse> {
    return this.respond(res, false, 403, message);
  }

  static notFound(res: Response, message = 'Not Found'): Response<ApiResponse> {
    return this.respond(res, false, 404, message);
  }

  static conflict(res: Response, message = 'Conflict'): Response<ApiResponse> {
    return this.respond(res, false, 409, message);
  }

  static validationError(res: Response, message = 'Validation Error', errors?: any): Response<ApiResponse> {
    return this.respond(res, false, 422, message, undefined, errors);
  }

  static serverError(res: Response, message = 'Internal Server Error', error?: string): Response<ApiResponse> {
    return this.respond(res, false, 500, message, undefined, error);
  }

  static paginated<T>(res: Response, data: T[], page: number, limit: number, total: number, message = 'Success'): Response<ApiResponse<PaginatedResponse<T>>> {
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
    return this.ok(res, paginatedData, message);
  }
}
