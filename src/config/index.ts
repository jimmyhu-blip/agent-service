import { z } from 'zod';

const envSchema = z.object({
	// Elasticsearch 連線設定
	ES_URL: z.string().url(),
	ES_API_KEY: z.string().optional(),

	// ELK Index 設定
	ELK_CLOUDFLARE_INDEX: z.string().default('across-cf-logpush-*'),

	// Server 設定
	PORT: z.coerce.number().default(3000),

	// 未來擴展預留
	OPENAI_API_KEY: z.string().optional(),
	ANTHROPIC_API_KEY: z.string().optional(),
	VECTOR_DB_URL: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadConfig(): EnvConfig {
	const result = envSchema.safeParse(process.env);

	if (!result.success) {
		console.error('❌ 環境變數配置錯誤:');
		console.error(result.error.format());
		process.exit(1);
	}

	return result.data;
}

export const config = loadConfig();
