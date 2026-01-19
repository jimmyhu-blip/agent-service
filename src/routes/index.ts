import { Hono } from 'hono';
import { elkCfRoutes } from './elk/cf.ts';

const routes = new Hono();

// ELK 查詢路由
routes.route('/elk/cf', elkCfRoutes);

// 未來擴展預留
// routes.route('/workflow', workflowRoutes)
// routes.route('/agent', agentRoutes)
// routes.route('/chat', chatRoutes)

export { routes };
