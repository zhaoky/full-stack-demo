import { Router } from 'express';
import { UserController } from '@controllers/userController';
import { routeGroups } from './middleware/routeGroups';
import { validators } from './validators';
import { withAsyncHandler } from './handlers/responseHandlers';

const router: Router = Router();

/**
 * 公开路由组
 * 无需认证的路由
 */
const publicRoutes = Router();

// 用户注册
publicRoutes.post('/register', ...routeGroups.authOperation, validators.user.create, withAsyncHandler(UserController.register));

// 用户登录
publicRoutes.post('/login', ...routeGroups.authOperation, validators.user.login, withAsyncHandler(UserController.login));

// 刷新令牌
publicRoutes.post('/refresh-token', ...routeGroups.authOperation, validators.user.refreshToken, withAsyncHandler(UserController.refreshToken));

/**
 * 认证路由组
 * 需要用户认证的路由
 */
const authRoutes = Router();

// 获取当前用户信息
authRoutes.get('/me', withAsyncHandler(UserController.getCurrentUser));

// 用户登出
authRoutes.post('/logout', withAsyncHandler(UserController.logout));

// 更新当前用户信息
authRoutes.put('/me', ...routeGroups.generalOperation, validators.user.update, withAsyncHandler(UserController.updateUser));

// 修改密码
authRoutes.post('/change-password', ...routeGroups.authOperation, validators.user.changePassword, withAsyncHandler(UserController.changePassword));

/**
 * 管理员路由组
 * 需要管理员权限的路由
 */
const adminRoutes = Router();

// 获取用户列表
adminRoutes.get('/', validators.common.pagination, withAsyncHandler(UserController.getUsers));

// 获取用户统计信息
adminRoutes.get('/stats', withAsyncHandler(UserController.getUserStats));

// 根据ID获取用户信息
adminRoutes.get('/:id', validators.user.params, withAsyncHandler(UserController.getUserById));

// 更新用户信息（管理员操作）
adminRoutes.put('/:id', ...routeGroups.generalOperation, validators.user.params, validators.user.update, withAsyncHandler(UserController.updateUser));

// 删除用户
adminRoutes.delete('/:id', ...routeGroups.sensitiveOperation, validators.user.params, withAsyncHandler(UserController.deleteUser));

// 切换用户状态
adminRoutes.patch('/:id/toggle-status', ...routeGroups.sensitiveOperation, validators.user.params, withAsyncHandler(UserController.toggleUserStatus));

/**
 * 组合所有路由
 */
// 挂载公开路由
router.use('/', publicRoutes);

// 挂载认证路由
router.use('/', ...routeGroups.authenticated, authRoutes);

// 挂载管理员路由
router.use('/', ...routeGroups.admin, adminRoutes);

export default router;
