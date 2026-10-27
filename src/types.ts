/** 생각 에이스 타입 */

export interface Config {
  count: number;          // 한 판 문제 수 (5·10·15·20, 마지막 한 문제는 도전 문제)
  newPer: number;         // 물 주러 가기 한 판에 새로 나오는 문제 유형 (0~2)
  peek: boolean;          // 문제 화면에 '부모님 해설' 버튼 두기 (해설 PIN을 정해야 보임)
  childName: string;
}

export type Steps = Record<string, number>;   // 유형별 단계 0 쉬움 · 1 보통 · 2 도전
export interface Medals { gold: number; silver: number; bronze: number }

export interface ForestTree { name: string; kind: number; at: number }
export interface Tree {
  name: string;           // 아이가 지은 나무 이름
  drops: number;          // 지금 나무에 준 물 (5문제 맞힐 때마다 한 방울)
  kind: number;           // 나무 종류 (사과·귤·자두·레몬 차례)
  forest: ForestTree[];   // 다 키워 생각 숲으로 옮긴 나무
  plantedAt?: number;     // 지금 나무를 심은 시각 (이 뒤에 준 물만 지금 나무 것)
}

export interface RoundItem {
  k: string;              // 유형
  st: number;             // 단계
  ch: boolean;            // 도전 문제
  ok: boolean;
  hint: boolean;
  ans: string;            // 정답 (글자로)
  clues?: number | null;  // 스무고개: 연 단서 수
}

export type Menu = 'daily' | `area:${string}`;

export interface RoundRecord {
  ts: number;
  date: string;
  menu: Menu;
  stars: number;          // 늘 0 (생각 에이스는 별을 주지 않음. 공통 지갑 형식에 맞춰 둠)
  correct: number;        // 도전 문제 포함
  total: number;
  drops: number;          // 나무에 준 물
  lowAcc: boolean;        // 정답률 40% 미만이라 물이 없던 판
  paidPlay?: boolean;     // 놀이터 무료 2번 뒤 별을 내고 한 판 (물 없음)
  hintsFree: number;
  hintsPaid: number;
  fresh: string[];        // 이 판에서 처음 만난 유형
  items: RoundItem[];
}
