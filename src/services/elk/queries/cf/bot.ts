import { type BotStats, botStatsSchema } from '../../../../schemas/elk.ts';
import type { QueryDefinition } from '../types.ts';

/**
 * Q5: 惡意機器人流量偵測
 * 偵測惡意機器人流量（bot, crawler, spider, python, curl, wget）和掃描工具
 */
export const botQuery: QueryDefinition<BotStats> = {
	id: 'bot',
	name: 'Malicious Bot Traffic Detection',
	description: '偵測惡意機器人流量和掃描工具',

	buildQuery: (timeCondition: string) =>
		`
FROM across-cf-logpush-*
| WHERE ${timeCondition}
| WHERE NOT ClientRequestURI LIKE "/cdn-cgi/*"
| WHERE ClientRequestUserAgent LIKE "*bot*" 
    OR ClientRequestUserAgent LIKE "*crawler*" 
    OR ClientRequestUserAgent LIKE "*spider*"
    OR ClientRequestUserAgent LIKE "*python*"
    OR ClientRequestUserAgent LIKE "*curl*"
    OR ClientRequestUserAgent LIKE "*wget*"
    OR ClientRequestUserAgent LIKE "*sqlmap*"
    OR ClientRequestUserAgent LIKE "*nikto*"
    OR ClientRequestUserAgent LIKE "*nmap*"
    OR ClientRequestUserAgent LIKE "*masscan*"
    OR ClientRequestUserAgent LIKE "*burp*"
    OR ClientRequestUserAgent LIKE "*metasploit*"
| STATS 
    count = COUNT(*),
    unique_ips = COUNT_DISTINCT(ClientIP),
    unique_paths = COUNT_DISTINCT(ClientRequestURI),
    blocked = COUNT(CASE(SecurityAction == "block", 1))
  BY ClientRequestUserAgent, ClientIP, ClientASN, ClientCountry
| SORT count DESC
| LIMIT 20
  `.trim(),

	responseSchema: botStatsSchema,
	isSingleResult: false,
};
