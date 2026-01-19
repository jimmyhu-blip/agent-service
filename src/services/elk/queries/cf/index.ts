import type { QueryDefinition } from '../types.ts';
import { botQuery } from './bot.ts';
import { credentialQuery } from './credential.ts';
import { dosQuery } from './dos.ts';
import { pathQuery } from './path.ts';
import { statsQuery } from './stats.ts';
import { tunnelQuery } from './tunnel.ts';
import { wafQuery } from './waf.ts';

// 所有 Cloudflare 查詢定義
export const cfQueries: Record<string, QueryDefinition<unknown>> = {
	waf: wafQuery,
	credential: credentialQuery,
	dos: dosQuery,
	tunnel: tunnelQuery,
	bot: botQuery,
	path: pathQuery,
	stats: statsQuery,
};

// 查詢 ID 列表（排除 'all'）
export const cfQueryIds = Object.keys(cfQueries);

// 匯出個別查詢
export {
	wafQuery,
	credentialQuery,
	dosQuery,
	tunnelQuery,
	botQuery,
	pathQuery,
	statsQuery,
};
