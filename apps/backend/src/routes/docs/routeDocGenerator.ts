import { routeRegistry, type RouteInfo } from '../metadata/routeInfo';

/**
 * 路由文档生成器
 * 自动生成API文档和路由信息
 */
export class RouteDocGenerator {
  /**
   * 生成Markdown格式的API文档
   */
  static generateMarkdownDocs(): string {
    const grouped = this.groupRoutesByTag();
    let markdown = '# API 路由文档\n\n';

    // 生成目录
    markdown += '## 目录\n\n';
    for (const tag of Object.keys(grouped)) {
      markdown += `- [${tag}](#${tag.replace(/\s+/g, '-').toLowerCase()})\n`;
    }
    markdown += '\n';

    // 生成各分组的详细文档
    for (const [tag, routes] of Object.entries(grouped)) {
      markdown += `## ${tag}\n\n`;

      for (const route of routes) {
        markdown += `### ${route.method} ${route.path}\n\n`;
        markdown += `**描述**: ${route.description}\n\n`;
        markdown += `**权限**: ${route.auth}\n\n`;

        if (route.rateLimit) {
          markdown += `**限流**: ${route.rateLimit}\n\n`;
        }

        if (route.summary) {
          markdown += `**摘要**: ${route.summary}\n\n`;
        }

        if (route.deprecated) {
          markdown += `**⚠️ 已废弃**: 此端点已废弃，请使用新版本\n\n`;
        }

        markdown += '---\n\n';
      }
    }

    return markdown;
  }

  /**
   * 生成OpenAPI/Swagger格式的文档
   */
  static generateOpenAPISpec(): any {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: '后端 API',
        version: '1.0.0',
        description: '全栈演示项目的后端API文档',
      },
      servers: [
        {
          url: '/api/v1',
          description: 'API v1',
        },
      ],
      paths: {},
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    };

    for (const route of routeRegistry) {
      const path = route.path.replace('/api/v1', '');
      const method = route.method.toLowerCase();

      if (!spec.paths[path]) {
        spec.paths[path] = {};
      }

      spec.paths[path][method] = {
        summary: route.summary || route.description,
        description: route.description,
        tags: route.tags || ['默认'],
        security: route.auth === 'public' ? [] : [{ bearerAuth: [] }],
        responses: {
          200: {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { type: 'object' },
                  },
                },
              },
            },
          },
          400: {
            description: '请求错误',
          },
          401: {
            description: '未授权',
          },
          403: {
            description: '权限不足',
          },
          500: {
            description: '服务器错误',
          },
        },
      };

      if (route.deprecated) {
        spec.paths[path][method].deprecated = true;
      }
    }

    return spec;
  }

  /**
   * 按标签分组路由
   */
  private static groupRoutesByTag(): Record<string, RouteInfo[]> {
    const grouped: Record<string, RouteInfo[]> = {};

    for (const route of routeRegistry) {
      const tags = route.tags || ['默认'];

      for (const tag of tags) {
        if (!grouped[tag]) {
          grouped[tag] = [];
        }
        grouped[tag].push(route);
      }
    }

    return grouped;
  }

  /**
   * 生成路由统计信息
   */
  static generateRouteStats(): {
    total: number;
    byAuth: Record<string, number>;
    byMethod: Record<string, number>;
    byTag: Record<string, number>;
    deprecated: number;
  } {
    const stats = {
      total: routeRegistry.length,
      byAuth: {} as Record<string, number>,
      byMethod: {} as Record<string, number>,
      byTag: {} as Record<string, number>,
      deprecated: 0,
    };

    for (const route of routeRegistry) {
      // 按权限统计
      stats.byAuth[route.auth] = (stats.byAuth[route.auth] || 0) + 1;

      // 按方法统计
      stats.byMethod[route.method] = (stats.byMethod[route.method] || 0) + 1;

      // 按标签统计
      for (const tag of route.tags || ['默认']) {
        stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
      }

      // 废弃路由统计
      if (route.deprecated) {
        stats.deprecated++;
      }
    }

    return stats;
  }

  /**
   * 生成路由列表（用于调试和监控）
   */
  static generateRouteList(): RouteInfo[] {
    return routeRegistry.sort((a, b) => {
      if (a.path === b.path) {
        return a.method.localeCompare(b.method);
      }
      return a.path.localeCompare(b.path);
    });
  }
}
