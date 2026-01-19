import { config } from '../../../../config/index.ts';
import { type WafStats, wafStatsSchema } from '../../../../schemas/elk.ts';
import type { QueryDefinition } from '../types.ts';

/**
 * Q1: WAF 繞過/攻擊分析
 * 偵測 WAF 分數低但未被阻擋的攻擊（潛在繞過）
 */
export const wafQuery: QueryDefinition<WafStats> = {
	id: 'waf',
	name: 'WAF Bypass Analysis',
	description: '偵測 WAF 分數低但未被阻擋的攻擊（潛在繞過）',

	buildQuery: (timeCondition: string) =>
		`
FROM ${config.ELK_CLOUDFLARE_INDEX}
| WHERE ${timeCondition}
| WHERE NOT ClientRequestURI LIKE "/cdn-cgi/*"
| WHERE WAFAttackScore < 50 OR WAFSQLiAttackScore < 50 OR WAFXSSAttackScore < 50 OR WAFRCEAttackScore < 50
| STATS 
    total = COUNT(*),
    bypassed_200 = COUNT(CASE(SecurityAction != "block" AND EdgeResponseStatus == 200, 1)),
    blocked = COUNT(CASE(SecurityAction == "block", 1)),
    challenged = COUNT(CASE(SecurityAction == "challenge" OR SecurityAction == "jschallenge" OR SecurityAction == "managedChallenge", 1)),
    logged = COUNT(CASE(SecurityAction == "log", 1)),
    unique_ips = COUNT_DISTINCT(ClientIP),
    unique_hosts = COUNT_DISTINCT(ClientRequestHost),
    min_waf_score = MIN(WAFAttackScore),
    min_sqli = MIN(WAFSQLiAttackScore),
    min_xss = MIN(WAFXSSAttackScore),
    min_rce = MIN(WAFRCEAttackScore)
| LIMIT 1
  `.trim(),

	responseSchema: wafStatsSchema,
	isSingleResult: true,
};
