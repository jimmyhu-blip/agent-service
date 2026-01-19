import type {
	AggregatedResult,
	BotStats,
	CredentialStats,
	DosStats,
	OverallStats,
	PathStats,
	TunnelStats,
	WafStats,
} from '../../schemas/elk.ts';
import { getElkClient } from './ElkClient.ts';
import { cfQueries, cfQueryIds } from './queries/cf/index.ts';
import type { QueryDefinition } from './queries/types.ts';

export class ElkQueryService {
	private elkClient = getElkClient();

	/**
	 * 執行單一查詢
	 * @param analyzeType 查詢類型
	 * @param timeCondition 時間條件
	 * @returns 查詢結果
	 */
	async analyze<T>(analyzeType: string, timeCondition: string): Promise<T> {
		const query = cfQueries[analyzeType] as QueryDefinition<T> | undefined;

		if (!query) {
			throw new Error(`未知的查詢類型: ${analyzeType}`);
		}

		const esql = query.buildQuery(timeCondition);
		const results = await this.elkClient.esql<T>(esql);

		// 如果是單一結果（如 waf, stats），取第一筆
		if (query.isSingleResult) {
			const result = results[0];
			if (!result) {
				// 回傳空結果物件
				return this.getEmptyResult(analyzeType) as T;
			}
			return query.responseSchema.parse(result) as T;
		}

		// 陣列結果
		return query.responseSchema.parse(results) as T;
	}

	/**
	 * 並行執行所有查詢
	 * @param timeCondition 時間條件
	 * @returns 聚合結果
	 */
	async analyzeAll(timeCondition: string): Promise<AggregatedResult> {
		const [waf, credential, dos, tunnel, bot, path, stats] = await Promise.all([
			this.analyze<WafStats>('waf', timeCondition),
			this.analyze<CredentialStats>('credential', timeCondition),
			this.analyze<DosStats>('dos', timeCondition),
			this.analyze<TunnelStats>('tunnel', timeCondition),
			this.analyze<BotStats>('bot', timeCondition),
			this.analyze<PathStats>('path', timeCondition),
			this.analyze<OverallStats>('stats', timeCondition),
		]);

		return { waf, credential, dos, tunnel, bot, path, stats };
	}

	/**
	 * 取得可用的查詢類型列表
	 */
	getAvailableQueryTypes(): string[] {
		return cfQueryIds;
	}

	/**
	 * 取得查詢定義資訊
	 */
	getQueryInfo(
		analyzeType: string,
	): { name: string; description: string } | null {
		const query = cfQueries[analyzeType];
		if (!query) return null;
		return { name: query.name, description: query.description };
	}

	/**
	 * 取得空結果（當查詢無資料時）
	 */
	private getEmptyResult(analyzeType: string): unknown {
		switch (analyzeType) {
			case 'waf':
				return {
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
			case 'stats':
				return {
					total_events: 0,
					first_ts: null,
					last_ts: null,
					unique_hosts: 0,
					unique_ips: 0,
					total_blocked: 0,
				};
			default:
				return [];
		}
	}
}

// 匯出單例
let serviceInstance: ElkQueryService | null = null;

export const getElkQueryService = (): ElkQueryService => {
	if (!serviceInstance) {
		serviceInstance = new ElkQueryService();
	}
	return serviceInstance;
};
