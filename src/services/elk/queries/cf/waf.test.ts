import { describe, expect, test } from 'bun:test';
import { wafQuery } from './waf.ts';

describe('wafQuery', () => {
	test('應該有正確的 id', () => {
		expect(wafQuery.id).toBe('waf');
	});

	test('應該有正確的名稱和描述', () => {
		expect(wafQuery.name).toBe('WAF Bypass Analysis');
		expect(wafQuery.description).toContain('WAF');
	});

	test('應該標記為單一結果', () => {
		expect(wafQuery.isSingleResult).toBe(true);
	});

	test('buildQuery 應該產生包含時間條件的 ES|QL', () => {
		const timeCondition = '@timestamp >= "2026-01-19T00:00:00Z"';
		const query = wafQuery.buildQuery(timeCondition);

		expect(query).toContain(timeCondition);
		expect(query).toContain('FROM across-cf-logpush-*');
		expect(query).toContain('WHERE NOT ClientRequestURI LIKE "/cdn-cgi/*"');
		expect(query).toContain('WAFAttackScore < 50');
		expect(query).toContain('LIMIT 1');
	});

	test('responseSchema 應該驗證有效的 WAF 統計資料', () => {
		const validData = {
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

		const result = wafQuery.responseSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	test('responseSchema 應該接受 null 值的分數欄位', () => {
		const dataWithNulls = {
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
		};

		const result = wafQuery.responseSchema.safeParse(dataWithNulls);
		expect(result.success).toBe(true);
	});

	test('responseSchema 應該拒絕無效資料', () => {
		const invalidData = {
			total: 'not a number',
		};

		const result = wafQuery.responseSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});
});
