import { config } from '../../../../config/index.ts';
import {
	type CredentialStats,
	credentialStatsSchema,
} from '../../../../schemas/elk.ts';
import type { QueryDefinition } from '../types.ts';

/**
 * Q2: 憑證填充偵測
 * 偵測針對登入接口的大量嘗試，特別關注洩漏憑證
 */
export const credentialQuery: QueryDefinition<CredentialStats> = {
	id: 'credential',
	name: 'Credential Stuffing Detection',
	description: '偵測針對登入接口的大量嘗試，特別關注洩漏憑證',

	buildQuery: (timeCondition: string) =>
		`
FROM ${config.ELK_CLOUDFLARE_INDEX}
| WHERE ${timeCondition}
| WHERE NOT ClientRequestURI LIKE "/cdn-cgi/*"
| WHERE ClientRequestURI LIKE "*login*" OR ClientRequestURI LIKE "*auth*" OR ClientRequestURI LIKE "*signin*"
| STATS 
    login_path_requests = COUNT(*),
    leaked_creds = COUNT(CASE(LeakedCredentialCheckResult != "none", 1)),
    failed_401 = COUNT(CASE(EdgeResponseStatus == 401, 1)),
    failed_403 = COUNT(CASE(EdgeResponseStatus == 403, 1)),
    success_200 = COUNT(CASE(EdgeResponseStatus == 200, 1))
  BY ClientIP, ClientASN, ClientCountry
| WHERE login_path_requests > 10
| SORT login_path_requests DESC
| LIMIT 20
  `.trim(),

	responseSchema: credentialStatsSchema,
	isSingleResult: false,
};
