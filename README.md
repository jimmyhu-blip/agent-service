# Agent Service

取代 Dify 功能的服務，包含 Workflow、Agent、RAG、Chat 等功能。

## 目前功能

### ELK 安全分析 API

提供 Cloudflare 日誌的安全分析查詢，取代 Dify 的 ELK MCP 節點。

## 快速開始

### 安裝依賴

```bash
bun install
```

### 設定環境變數

複製 `.env.example` 為 `.env` 並填入 Elasticsearch 連線資訊：

```bash
cp .env.example .env
```

編輯 `.env`：

```env
ES_URL=https://your-elasticsearch:9200
ES_API_KEY=your-api-key
PORT=3000
```

### 啟動服務

```bash
# 開發模式（自動重載）
bun run dev

# 生產模式
bun run start
```

## API 文件

### 健康檢查

```
GET /health
```

### 取得可用查詢類型

```
GET /api/elk/cf
```

### 執行安全分析查詢

```
POST /api/elk/cf/:analyzeType
Content-Type: application/json

{
  "timeCondition": "@timestamp >= \"2026-01-19T00:00:00Z\" AND @timestamp <= \"2026-01-19T23:59:59Z\""
}
```

**可用的 analyzeType：**

| 類型 | 說明 |
|------|------|
| `waf` | WAF 繞過/攻擊分析 |
| `credential` | 憑證填充偵測 |
| `dos` | 低速率 DDoS 偵測 |
| `tunnel` | Tunnel 濫用偵測 |
| `bot` | 惡意機器人流量偵測 |
| `path` | 路徑遍歷偵測 |
| `stats` | 整體統計 |
| `all` | 並行執行全部查詢 |

### 回應格式

```json
{
  "success": true,
  "data": { ... }
}
```

錯誤回應：

```json
{
  "success": false,
  "error": "錯誤訊息"
}
```

## 專案結構

```
src/
├── index.ts                    # 應用入口
├── app.ts                      # Hono app 設定
├── config/index.ts             # 環境變數配置
├── routes/
│   ├── index.ts
│   └── elk/cf.ts               # ELK Cloudflare 路由
├── services/elk/
│   ├── ElkClient.ts            # ES 連線封裝
│   ├── ElkQueryService.ts      # 查詢服務
│   └── queries/cf/             # Q1-Q7 查詢定義
└── schemas/elk.ts              # Zod schemas
```

## 技術棧

- **Runtime**: Bun
- **Framework**: Hono
- **Validation**: Zod
- **Database**: Elasticsearch (ES|QL)

## 未來規劃

- [ ] Workflow Engine
- [ ] LangGraph Agent
- [ ] RAG 整合
- [ ] Chat 功能
