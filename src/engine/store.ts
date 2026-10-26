/**
 * 저장소 — 기기의 localStorage가 1차 저장소.
 * 다른 에이스와 같은 주소(eternal-today.github.io)에서 돌아 저장소를 함께 쓰므로 모든 이름 앞에 'thinking_'을 붙임.
 *
 * 생각 에이스는 별을 주지 않음 (2026-10-25 결정). 보상은 생각나무의 물:
 *   5문제 맞힐 때마다 물 한 방울, 한 판 정답률 40% 미만이면 0
 * 무료 힌트(판마다 2번)를 다 쓴 뒤에는 공통 지갑의 별을 1개씩 씀 (다른 과목에서 번 별).
 */
import { useSyncExternalStore } from 'react';
import { Config, Medals, RoundRecord, Steps, Tree } from '../types';
import { ALL_TYPES } from './areas';
import { forgetThinkingRecords, markDirty, notifyWallet, spendHint } from '../ace/wallet';
import { logAdd, logRead, onPrefsApplied, prefsChanged } from '../ace/prefs';

const P = 'thinking_';
const K = {
  config: P + 'config', steps: P + 'steps', seen: P + 'seen', medals: P + 'medals', tree: P + 'tree', records: P + 'records',
  pin: P + 'parent_pin', peekPin: P + 'peek_pin',
};

export const COUNT_CHOICES = [5, 10, 15, 20];
export const PER_DROP = 5;          // 5문제 맞힐 때마다 물 한 방울
export const MIN_ACC = 0.4;         // 한 판 정답률이 이보다 낮으면 물 없음 (찍기 방지, 공통 규칙 9번과 같은 기준)

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function readText(key: string): string { try { return localStorage.getItem(key) || ''; } catch { return ''; } }

function defaultConfig(): Config {
  let name = '';
  try { name = read<any>('app_config', {}).childName || read<any>('hanja_config', {}).childName || read<any>('english_config', {}).childName || ''; } catch { /* 없음 */ }
  return { count: 10, newPer: 1, peek: true, childName: name };
}

export interface State {
  /** 부모님 체험 중: 모든 유형이 바로 나오고, 별·물·기록·단계가 남지 않음 (30분 뒤 자동으로 끝남) */
  preview: boolean;
  config: Config;
  steps: Steps;
  seen: Record<string, number>;   // 만난 유형 (전략 카드를 본 시각)
  medals: Medals;
  tree: Tree;
  records: RoundRecord[];         // 최근 것이 앞
  pin: string;                    // 부모님 설정 PIN (처음 1234)
  peekPin: string;                // 부모님 해설 PIN ('' = 아직 안 정함 → 해설 버튼 안 보임)
}

const PREVIEW_KEY = P + 'preview_until';
const PREVIEW_MS = 30 * 60 * 1000;
function readPreview(): boolean {
  try { return Number(sessionStorage.getItem(PREVIEW_KEY) || 0) > Date.now(); } catch { return false; }
}

/**
 * 생각나무: 이름·종류·숲·심은 시각은 thinking_tree에 두고(기기끼리 맞춤),
 * 물은 판마다 '쌓기 기록'(thinking_drops)에 적어 지금 나무를 심은 뒤의 물을 더해서 셈.
 * 그래서 아이 태블릿과 부모님 태블릿에서 번갈아 풀어도 물이 사라지지 않음.
 */
const DROPS_MIGRATED = P + 'drops_migrated_v1';
function readTree(): Tree {
  const t = { name: '', drops: 0, kind: 0, forest: [], plantedAt: 0, ...read<Partial<Tree>>(K.tree, {}) } as Tree;
  // 처음 한 번: 이 기기에 있던 물을 쌓기 기록으로 옮김 (체험 중에는 하지 않음)
  try {
    if (!localStorage.getItem(DROPS_MIGRATED) && !readPreview()) {
      if (t.drops > 0) logAdd('thinking_drops', Date.now(), t.drops);
      localStorage.setItem(DROPS_MIGRATED, '1');
    }
  } catch { /* 무시 */ }
  const log = logRead('thinking_drops');
  t.drops = Object.entries(log).reduce((a, [ts, v]) => a + (Number(ts) > (t.plantedAt || 0) ? Number(v) || 0 : 0), 0);
  return t;
}

function load(): State {
  const config: Config = { ...defaultConfig(), ...read<Partial<Config>>(K.config, {}) };
  if (!COUNT_CHOICES.includes(config.count)) config.count = 10;
  config.newPer = Math.max(0, Math.min(2, Number(config.newPer) || 0));
  const steps: Steps = Object.fromEntries(ALL_TYPES.map(k => [k, 0]));
  Object.assign(steps, read<Steps>(K.steps, {}));
  const tree = readTree();
  const preview = readPreview();
  const seen = read<Record<string, number>>(K.seen, {});
  return {
    preview, config, steps,
    seen: preview ? Object.fromEntries(ALL_TYPES.map(k => [k, 1])) : seen,
    medals: { gold: 0, silver: 0, bronze: 0, ...read<Partial<Medals>>(K.medals, {}) },
    tree,
    records: read<RoundRecord[]>(K.records, []),
    pin: readText(K.pin) || '1234',
    peekPin: readText(K.peekPin),
  };
}

let state: State = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());

/** 체험 중에는 학습 상태(단계·만난 유형·메달·나무·기록)를 기기에 쓰지 않음. 설정·PIN은 언제나 저장 */
function commit(patch: Partial<State>) {
  state = { ...state, ...patch };
  const learn = !state.preview;
  try {
    if (patch.config) localStorage.setItem(K.config, JSON.stringify(state.config));
    if (patch.pin) localStorage.setItem(K.pin, state.pin);
    if (patch.peekPin !== undefined) localStorage.setItem(K.peekPin, state.peekPin);
    if (learn) {
      if (patch.steps) localStorage.setItem(K.steps, JSON.stringify(state.steps));
      if (patch.seen) localStorage.setItem(K.seen, JSON.stringify(state.seen));
      if (patch.medals) localStorage.setItem(K.medals, JSON.stringify(state.medals));
      if (patch.tree) localStorage.setItem(K.tree, JSON.stringify(state.tree));
      if (patch.records) localStorage.setItem(K.records, JSON.stringify(state.records));
    }
  } catch (e) { console.error('저장 실패', e); }
  if (patch.config || patch.pin || patch.peekPin !== undefined || patch.tree) prefsChanged();   // 부모님 설정 → 다른 기기에도
  emit();
}

// 다른 기기에서 고친 부모님 설정(설정·PIN)이나 생각나무(물·이름·숲)가 넘어오면 다시 읽음
onPrefsApplied(() => {
  const fresh = load();
  state = { ...state, config: fresh.config, pin: fresh.pin, peekPin: fresh.peekPin, tree: state.preview ? state.tree : fresh.tree };
  emit();
});

export const getState = () => state;

// 체험 시간이 끝나면 저절로 원래 상태로
if (typeof window !== 'undefined') {
  setInterval(() => { if (state.preview && !readPreview()) { state = load(); emit(); } }, 30000);
}
export function useStore(): State {
  return useSyncExternalStore(
    fn => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    () => state,
  );
}

export const seenTypes = (s: State) => ALL_TYPES.filter(k => s.seen[k]);

/** 한 판의 물: 5문제마다 한 방울, 정답률 40% 미만이면 0 */
export function dropsFor(correct: number, total: number): { drops: number; lowAcc: boolean } {
  const lowAcc = total > 0 && correct / total < MIN_ACC;
  return { drops: lowAcc ? 0 : Math.floor(correct / PER_DROP), lowAcc };
}

export const actions = {
  saveConfig(config: Config, steps?: Steps) {
    commit(steps ? { config, steps } : { config });
  },
  setPin(pin: string) { commit({ pin }); },
  setPeekPin(peekPin: string) { commit({ peekPin }); },
  setPreview(on: boolean) {
    try { if (on) sessionStorage.setItem(PREVIEW_KEY, String(Date.now() + PREVIEW_MS)); else sessionStorage.removeItem(PREVIEW_KEY); } catch { /* 무시 */ }
    state = load();   // 켜면 모든 유형을 만난 것으로, 끄면 기기에 저장된 원래 상태로
    emit();
  },
  setSteps(steps: Steps) { commit({ steps }); },
  markSeen(keys: string[]) {
    if (!keys.some(k => !state.seen[k])) return;
    const seen = { ...state.seen };
    keys.forEach(k => { if (!seen[k]) seen[k] = Date.now(); });
    commit({ seen });
  },
  addMedal(tier: keyof Medals) { commit({ medals: { ...state.medals, [tier]: state.medals[tier] + 1 } }); },
  renameTree(name: string) { commit({ tree: { ...state.tree, name } }); },
  /** 다 자란 나무를 생각 숲으로 옮기고 다음 종류의 씨앗을 심음 (이름은 새로 지음) */
  plantNew() {
    const t = state.tree;
    const now = Date.now();
    commit({ tree: { name: '', drops: 0, kind: t.kind + 1, forest: [...t.forest, { name: t.name || '생각나무', kind: t.kind, at: now }], plantedAt: now } });
  },
  /** 한 판 끝: 물 주기와 기록 저장. 체험 중이면 아무것도 남기지 않음 */
  finishRound(rec: RoundRecord) {
    if (state.preview) return;
    if (rec.drops > 0) logAdd('thinking_drops', rec.ts, rec.drops);   // 물은 쌓기 기록으로 (다른 기기와 합침)
    const tree = { ...state.tree, drops: state.tree.drops + rec.drops };
    const records = [rec, ...state.records].map((r, i) => (i >= 300 && r.items?.length ? { ...r, items: [] } : r));
    commit({ records, tree });
    markDirty('thinking', rec.ts);   // 에이스 홈의 '오늘 푼 문제 수'에 쓰도록 서버로 올림 (별은 없음)
    notifyWallet();
  },
  /** 학습 기록 지우기: 판 기록·단계·만난 유형·메달. 나무·설정·PIN은 남김 */
  resetLearning() {
    forgetThinkingRecords();
    commit({ records: [], steps: Object.fromEntries(ALL_TYPES.map(k => [k, 0])), seen: {}, medals: { gold: 0, silver: 0, bronze: 0 } });
    notifyWallet();
  },
  /** 무료 힌트를 다 쓴 뒤: 공통 지갑의 별 1개 쓰기. 남은 별이 모자라면 false. 체험 중에는 쓰지 않음 */
  spendHint(note: string): boolean {
    if (state.preview) return true;
    return spendHint('thinking', note);
  },
};
