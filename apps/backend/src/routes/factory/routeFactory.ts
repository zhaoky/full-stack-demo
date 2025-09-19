import { Router } from 'express';
import type { UserController } from '@controllers/userController';
import type { RankingController } from '@controllers/rankingController';
import { routeGroups } from '../middleware/routeGroups';
import { validators } from '../validators';
import { withAsyncHandler } from '../handlers/responseHandlers';

/**
 * 路由工厂类
 * 用于依赖注入和路由创建的统一管理
 */
export class RouteFactory {
  constructor(private userController: UserController, private rankingController: RankingController) {}

  /**
   * 创建用户相关路由
   */
  createUserRoutes(): Router {
    const router = Router();

    // 公开路由
    const publicRoutes = Router();
    publicRoutes.post('/register', ...routeGroups.authOperation, validators.user.create, withAsyncHandler(this.userController.register.bind(this.userController)));

    publicRoutes.post('/login', ...routeGroups.authOperation, validators.user.login, withAsyncHandler(this.userController.login.bind(this.userController)));

    // 认证路由
    const authRoutes = Router();
    authRoutes.get('/me', withAsyncHandler(this.userController.getCurrentUser.bind(this.userController)));

    // 管理员路由
    const adminRoutes = Router();
    adminRoutes.get('/', validators.common.pagination, withAsyncHandler(this.userController.getUsers.bind(this.userController)));

    // 组装路由
    router.use('/', publicRoutes);
    router.use('/', ...routeGroups.authenticated, authRoutes);
    router.use('/', ...routeGroups.admin, adminRoutes);

    return router;
  }

  /**
   * 创建排名相关路由
   */
  createRankingRoutes(): Router {
    const router = Router();

    // 公开路由
    const publicRoutes = Router();
    publicRoutes.get('/', validators.ranking.query, withAsyncHandler(this.rankingController.getRankings.bind(this.rankingController)));

    // 版主路由
    const moderatorRoutes = Router();
    moderatorRoutes.post('/', ...routeGroups.createWithAuth, validators.ranking.create, withAsyncHandler(this.rankingController.createRanking.bind(this.rankingController)));

    // 管理员路由
    const adminRoutes = Router();
    adminRoutes.post('/recalculate', ...routeGroups.sensitiveOperation, withAsyncHandler(this.rankingController.recalculateRankings.bind(this.rankingController)));

    // 组装路由
    router.use('/', publicRoutes);
    router.use('/', ...routeGroups.moderator, moderatorRoutes);
    router.use('/', ...routeGroups.admin, adminRoutes);

    return router;
  }

  /**
   * 创建所有路由
   */
  createAllRoutes(): { userRoutes: Router; rankingRoutes: Router } {
    return {
      userRoutes: this.createUserRoutes(),
      rankingRoutes: this.createRankingRoutes(),
    };
  }
}

/**
 * 路由工厂实例创建函数
 */
export const createRouteFactory = (userController: UserController, rankingController: RankingController): RouteFactory => {
  return new RouteFactory(userController, rankingController);
};
