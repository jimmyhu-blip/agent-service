import { config } from '../../../../config/index.ts';
import { type PathStats, pathStatsSchema } from '../../../../schemas/elk.ts';
import type { QueryDefinition } from '../types.ts';

/**
 * Q6: 路徑遍歷 / 異常 UA 偵測
 * 偵測路徑遍歷攻擊（../, .env, .git 等）和異常 User-Agent
 */
export const pathQuery: QueryDefinition<PathStats> = {
	id: 'path',
	name: 'Path Traversal Detection',
	description: '偵測路徑遍歷攻擊和敏感檔案存取嘗試',

	buildQuery: (timeCondition: string) =>
		`
FROM ${config.ELK_CLOUDFLARE_INDEX}
| WHERE ${timeCondition}
| WHERE NOT ClientRequestURI LIKE "/cdn-cgi/*"
| WHERE ClientRequestURI LIKE "*../*" 
    OR ClientRequestURI LIKE "*%2e%2e*"
    OR ClientRequestURI LIKE "*/.env*"
    OR ClientRequestURI LIKE "*/.git/*"
    OR ClientRequestURI LIKE "*/.aws/*"
    OR ClientRequestURI LIKE "*/.ssh/*"
    OR ClientRequestURI LIKE "*/etc/passwd*"
    OR ClientRequestURI LIKE "*/wp-config*"
    OR ClientRequestURI LIKE "*/.htaccess*"
    OR ClientRequestURI LIKE "*/.htpasswd*"
    OR ClientRequestURI LIKE "*/web.config*"
    OR ClientRequestURI LIKE "*/config.php*"
    OR ClientRequestURI LIKE "*/admin*"
    OR ClientRequestURI LIKE "*/phpmyadmin*"
| STATS 
    sensitive_path_hits = COUNT(*),
    unique_sensitive_paths = COUNT_DISTINCT(ClientRequestURI),
    blocked = COUNT(CASE(SecurityAction == "block", 1)),
    success_200 = COUNT(CASE(EdgeResponseStatus == 200, 1))
  BY ClientIP, ClientCountry, ClientASN
| SORT sensitive_path_hits DESC
| LIMIT 20
  `.trim(),

	responseSchema: pathStatsSchema,
	isSingleResult: false,
};
