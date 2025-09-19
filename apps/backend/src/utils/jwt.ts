import jwt from 'jsonwebtoken';
import type { IUser } from '../types/index';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export class JWTUtil {
  private static readonly secret = process.env.JWT_SECRET || 'your-super-secret-key';
  private static readonly refreshSecret = process.env.JWT_REFRESH_SECRET || 'your-super-refresh-secret-key';
  private static readonly accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  private static readonly refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  /**
   * 创建令牌载荷
   */
  private static createPayload(user: IUser): TokenPayload {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * 生成访问令牌
   */
  static generateAccessToken(user: IUser): string {
    const payload = this.createPayload(user);
    return jwt.sign(payload, this.secret, { expiresIn: this.accessTokenExpiresIn } as any);
  }

  /**
   * 生成刷新令牌
   */
  static generateRefreshToken(user: IUser): string {
    const payload = this.createPayload(user);
    return jwt.sign(payload, this.refreshSecret, { expiresIn: this.refreshTokenExpiresIn } as any);
  }

  /**
   * 生成双token对
   */
  static generateTokenPair(user: IUser): TokenPair {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
      expiresIn: this.accessTokenExpiresIn,
      refreshExpiresIn: this.refreshTokenExpiresIn,
    };
  }

  /**
   * 验证访问令牌
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.secret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * 验证刷新令牌
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.refreshSecret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * 解码 JWT token（不验证）
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }
}
