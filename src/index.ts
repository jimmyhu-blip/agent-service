import { app } from './app.ts';
import { config } from './config/index.ts';

const server = Bun.serve({
	port: config.PORT,
	fetch: app.fetch,
});

console.log(`🚀 Server 啟動於 http://localhost:${server.port}`);
console.log(`📊 ELK API: http://localhost:${server.port}/api/elk/cf`);
