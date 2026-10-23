/**
 * 문제 그림·보기를 HTML 문자열로 (시제품과 같은 모양). 누르는 칸은 data-* 속성으로 표시하고 화면에서 한꺼번에 받음.
 */
import { PAINT, SUDO_SYM, tname, tokHTML, twentySolve, J, sudokuHTML, paintGridHTML } from '../gen/generators.js';

export type Q = any;   // 문제 만들기가 돌려주는 문제 (kind: choice · num · paint · sudoku · twenty)

/** 푸는 중인 상태 중 그림에 필요한 것 */
export interface View {
  answered: boolean; lastOk: boolean | null; given: string | null;
  sel: string | null; typed: string; paint: number[]; sudo: number[]; sudoSel: number | null;
  revealed: number; crossed: Set<number>; hintOpen: boolean;
}

export const promptOf = (q: Q, treeName: string) => String(q.prompt).replace('{{NAME_GA}}', J(treeName, '이', '가'));

export function stemHTML(q: Q, v: View | null): string {
  const isStatic = !v;
  if (q.kind === 'sudoku') {
    if (!v) return sudokuHTML(q.puzzle, { given: q.given });
    const wrong = new Set<number>(), right = new Set<number>();
    if (v.answered) q.blanks.forEach((i: number) => (v.sudo[i] === q.sol[i] ? right : wrong).add(i));
    return sudokuHTML(v.sudo, { given: q.given, sel: v.answered ? null : v.sudoSel, tap: !v.answered, wrong, right });
  }
  if (q.kind === 'paint') {
    const cells = v ? v.paint : q.given;
    const note = q.nc === 2
      ? `<div class="paintNote">누를 때마다 <span class="swatch" style="background:${PAINT[0]}"></span> → <span class="swatch" style="background:${PAINT[1]}"></span> → 지우기</div>`
      : `<div class="paintNote">누르면 <span class="swatch" style="background:${PAINT[0]}"></span> 칠해지고, 한 번 더 누르면 지워져요</div>`;
    return paintGridHTML(q, cells, { tap: !!v && !v.answered }) + (isStatic ? '' : note);
  }
  if (q.kind === 'twenty') {
    const n = v ? v.revealed : q.need;
    const clues = `<div class="clues">${q.clues.slice(0, n).map((c: string, i: number) => `<div class="clue ${v && i === n - 1 && i > 0 ? 'new' : ''}"><span class="cn">단서 ${i + 1}</span>${c}</div>`).join('')}</div>`;
    if (!v) return clues;
    const more = !v.answered && v.revealed < q.clues.length ? `<button class="btn-secondary reveal" data-reveal="1">🔎 다음 단서 열기 (${v.revealed}/${q.clues.length})</button>` : '';
    return clues + more + `<span class="remain">남은 후보 ${q.items.length - v.crossed.size}개</span>`;
  }
  return q.stemHTML || '';
}

export function inputHTML(q: Q, v: View): string {
  if (q.kind === 'paint') return '';
  if (q.kind === 'sudoku') {
    if (v.answered) return '';
    return `<div class="palette">${SUDO_SYM.map((t: any, i: number) => `<button class="opt pal" data-sym="${i}" aria-label="${tname(t)} 넣기">${tokHTML(t)}</button>`).join('')}<button class="opt pal" data-sym="-1">지우기</button></div>`;
  }
  if (q.kind === 'num') {
    if (v.answered) return `<div class="ansbox ${v.lastOk ? 'ok' : 'no'}">${v.given}</div>`;
    return `<div class="ansbox">${v.typed || '&nbsp;'}</div><div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => `<button class="key" data-k="${n}">${n}</button>`).join('')}<button class="key wide" data-k="del">지우기</button></div>`;
  }
  const gone = new Set<number>();
  if (q.kind === 'twenty' && v.hintOpen) q.elim.slice(0, v.revealed).forEach((a: number[]) => a.forEach(i => gone.add(i)));
  return `<div class="opts">${q.options.map((o: any, i: number) => {
    let c = '';
    if (v.answered) c = o.val === q.ans ? 'right' : o.val === v.given ? 'wrong' : 'dim';
    else if (q.kind === 'twenty') c = v.crossed.has(i) ? 'crossed' : gone.has(i) ? 'dim' : '';
    else if (o.val === v.sel) c = 'sel';
    return `<button class="opt ${c}" data-opt="${i}" ${v.answered ? 'disabled' : ''} aria-label="보기 ${i + 1}">${o.html}</button>`;
  }).join('')}</div>`;
}

/** 지금 답으로 낼 값 (아직 다 못 했으면 null) */
export function currentGiven(q: Q, v: View): string | null {
  if (q.kind === 'num') return v.typed === '' ? null : String(parseInt(v.typed, 10));
  if (q.kind === 'paint') return v.paint.map((x, i) => (i % q.w >= q.w / 2 ? x : '')).join('');
  if (q.kind === 'sudoku') return v.sudo.includes(-1) ? null : v.sudo.join('');
  if (q.kind === 'twenty') {
    const left = q.items.map((_: any, i: number) => i).filter((i: number) => !v.crossed.has(i));
    return left.length === 1 ? q.items[left[0]].n : null;
  }
  return v.sel;
}

export const ansHTML = (q: Q) => (q.kind === 'paint' ? q.ansHTML : q.kind === 'sudoku' ? q.ansHTML : q.kind === 'num' ? `<b style="font-size:22px">${q.ans}</b>` : q.kind === 'twenty' ? q.ansHTML : (q.ansHTML || q.answerText));
export const solveOf = (q: Q, upto?: number) => (q.kind === 'twenty' ? twentySolve(q, upto || q.need) : q.solveHTML);
export const ansText = (q: Q) => (q.kind === 'paint' || q.kind === 'sudoku' ? '그림' : String(q.answerText || q.ans).replace(/<[^>]+>/g, ''));

/** 스무고개: 지금까지 연 단서로 남는 후보 수 */
export function remainingByClues(q: Q, revealed: number): number {
  const gone = new Set<number>();
  q.elim.slice(0, revealed).forEach((a: number[]) => a.forEach(i => gone.add(i)));
  return q.items.length - gone.size;
}
