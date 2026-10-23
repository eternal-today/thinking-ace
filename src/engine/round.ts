/**
 * 한 판 짜기
 *  - 물 주러 가기: 만난 유형에서 골고루 + 새 유형 0~2개(전략 카드로 먼저 소개, 그 판에서 두 번). 처음 한 판은 유형 3개로 시작
 *  - 놀이터: 그 영역 유형만, 소개 없이 바로 (모르면 문제 옆 전략 카드로 확인)
 *  - 같은 유형이 한 판에 몰리지 않게 유형마다 문제 수 상한을 둠
 *  - 마지막 한 문제는 도전 문제 (도전 단계)
 */
import { AREAS, ALL_TYPES, AREA_OF } from './areas';
import { R } from '../gen/generators.js';

/** 아직 안 만난 유형 n개: 만난 유형이 적은 영역부터, 영역 안에서는 앞 유형부터 */
export function pickNew(n: number, seen: Record<string, number>): string[] {
  const out: string[] = [];
  const seenIn = (types: string[]) => types.filter(k => seen[k] || out.includes(k)).length;
  while (out.length < n) {
    const c = AREAS.map(a => a.types.find(k => !seen[k] && !out.includes(k))).filter(Boolean) as string[];
    if (!c.length) break;
    c.sort((x, y) => seenIn(AREA_OF(x).types) - seenIn(AREA_OF(y).types));
    out.push(c[0]);
  }
  return out;
}

/** 물 주러 가기에서 새로 나올 유형 수 (처음엔 3개가 되도록) */
export function newCountFor(seenCount: number, newPer: number): number {
  return seenCount < 3 ? Math.max(3 - seenCount, newPer) : newPer;
}

/** 문제 순서 (유형 키 목록). 길이 = count, 마지막이 도전 문제 */
export function buildPlan(opt: { count: number; pool: string[]; fresh: string[]; area?: string }): string[] {
  const { count, fresh } = opt;
  const main = count - 1;
  const pool = opt.pool.length ? opt.pool : ALL_TYPES.slice(0, 3);
  const cap = Math.max(2, Math.ceil(main / pool.length) + (opt.area ? 1 : 0));
  const cnt: Record<string, number> = {};
  const base: string[] = [];
  const add = (k: string) => { if (base.length < main && (cnt[k] || 0) < cap) { base.push(k); cnt[k] = (cnt[k] || 0) + 1; } };
  fresh.forEach(k => { add(k); add(k); });
  let guard = 0;
  while (base.length < main && guard++ < 60) R.shuffle(pool).forEach((k: string) => add(k));
  while (base.length < main) base.push(R.pick(pool));
  return [...R.shuffle(base), R.pick(pool)];
}

export function areaTypes(id: string): string[] {
  return AREAS.find(a => a.id === id)?.types || [];
}
