import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { routes } from './routes/index.ts';

const app = new Hono();

// ===== Middleware =====

// CORS
app.use('*', cors());

// 請求日誌
app.use('*', logger());

// JSON 美化輸出
app.use('*', prettyJSON());

// ===== 路由 =====

// 健康檢查
app.get('/health', (c) => {
	return c.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
	});
});

// API 路由
app.route('/api', routes);

// 404 處理
app.notFound((c) => {
	return c.json(
		{
			success: false,
			error: '找不到該路徑',
		},
		404,
	);
});

// 錯誤處理
app.onError((err, c) => {
	console.error('伺服器錯誤:', err);
	return c.json(
		{
			success: false,
			error: '伺服器內部錯誤',
		},
		500,
	);
});

export { app };
