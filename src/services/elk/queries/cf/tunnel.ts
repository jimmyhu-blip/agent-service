import { config } from '../../../../config/index.ts';
import {
	type TunnelStats,
	tunnelStatsSchema,
} from '../../../../schemas/elk.ts';
import type { QueryDefinition } from '../types.ts';

/**
 * Q4: Tunnel 濫用偵測（HTTP 層）
 * 在 HTTP 層偵測可能的 Cloudflare Tunnel 濫用
 */
export const tunnelQuery: QueryDefinition<TunnelStats> = {
	id: 'tunnel',
	name: 'Tunnel Abuse Detection',
	description: '在 HTTP 層偵測可能的 Cloudflare Tunnel 濫用',

	buildQuery: (timeCondition: string) =>
		`
FROM ${config.ELK_CLOUDFLARE_INDEX}
| WHERE ${timeCondition}
| WHERE NOT ClientRequestURI LIKE "/cdn-cgi/*"
| WHERE ClientRequestHost LIKE "*trycloudflare*" 
    OR ClientRequestHost LIKE "*tunnel*" 
    OR ClientRequestURI LIKE "*cloudflared*"
    OR ClientRequestURI LIKE "*.argotunnel.*"
| STATS 
    count = COUNT(*),
    unique_ips = COUNT_DISTINCT(ClientIP)
  BY ClientRequestHost, ClientIP, ClientASN
| SORT count DESC
| LIMIT 20
  `.trim(),

	responseSchema: tunnelStatsSchema,
	isSingleResult: false,
};
