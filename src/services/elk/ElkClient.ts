import { Client } from '@elastic/elasticsearch';
import { config } from '../../config/index.ts';

export class ElkClient {
	private static instance: ElkClient;
	private client: Client;

	private constructor() {
		this.client = new Client({
			node: config.ES_URL,
			auth: config.ES_API_KEY ? { apiKey: config.ES_API_KEY } : undefined,
		});
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
			const response = await this.client.esql.query({
				query,
				format: 'json',
			});

			// ES|QL 回傳格式：{ columns: [...], values: [...] }
			// 需要轉換成物件陣列
			const columns = response.columns as Array<{ name: string; type: string }>;
			const values = response.values as unknown[][];

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
			await this.client.ping();
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * 取得原始 ES Client（進階用途）
	 */
	getRawClient(): Client {
		return this.client;
	}
}

// 匯出單例取得方法
export const getElkClient = () => ElkClient.getInstance();
