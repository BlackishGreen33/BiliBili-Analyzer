/**
 * src/common/utils/cjk-segmenter.ts
 *
 * 用內建 `Intl.Segmenter('zh', { granularity: 'word' })` 把 CJK 標題
 * 切成有意義的詞，並依 n-gram 計算詞頻。
 *
 * 設計：
 *   - 純函式、無副作用；可被 server / client / test 同時用
 *   - 過濾單字（高頻噪聲）與 stopword（的/了/是 等）
 *   - 接受繁中、簡中、英文標題混合輸入
 *   - 詞長 ≥ 2 才計入；n-gram 範圍 2..3
 *
 * 為何不引入 jieba / nodejieba：
 *   - Intl.Segmenter 在 Node 18+ 與所有 evergreen 瀏覽器內建
 *   - Vercel runtime 也支援
 *   - 品質足夠「高頻詞」場景；分詞顆粒度對 word cloud 足夠
 */

export type SegToken = { word: string; count: number };

const STOPWORDS = new Set<string>([
  '的',
  '了',
  '是',
  '我',
  '你',
  '他',
  '她',
  '它',
  '在',
  '和',
  '与',
  '與',
  '或',
  '及',
  '等',
  '这',
  '這',
  '那',
  '就',
  '也',
  '都',
  '而',
  '但',
  '却',
  '卻',
  '把',
  '被',
  '对',
  '對',
  '不',
  '没',
  '沒',
  '有',
  '为',
  '為',
  '上',
  '下',
  '里',
  '裡',
  '中',
  '以',
  '到',
  '去',
  '来',
  '來',
  '用',
  '可',
  '会',
  '會',
  '能',
  '要',
  '只',
  '才',
  '再',
  '又',
  '很',
  '太',
  '真',
  '让',
  '讓',
  '给',
  '給',
  '从',
  '從',
  '向',
  '比',
  '像',
  '之',
  '于',
  '於',
  '所',
  '其',
  '此',
  '该',
  '該',
  '并',
  '並',
  '还',
  '還',
  '已',
  '使',
  '让',
  '吗',
  '嗎',
  '呢',
  '啊',
  '哦',
  '嗯',
  '哈',
  '呀',
  '啦',
  '吧',
  '么',
  '麼',
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'to',
  'of',
  'in',
  'on',
  'at',
  'by',
  'for',
  'with',
  'as',
  'it',
  'its',
  'this',
  'that',
  'and',
  'or',
  'but',
  'not',
  'no',
  'so',
  'if',
  'we',
  'you',
  'they',
  'he',
  'she',
  'i',
  'me',
  'my',
  'our',
  'your',
  'their',
]);

/** 判斷單一字元是否含 CJK（含中日韓統一表意文字） */
export function isCjkChar(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
    (code >= 0xf900 && code <= 0xfaff) // CJK Compatibility Ideographs
  );
}

/** 判斷是否為英文 / 數字字元（用於拉丁 token 邊界） */
export function isLatinOrDigitChar(ch: string): boolean {
  return /[A-Za-z0-9]/.test(ch);
}

/** 判斷是否為「高頻無意義字」（單字 stopword） */
export function isStopword(word: string): boolean {
  if (word.length === 0) return true;
  return STOPWORDS.has(word.toLowerCase());
}

/** 判斷 token 是否「值得保留」 */
export function isMeaningfulToken(token: string): boolean {
  if (token.length < 2) return false;
  if (isStopword(token)) return false;
  return true;
}

/**
 * Lazy-initialized segmenter（不同 Node 版本對 Intl.Segmenter 支援度不同；
 * 若無 segmenter 走 fallback：每個 CJK 連續段當作 1 個字串、拉丁段整段保留）。
 */
let _segmenter: Intl.Segmenter | null = null;
let _hasChecked = false;

function getSegmenter(): Intl.Segmenter | null {
  if (_hasChecked) return _segmenter;
  _hasChecked = true;
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    try {
      _segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
    } catch {
      _segmenter = null;
    }
  }
  return _segmenter;
}

/**
 * 把一段 CJK / 拉丁混雜的標題切成有意義的 token。
 * - CJK：用 Intl.Segmenter 切成「word」
 * - 拉丁/數字：整段保留
 * - 標點、空白：丟掉
 */
export function tokenizeText(text: string): string[] {
  const seg = getSegmenter();
  const tokens: string[] = [];
  if (!seg) {
    // Fallback：粗略切
    const cjkRuns = text.match(/[\u4e00-\u9fff]+/g) ?? [];
    for (const run of cjkRuns) {
      // 簡單 2-gram
      for (let i = 0; i + 2 <= run.length; i++) {
        tokens.push(run.slice(i, i + 2));
      }
    }
    const latin = text.match(/[A-Za-z0-9]+/g) ?? [];
    for (const l of latin) {
      tokens.push(l);
    }
    return tokens;
  }
  const it = seg.segment(text);
  for (const piece of it) {
    if (!piece.isWordLike) continue;
    const s = piece.segment.trim();
    if (s.length === 0) continue;
    tokens.push(s);
  }
  return tokens;
}

/**
 * 對一段文字做 n-gram 組合（用於補 CJK 細顆粒分詞的不足）
 * 預設 n=2..3
 */
export function ngrams(tokens: string[], minN = 2, maxN = 3): string[] {
  if (tokens.length === 0) return [];
  const out: string[] = [];
  for (let n = minN; n <= maxN; n++) {
    if (n > tokens.length) break;
    for (let i = 0; i + n <= tokens.length; i++) {
      const gram: string[] = [];
      let allCjk = true;
      let hasCjk = false;
      for (let j = 0; j < n; j++) {
        const t = tokens[i + j];
        if (t === undefined) continue;
        const firstChar = Array.from(t)[0] ?? '';
        if (isCjkChar(firstChar)) hasCjk = true;
        else allCjk = false;
        gram.push(t);
      }
      if (!hasCjk) continue;
      // 全拉丁且太長的略過
      if (!allCjk && gram.join(' ').length > 24) continue;
      out.push(gram.join(''));
    }
  }
  return out;
}

/**
 * 對一組標題計詞頻，回 top N。
 * 流程：tokenize → n-gram → 過濾 → 計數 → 排序。
 */
export function segmentTitles(
  titles: string[],
  options: { topN?: number; minN?: number; maxN?: number } = {}
): SegToken[] {
  const { topN = 200, minN = 2, maxN = 3 } = options;
  const counts = new Map<string, number>();

  for (const title of titles) {
    if (!title) continue;
    const baseTokens = tokenizeText(title);
    const grams = ngrams(baseTokens, minN, maxN);
    for (const g of grams) {
      if (!isMeaningfulToken(g)) continue;
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, topN);
}
