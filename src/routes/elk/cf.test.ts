import { beforeAll, describe, expect, mock, test } from 'bun:test';
import { app } from '../../app.ts';

// Mock ElkQueryService
const mockAnalyze = mock(() => Promise.resolve({}));
const mockAnalyzeAll = mock(() => Promise.resolve({}));

mock.module('../../services/elk/ElkQueryService.ts', () => ({
	getElkQueryService: () => ({
		analyze: mockAnalyze,
		analyzeAll: mockAnalyzeAll,
		getAvailableQueryTypes: () => [
			'waf',
			'credential',
			'dos',
			'tunnel',
			'bot',
			'path',
			'stats',
		],
		getQueryInfo: (type: string) => ({
			name: `${type} query`,
			description: `Description for ${type}`,
		}),
	}),
}));

describe('ELK CF Routes', () => {
	beforeAll(() => {
		mockAnalyze.mockClear();
		mockAnalyzeAll.mockClear();
	});

	describe('GET /api/elk/cf', () => {
		test('應該回傳可用的查詢類型列表', async () => {
			const res = await app.request('/api/elk/cf');
			const json = await res.json();

			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data.availableTypes).toContain('waf');
			expect(json.data.availableTypes).toContain('all');
			expect(json.data.queries).toBeArray();
		});
	});

	describe('POST /api/elk/cf/:analyzeType', () => {
		test('缺少 timeCondition 應該回傳 400', async () => {
			const res = await app.request('/api/elk/cf/waf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});
			const json = await res.json();

			expect(res.status).toBe(400);
			expect(json.success).toBe(false);
		});

		test('空的 timeCondition 應該回傳 400', async () => {
			const res = await app.request('/api/elk/cf/waf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ timeCondition: '' }),
			});
			const json = await res.json();

			expect(res.status).toBe(400);
			expect(json.success).toBe(false);
		});

		test('無效的 analyzeType 應該回傳 400', async () => {
			const res = await app.request('/api/elk/cf/invalid', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					timeCondition: '@timestamp >= "2026-01-19T00:00:00Z"',
				}),
			});
			const json = await res.json();

			expect(res.status).toBe(400);
			expect(json.success).toBe(false);
			expect(json.error).toContain('無效的分析類型');
		});

		test('有效的 waf 請求應該成功', async () => {
			const mockWafResult = {
				total: 100,
				bypassed_200: 50,
				blocked: 10,
				challenged: 5,
				logged: 35,
				unique_ips: 20,
				unique_hosts: 3,
				min_waf_score: 10,
				min_sqli: 15,
				min_xss: 20,
				min_rce: 25,
			};
			mockAnalyze.mockResolvedValueOnce(mockWafResult);

			const res = await app.request('/api/elk/cf/waf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					timeCondition: '@timestamp >= "2026-01-19T00:00:00Z"',
				}),
			});
			const json = await res.json();

			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data).toEqual(mockWafResult);
		});

		test('有效的 all 請求應該呼叫 analyzeAll', async () => {
			const mockAllResult = {
				waf: {},
				credential: [],
				dos: [],
				tunnel: [],
				bot: [],
				path: [],
				stats: {},
			};
			mockAnalyzeAll.mockResolvedValueOnce(mockAllResult);

			const res = await app.request('/api/elk/cf/all', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					timeCondition: '@timestamp >= "2026-01-19T00:00:00Z"',
				}),
			});
			const json = await res.json();

			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(mockAnalyzeAll).toHaveBeenCalled();
		});

		test('服務錯誤應該回傳 500', async () => {
			mockAnalyze.mockRejectedValueOnce(new Error('ES connection failed'));

			const res = await app.request('/api/elk/cf/waf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					timeCondition: '@timestamp >= "2026-01-19T00:00:00Z"',
				}),
			});
			const json = await res.json();

			expect(res.status).toBe(500);
			expect(json.success).toBe(false);
			expect(json.error).toContain('查詢執行失敗');
		});
	});

	describe('所有 analyzeType 都應該接受有效請求', () => {
		const analyzeTypes = [
			'waf',
			'credential',
			'dos',
			'tunnel',
			'bot',
			'path',
			'stats',
		];

		for (const type of analyzeTypes) {
			test(`POST /api/elk/cf/${type} 應該成功`, async () => {
				mockAnalyze.mockResolvedValueOnce(
					type === 'waf' || type === 'stats' ? {} : [],
				);

				const res = await app.request(`/api/elk/cf/${type}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						timeCondition: '@timestamp >= "2026-01-19T00:00:00Z"',
					}),
				});
				const json = await res.json();

				expect(res.status).toBe(200);
				expect(json.success).toBe(true);
			});
		}
	});
});

describe('Health Check', () => {
	test('GET /health 應該回傳 ok', async () => {
		const res = await app.request('/health');
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.status).toBe('ok');
		expect(json.timestamp).toBeTruthy();
	});
});

describe('404 處理', () => {
	test('未知路徑應該回傳 404', async () => {
		const res = await app.request('/unknown/path');
		const json = await res.json();

		expect(res.status).toBe(404);
		expect(json.success).toBe(false);
		expect(json.error).toContain('找不到');
	});
});
