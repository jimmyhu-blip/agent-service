import { describe, expect, test } from 'bun:test';
import { botQuery } from './bot.ts';
import { credentialQuery } from './credential.ts';
import { dosQuery } from './dos.ts';
import { cfQueries, cfQueryIds } from './index.ts';
import { pathQuery } from './path.ts';
import { statsQuery } from './stats.ts';
import { tunnelQuery } from './tunnel.ts';
import { wafQuery } from './waf.ts';

describe('cfQueries', () => {
	test('應該包含所有 7 個查詢', () => {
		expect(cfQueryIds).toHaveLength(7);
		expect(cfQueryIds).toContain('waf');
		expect(cfQueryIds).toContain('credential');
		expect(cfQueryIds).toContain('dos');
		expect(cfQueryIds).toContain('tunnel');
		expect(cfQueryIds).toContain('bot');
		expect(cfQueryIds).toContain('path');
		expect(cfQueryIds).toContain('stats');
	});

	test('所有查詢都應該有必要屬性', () => {
		for (const id of cfQueryIds) {
			const query = cfQueries[id];
			expect(query).toBeDefined();
			expect(query.id).toBe(id);
			expect(query.name).toBeTruthy();
			expect(query.description).toBeTruthy();
			expect(typeof query.buildQuery).toBe('function');
			expect(query.responseSchema).toBeDefined();
		}
	});

	test('所有查詢的 buildQuery 都應該排除 cdn-cgi 路徑', () => {
		const timeCondition = '@timestamp >= "2026-01-19T00:00:00Z"';

		for (const id of cfQueryIds) {
			const query = cfQueries[id];
			const esql = query.buildQuery(timeCondition);
			expect(esql).toContain('WHERE NOT ClientRequestURI LIKE "/cdn-cgi/*"');
		}
	});
});

describe('單一結果查詢 (waf, stats)', () => {
	test('waf 和 stats 應該標記為 isSingleResult', () => {
		expect(wafQuery.isSingleResult).toBe(true);
		expect(statsQuery.isSingleResult).toBe(true);
	});

	test('waf 和 stats 查詢應該包含 LIMIT 1', () => {
		const timeCondition = '@timestamp >= "2026-01-19T00:00:00Z"';

		expect(wafQuery.buildQuery(timeCondition)).toContain('LIMIT 1');
		expect(statsQuery.buildQuery(timeCondition)).toContain('LIMIT 1');
	});
});

describe('陣列結果查詢', () => {
	const arrayQueries = [
		credentialQuery,
		dosQuery,
		tunnelQuery,
		botQuery,
		pathQuery,
	];

	test('應該不標記為 isSingleResult 或標記為 false', () => {
		for (const query of arrayQueries) {
			expect(query.isSingleResult).toBeFalsy();
		}
	});

	test('應該包含 LIMIT 20', () => {
		const timeCondition = '@timestamp >= "2026-01-19T00:00:00Z"';

		for (const query of arrayQueries) {
			expect(query.buildQuery(timeCondition)).toContain('LIMIT 20');
		}
	});

	test('應該包含 SORT ... DESC', () => {
		const timeCondition = '@timestamp >= "2026-01-19T00:00:00Z"';

		for (const query of arrayQueries) {
			expect(query.buildQuery(timeCondition)).toMatch(/SORT .+ DESC/);
		}
	});
});

describe('credentialQuery 特定測試', () => {
	test('應該過濾登入相關路徑', () => {
		const query = credentialQuery.buildQuery(
			'@timestamp >= "2026-01-19T00:00:00Z"',
		);
		expect(query).toContain('*login*');
		expect(query).toContain('*auth*');
		expect(query).toContain('*signin*');
	});

	test('應該只回傳請求數 > 10 的結果', () => {
		const query = credentialQuery.buildQuery(
			'@timestamp >= "2026-01-19T00:00:00Z"',
		);
		expect(query).toContain('WHERE login_path_requests > 10');
	});
});

describe('botQuery 特定測試', () => {
	test('應該偵測常見機器人和掃描工具', () => {
		const query = botQuery.buildQuery('@timestamp >= "2026-01-19T00:00:00Z"');
		expect(query).toContain('*bot*');
		expect(query).toContain('*python*');
		expect(query).toContain('*curl*');
		expect(query).toContain('*sqlmap*');
		expect(query).toContain('*nikto*');
	});
});

describe('pathQuery 特定測試', () => {
	test('應該偵測路徑遍歷和敏感檔案', () => {
		const query = pathQuery.buildQuery('@timestamp >= "2026-01-19T00:00:00Z"');
		expect(query).toContain('*../*');
		expect(query).toContain('*/.env*');
		expect(query).toContain('*/.git/*');
		expect(query).toContain('*/etc/passwd*');
		expect(query).toContain('*/wp-config*');
	});
});
