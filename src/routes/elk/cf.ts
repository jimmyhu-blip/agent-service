import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { analyzeRequestSchema } from '../../schemas/elk.ts';
import { getElkQueryService } from '../../services/elk/ElkQueryService.ts';
import { cfQueryIds } from '../../services/elk/queries/cf/index.ts';

const elkCfRoutes = new Hono();

// 驗證 analyzeType 參數
const validAnalyzeTypes = [...cfQueryIds, 'all'];

/**
 * POST /api/elk/cf/:analyzeType
 * 執行 Cloudflare 安全分析查詢
 */
elkCfRoutes.post(
	'/:analyzeType',
	zValidator('json', analyzeRequestSchema),
	async (c) => {
		const analyzeType = c.req.param('analyzeType');
		const { timeCondition } = c.req.valid('json');

		// 驗證 analyzeType
		if (!validAnalyzeTypes.includes(analyzeType)) {
			return c.json(
				{
					success: false,
					error: `無效的分析類型: ${analyzeType}。可用類型: ${validAnalyzeTypes.join(', ')}`,
				},
				400,
			);
		}

		try {
			const elkService = getElkQueryService();

			// 執行查詢
			if (analyzeType === 'all') {
				const data = await elkService.analyzeAll(timeCondition);
				return c.json({ success: true, data });
			}

			const data = await elkService.analyze(analyzeType, timeCondition);
			return c.json({ success: true, data });
		} catch (error) {
			console.error(`查詢錯誤 [${analyzeType}]:`, error);

			const errorMessage = error instanceof Error ? error.message : '未知錯誤';
			return c.json(
				{
					success: false,
					error: `查詢執行失敗: ${errorMessage}`,
				},
				500,
			);
		}
	},
);

/**
 * GET /api/elk/cf
 * 取得可用的查詢類型列表
 */
elkCfRoutes.get('/', (c) => {
	const elkService = getElkQueryService();
	const queryTypes = elkService.getAvailableQueryTypes();

	const queries = queryTypes.map((type) => ({
		id: type,
		...elkService.getQueryInfo(type),
	}));

	return c.json({
		success: true,
		data: {
			availableTypes: [...queryTypes, 'all'],
			queries,
		},
	});
});

export { elkCfRoutes };
