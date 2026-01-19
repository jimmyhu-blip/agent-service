import type { z } from 'zod';

/**
 * 查詢定義介面
 * 每個查詢都必須實作此介面
 */
export interface QueryDefinition<T> {
	/** 查詢 ID，用於 API 路由 */
	id: string;

	/** 查詢名稱（人類可讀） */
	name: string;

	/** 查詢描述 */
	description: string;

	/**
	 * 建立 ES|QL 查詢語句
	 * @param timeCondition 時間過濾條件
	 * @returns ES|QL 查詢字串
	 */
	buildQuery: (timeCondition: string) => string;

	/** 回應資料的 Zod Schema */
	responseSchema: z.ZodType<T>;

	/**
	 * 是否為單一結果（非陣列）
	 * 用於 Service 判斷如何處理查詢結果
	 */
	isSingleResult?: boolean;
}

/**
 * 查詢 ID 類型
 */
export type QueryId =
	| 'waf'
	| 'credential'
	| 'dos'
	| 'tunnel'
	| 'bot'
	| 'path'
	| 'stats'
	| 'all';
