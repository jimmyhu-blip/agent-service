import { config } from '../../../../config/index.ts';
import {
	type OverallStats,
	overallStatsSchema,
} from '../../../../schemas/elk.ts';
import type { QueryDefinition } from '../types.ts';

/**
 * Q7: 整體統計
 * 取得分析時間範圍的整體統計，供 metadata 使用
 */
export const statsQuery: QueryDefinition<OverallStats> = {
	id: 'stats',
	name: 'Overall Statistics',
	description: '取得分析時間範圍的整體統計',

	buildQuery: (timeCondition: string) =>
		`
FROM ${config.ELK_CLOUDFLARE_INDEX}
| WHERE ${timeCondition}
| WHERE NOT ClientRequestURI LIKE "/cdn-cgi/*"
| STATS 
    total_events = COUNT(*),
    first_ts = MIN(@timestamp),
    last_ts = MAX(@timestamp),
    unique_hosts = COUNT_DISTINCT(ClientRequestHost),
    unique_ips = COUNT_DISTINCT(ClientIP),
    total_blocked = COUNT(CASE(SecurityAction == "block", 1))
| LIMIT 1
  `.trim(),

	responseSchema: overallStatsSchema,
	isSingleResult: true,
};
