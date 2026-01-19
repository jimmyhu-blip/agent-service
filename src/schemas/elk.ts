import { z } from 'zod';

// ===== Request Schemas =====

export const analyzeRequestSchema = z.object({
	timeCondition: z.string().min(1, '時間條件不能為空'),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

// ===== Response Schemas =====

// Q1: WAF 繞過/攻擊分析
export const wafStatsSchema = z.object({
	total: z.number(),
	bypassed_200: z.number(),
	blocked: z.number(),
	challenged: z.number(),
	logged: z.number(),
	unique_ips: z.number(),
	unique_hosts: z.number(),
	min_waf_score: z.number().nullable(),
	min_sqli: z.number().nullable(),
	min_xss: z.number().nullable(),
	min_rce: z.number().nullable(),
});

export type WafStats = z.infer<typeof wafStatsSchema>;

// Q2: 憑證填充偵測
export const credentialStatsItemSchema = z.object({
	ClientIP: z.string(),
	ClientASN: z.number(),
	ClientCountry: z.string(),
	login_path_requests: z.number(),
	leaked_creds: z.number(),
	failed_401: z.number(),
	failed_403: z.number(),
	success_200: z.number(),
});

export const credentialStatsSchema = z.array(credentialStatsItemSchema);

export type CredentialStats = z.infer<typeof credentialStatsSchema>;

// Q3: 低速率 DDoS 偵測
export const dosStatsItemSchema = z.object({
	ClientIP: z.string(),
	ClientASN: z.number(),
	avg_response_time: z.number().nullable(),
	max_response_time: z.number().nullable(),
	count_499: z.number(),
	count_503: z.number(),
	total_requests: z.number(),
});

export const dosStatsSchema = z.array(dosStatsItemSchema);

export type DosStats = z.infer<typeof dosStatsSchema>;

// Q4: Tunnel 濫用偵測
export const tunnelStatsItemSchema = z.object({
	ClientRequestHost: z.string(),
	ClientIP: z.string(),
	ClientASN: z.number(),
	count: z.number(),
	unique_ips: z.number(),
});

export const tunnelStatsSchema = z.array(tunnelStatsItemSchema);

export type TunnelStats = z.infer<typeof tunnelStatsSchema>;

// Q5: 惡意機器人流量偵測
export const botStatsItemSchema = z.object({
	ClientRequestUserAgent: z.string(),
	ClientIP: z.string(),
	ClientASN: z.number(),
	ClientCountry: z.string(),
	count: z.number(),
	unique_ips: z.number(),
	unique_paths: z.number(),
	blocked: z.number(),
});

export const botStatsSchema = z.array(botStatsItemSchema);

export type BotStats = z.infer<typeof botStatsSchema>;

// Q6: 路徑遍歷/異常 UA 偵測
export const pathStatsItemSchema = z.object({
	ClientIP: z.string(),
	ClientCountry: z.string(),
	ClientASN: z.number(),
	sensitive_path_hits: z.number(),
	unique_sensitive_paths: z.number(),
	blocked: z.number(),
	success_200: z.number(),
});

export const pathStatsSchema = z.array(pathStatsItemSchema);

export type PathStats = z.infer<typeof pathStatsSchema>;

// Q7: 整體統計
export const overallStatsSchema = z.object({
	total_events: z.number(),
	first_ts: z.string().nullable(),
	last_ts: z.string().nullable(),
	unique_hosts: z.number(),
	unique_ips: z.number(),
	total_blocked: z.number(),
});

export type OverallStats = z.infer<typeof overallStatsSchema>;

// ===== Aggregated Result =====

export const aggregatedResultSchema = z.object({
	waf: wafStatsSchema,
	credential: credentialStatsSchema,
	dos: dosStatsSchema,
	tunnel: tunnelStatsSchema,
	bot: botStatsSchema,
	path: pathStatsSchema,
	stats: overallStatsSchema,
});

export type AggregatedResult = z.infer<typeof aggregatedResultSchema>;

// ===== API Response =====

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		success: z.boolean(),
		data: dataSchema.optional(),
		error: z.string().optional(),
	});
