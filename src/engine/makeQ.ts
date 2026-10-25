/**
 * 문제 하나 만들기 + 반복 막기
 *  - 최근에 낸 문제와 그림이 똑같으면 다시 만듦 (모든 유형)
 *  - 스무고개는 최근 답(동물·탈것·음식)이 다시 나오지 않게 함
 *  - 기록은 이 기기 세션 안에서만 (앱을 껐다 켜면 처음부터)
 */
import { GEN2 } from '../gen/generators.js';
import type { Q } from './render';

const RECENT_STEMS = 60;     // 최근 문제 그림 몇 개를 기억할지
const RECENT_TWENTY = 12;    // 스무고개 답 몇 개를 기억할지
const stems: string[] = [];
const twenty: string[] = [];

const sigOf = (q: Q) => `${q.key}|${q.kind === 'twenty' ? q.ans : (q.stemHTML || JSON.stringify(q.puzzle || q.given || '')) + '|' + q.ans}`;

export function makeQ(key: string, step: number): Q {
  let q: Q = null;
  for (let t = 0; t < 25; t++) {
    q = GEN2[key](step);
    if (!q) continue;
    const dupStem = stems.includes(sigOf(q));
    const dupAns = q.kind === 'twenty' && twenty.includes(q.ans);
    if (!dupStem && !dupAns) break;
  }
  stems.push(sigOf(q)); if (stems.length > RECENT_STEMS) stems.shift();
  if (q.kind === 'twenty') { twenty.push(q.ans); if (twenty.length > RECENT_TWENTY) twenty.shift(); }
  return q;
}
