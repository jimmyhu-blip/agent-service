import { config } from '../../config/index.ts';

interface EsqlResponse {
	columns: Array<{ name: string; type: string }>;
	values: unknown[][];
}

export class ElkClient {
	private static instance: ElkClient;
	private baseUrl: string;
	private headers: Record<string, string>;

	private constructor() {
		this.baseUrl = config.ES_URL;
		this.headers = {
			'Content-Type': 'application/json',
		};

		if (config.ES_API_KEY) {
			this.headers.Authorization = `ApiKey ${config.ES_API_KEY}`;
		}

		console.log(`🔗 ES 連線配置: ${this.baseUrl}`);
		console.log(`🔑 API Key: ${config.ES_API_KEY ? '已設定' : '未設定'}`);
		console.log(`📂 CF Index: ${config.ELK_CLOUDFLARE_INDEX}`);
	}

	/**
	 * 取得 ElkClient 單例
	 */
	static getInstance(): ElkClient {
		if (!ElkClient.instance) {
			ElkClient.instance = new ElkClient();
		}
		return ElkClient.instance;
	}

	/**
	 * 執行 ES|QL 查詢
	 * @param query ES|QL 查詢語句
	 * @returns 查詢結果陣列
	 */
	async esql<T = Record<string, unknown>>(query: string): Promise<T[]> {
		try {
			const response = await fetch(`${this.baseUrl}/_query?format=json`, {
				method: 'POST',
				headers: this.headers,
				body: JSON.stringify({ query }),
				verbose: true,
				tls: {
					rejectUnauthorized: false,
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`ES 查詢失敗 (${response.status}): ${errorText}`);
			}

			const data = (await response.json()) as EsqlResponse;

			// ES|QL 回傳格式：{ columns: [...], values: [...] }
			// 需要轉換成物件陣列
			const { columns, values } = data;

			if (!columns || !values) {
				return [];
			}

			const results = values.map((row) => {
				const obj: Record<string, unknown> = {};
				columns.forEach((col, index) => {
					obj[col.name] = row[index];
				});
				return obj as T;
			});

			return results;
		} catch (error) {
			console.error('ES|QL 查詢錯誤:', error);
			throw error;
		}
	}

	/**
	 * 測試連線
	 */
	async ping(): Promise<boolean> {
		try {
			const response = await fetch(this.baseUrl, {
				method: 'GET',
				headers: this.headers,
				verbose: true,
				tls: {
					rejectUnauthorized: false,
				},
			});
			return response.ok;
		} catch (error) {
			console.error('ES 連線測試失敗:', error);
			return false;
		}
	}
}

// 匯出單例取得方法
export const getElkClient = () => ElkClient.getInstance();
