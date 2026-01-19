import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { ElkQueryService } from './ElkQueryService.ts';

// Mock ElkClient
const mockEsql = mock(() => Promise.resolve([]));

mock.module('./ElkClient.ts', () => ({
	getElkClient: () => ({
		esql: mockEsql,
	}),
}));

describe('ElkQueryService', () => {
	let service: ElkQueryService;

	beforeEach(() => {
		service = new ElkQueryService();
		mockEsql.mockClear();
	});

	describe('getAvailableQueryTypes', () => {
		test('應該回傳所有可用的查詢類型', () => {
			const types = service.getAvailableQueryTypes();

			expect(types).toContain('waf');
			expect(types).toContain('credential');
			expect(types).toContain('dos');
			expect(types).toContain('tunnel');
			expect(types).toContain('bot');
			expect(types).toContain('path');
			expect(types).toContain('stats');
			expect(types).toHaveLength(7);
		});
	});

	describe('getQueryInfo', () => {
		test('應該回傳查詢的名稱和描述', () => {
			const info = service.getQueryInfo('waf');

			expect(info).not.toBeNull();
			expect(info?.name).toBe('WAF Bypass Analysis');
			expect(info?.description).toContain('WAF');
		});

		test('未知查詢應該回傳 null', () => {
			const info = service.getQueryInfo('unknown');
			expect(info).toBeNull();
		});
	});

	describe('analyze', () => {
		test('未知查詢類型應該拋出錯誤', async () => {
			await expect(
				service.analyze('unknown', '@timestamp >= "2026-01-19T00:00:00Z"'),
			).rejects.toThrow('未知的查詢類型: unknown');
		});

		test('單一結果查詢無資料時應該回傳空結果', async () => {
			mockEsql.mockResolvedValueOnce([]);

			const result = await service.analyze(
				'waf',
				'@timestamp >= "2026-01-19T00:00:00Z"',
			);

			expect(result).toEqual({
				total: 0,
				bypassed_200: 0,
				blocked: 0,
				challenged: 0,
				logged: 0,
				unique_ips: 0,
				unique_hosts: 0,
				min_waf_score: null,
				min_sqli: null,
				min_xss: null,
				min_rce: null,
			});
		});

		test('陣列結果查詢無資料時應該回傳空陣列', async () => {
			mockEsql.mockResolvedValueOnce([]);

			const result = await service.analyze(
				'credential',
				'@timestamp >= "2026-01-19T00:00:00Z"',
			);

			expect(result).toEqual([]);
		});

		test('應該正確處理 waf 查詢結果', async () => {
			const mockData = {
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
			mockEsql.mockResolvedValueOnce([mockData]);

			const result = await service.analyze(
				'waf',
				'@timestamp >= "2026-01-19T00:00:00Z"',
			);

			expect(result).toEqual(mockData);
		});

		test('應該正確處理 credential 查詢結果', async () => {
			const mockData = [
				{
					ClientIP: '192.168.1.1',
					ClientASN: 12345,
					ClientCountry: 'tw',
					login_path_requests: 50,
					leaked_creds: 0,
					failed_401: 10,
					failed_403: 5,
					success_200: 35,
				},
			];
			mockEsql.mockResolvedValueOnce(mockData);

			const result = await service.analyze(
				'credential',
				'@timestamp >= "2026-01-19T00:00:00Z"',
			);

			expect(result).toEqual(mockData);
		});
	});

	describe('analyzeAll', () => {
		test('應該並行執行所有查詢', async () => {
			// Mock 各種回傳值
			mockEsql
				.mockResolvedValueOnce([
					{
						total: 1,
						bypassed_200: 0,
						blocked: 0,
						challenged: 0,
						logged: 0,
						unique_ips: 1,
						unique_hosts: 1,
						min_waf_score: null,
						min_sqli: null,
						min_xss: null,
						min_rce: null,
					},
				]) // waf
				.mockResolvedValueOnce([]) // credential
				.mockResolvedValueOnce([]) // dos
				.mockResolvedValueOnce([]) // tunnel
				.mockResolvedValueOnce([]) // bot
				.mockResolvedValueOnce([]) // path
				.mockResolvedValueOnce([
					{
						total_events: 100,
						first_ts: null,
						last_ts: null,
						unique_hosts: 1,
						unique_ips: 10,
						total_blocked: 5,
					},
				]); // stats

			const result = await service.analyzeAll(
				'@timestamp >= "2026-01-19T00:00:00Z"',
			);

			expect(result).toHaveProperty('waf');
			expect(result).toHaveProperty('credential');
			expect(result).toHaveProperty('dos');
			expect(result).toHaveProperty('tunnel');
			expect(result).toHaveProperty('bot');
			expect(result).toHaveProperty('path');
			expect(result).toHaveProperty('stats');

			// 應該呼叫 7 次 esql
			expect(mockEsql).toHaveBeenCalledTimes(7);
		});
	});
});
