# fuck-u-code 優化方案

## 目標

- 先處理會增加維護成本的真問題：複雜函式、重複資料讀寫、未包裝的檔案操作。
- 不為了 `comment_ratio` 補無意義註釋。
- 不為測試 `expect()`、`Map.set/delete()`、Chrome extension callback 這類正則誤報做繞路寫法。

## 已處理

- `CrawlPopular.mjs`：合併相同 API fetch wrapper，集中 JSON 讀寫錯誤上下文。
- `src/common/aggregations/build.mjs`：把單一大型聚合函式拆成 channel、UP、duration、hour、tag、engagement helper。
- `src/common/utils/cjk-segmenter.ts`：拆出 fallback token、gram summary 和保留判斷，降低 n-gram 分支巢狀。
- `src/common/libs/result-data.server.ts`：集中本地 JSON 讀取 fallback。
- mobile/iOS build scripts 與 extension：為檔案操作和 Chrome API 加錯誤上下文。
- `.fuckucoderc.json`：讓日常掃描聚焦主程式碼，排除測試、平台殼、生成物與報告檔。

## 掃描方式

全倉可比掃描：

```bash
npm exec -g -- fuck-u-code analyze . --locale zh --format markdown --output fuck-u-code-report.md --top 30 --exclude "node_modules/**" ".next/**" "out/**" "coverage/**" "test-results/**"
```

日常聚焦掃描：

```bash
npm exec -g -- fuck-u-code analyze . --locale zh --format markdown --output fuck-u-code-report.md
```
