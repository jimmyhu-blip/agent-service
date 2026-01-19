import { config } from '../../../../config/index.ts';
import { type DosStats, dosStatsSchema } from '../../../../schemas/elk.ts';
import type { QueryDefinition } from '../types.ts';

/**
 * Q3: 低速率 DDoS 偵測
 * 偵測源站回應時間異常或大量 499/503 錯誤
 */
export const dosQuery: QueryDefinition<DosStats> = {
	id: 'dos',
	name: 'Slow DoS Detection',
	description: '偵測源站回應時間異常或大量 499/503 錯誤',

	buildQuery: (timeCondition: string) =>
		`
FROM ${config.ELK_CLOUDFLARE_INDEX}
| WHERE ${timeCondition}
| WHERE NOT ClientRequestURI LIKE "/cdn-cgi/*"
| STATS 
    avg_response_time = AVG(OriginResponseDurationMs),
    max_response_time = MAX(OriginResponseDurationMs),
    count_499 = COUNT(CASE(EdgeResponseStatus == 499, 1)),
    count_503 = COUNT(CASE(EdgeResponseStatus == 503, 1)),
    total_requests = COUNT(*)
  BY ClientIP, ClientASN
| WHERE avg_response_time > 5000 OR count_499 > 10 OR count_503 > 5
| SORT avg_response_time DESC
| LIMIT 20
  `.trim(),

	responseSchema: dosStatsSchema,
	isSingleResult: false,
};
