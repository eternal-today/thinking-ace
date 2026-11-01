// 다양성 검사: 유형·단계마다 300문제를 만들어 서로 다른 문제 수와 가장 많이 나온 답의 비율을 봄
// 실행: node scripts/variety.mjs   (npm test에서도 함께 돌림)
import { GEN2 } from '../src/gen/generators.js';
const N = 300;
// 판이 작아 문제 수가 원래 적은 것 (쉬움 길 찾기는 판 크기가 몇 가지뿐)
const MIN_PROBLEMS = { 'K2:0': 10, 'K3:0': 40, 'K3:1': 40, 'Z1:1': 100 };
export function variety() {
  const rows = []; let bad = 0;
  for (const k of Object.keys(GEN2)) for (const s of [0, 1, 2]) {
    const probs = new Set(), ans = {};
    for (let i = 0; i < N; i++) {
      const q = GEN2[k](s);
      probs.add(q.prompt + '|' + (q.stemHTML || JSON.stringify(q.puzzle || q.given || q.clues)) + '|' + (q.options || []).map(o => o.val).join(','));
      ans[q.ans] = (ans[q.ans] || 0) + 1;
    }
    const top = Math.max(...Object.values(ans)) / N, min = MIN_PROBLEMS[`${k}:${s}`] ?? 100;
    const ok = probs.size >= min && top <= 0.4;
    if (!ok) bad++;
    rows.push(`${ok ? '  ' : '✗ '}${k} ${['쉬움', '보통', '도전'][s]}: 문제 ${probs.size}가지 (기준 ${min}), 가장 많은 답 ${Math.round(top * 100)}%`);
  }
  return { rows, bad };
}
if (import.meta.url === `file://${process.argv[1]}`) { const r = variety(); console.log(r.rows.join('\n')); console.log('다양성 기준 못 넘은 것', r.bad); process.exit(r.bad ? 1 : 0); }
