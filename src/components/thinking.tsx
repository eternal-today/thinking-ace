import React, { useMemo, useState } from 'react';
import { GEN2, J } from '../gen/generators.js';
import { STAGES, isDone, kindOf, stageOf, toNext, treeSVG } from '../engine/tree';
import { TIP, TYPE_NAME } from '../engine/areas';
import { promptOf, solveOf, stemHTML } from '../engine/render';
import { Sheet } from './ui';

/** HTML 문자열로 만든 그림을 그대로 넣음 (문제 만들기·나무 그림은 앱 안에서 만든 것만 씀) */
export const Html = ({ html, className, onClick }: { html: string; className?: string; onClick?: (e: React.MouseEvent<HTMLDivElement>) => void }) => (
  <div className={className} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
);

export function TreeArt({ drops, kind, stage, mini = false, className = '' }: { drops?: number; kind: number; stage?: number; mini?: boolean; className?: string }) {
  const st = stage ?? stageOf(drops || 0);
  return <Html className={className} html={treeSVG({ stage: st, kind, mini })} />;
}

export function StageBar({ drops, kind }: { drops: number; kind: number }) {
  const st = stageOf(drops);
  return (
    <>
      <div className="stagebar">
        {STAGES.map((x, i) => (
          <span key={i} className={`sg ${i < st ? 'past' : ''} ${i === st ? 'now' : ''}`}>
            <TreeArt stage={i} kind={kind} mini />
            <b>{x.n}</b><small>💧{x.d}</small>
          </span>
        ))}
      </div>
      <div className="next">
        {isDone(drops) ? '다 자랐어요! 생각 숲으로 옮겨 심고 새 씨앗을 심을 수 있어요.' : `지금 💧${drops} · ${STAGES[st + 1].n}까지 💧${toNext(drops)}`}
      </div>
    </>
  );
}

/**
 * 전략 카드 (3장): 이런 문제예요 → 이렇게 생각해요 → 이렇게 답을 찾아요.
 * intro: 물 주러 가기에서 새 유형을 처음 소개할 때 (닫기 없이 끝까지 보고 시작)
 */
export function StratSheet({ k, treeName, intro, onDone, onClose }: {
  k: string | null; treeName: string;
  intro?: { i: number; n: number };
  onDone: () => void; onClose: () => void;
}) {
  const [scene, setScene] = useState(0);
  const q = useMemo(() => (k ? GEN2[k](0) : null), [k]);
  if (!k || !q) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  let body = '';
  if (scene === 0) body = `<span class="no">1 / 3 · 이런 문제예요</span><div class="sp">${promptOf(q, treeName)}</div><div class="stem">${stemHTML(q, null)}</div>${q.options && q.kind !== 'twenty' ? `<div class="opts" style="width:100%">${q.options.map((o: any) => `<span class="opt">${o.html}</span>`).join('')}</div>` : ''}`;
  else if (scene === 1) body = `<span class="no">2 / 3 · 이렇게 생각해요</span><div class="tip">💡 ${TIP[k]}</div>${q.kind === 'twenty' ? '<div class="sp">단서 하나를 열 때마다 맞지 않는 것을 지워요.</div>' : `<div class="hint" style="width:100%">${q.hintHTML}</div>`}`;
  else body = `<span class="no">3 / 3 · 이렇게 답을 찾아요</span><div class="solve" style="width:100%">${solveOf(q)}</div>`;
  const last = scene === 2;
  const next = () => { if (!last) { setScene(scene + 1); return; } setScene(0); intro ? onDone() : onClose(); };
  return (
    <Sheet open onClose={intro ? () => { } : onClose} wide>
      <div className="space-y-4">
        <h3 className="text-xl font-black text-slate-900">
          {intro ? `🌱 새로운 문제${intro.n > 1 ? ` (${intro.n}개 중 ${intro.i + 1}번째)` : ''} · ` : '📒 '}{TYPE_NAME[k]}
        </h3>
        <Html className="scene" html={body} />
        <div className="dots3">{[0, 1, 2].map(i => <i key={i} className={i === scene ? 'on' : ''} />)}</div>
        <div className="flex gap-3">
          {scene > 0 ? <button className="btn-secondary flex-1" onClick={() => setScene(scene - 1)}>이전</button>
            : !intro && <button className="btn-secondary flex-1" onClick={onClose}>닫기</button>}
          <button className="btn-primary flex-1" onClick={next}>
            {!last ? '다음' : intro ? (intro.i + 1 < intro.n ? '알겠어요, 다음 문제 보기' : '알겠어요, 시작하기') : '닫기'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

/** 나무 이름 짓기. 새 나무면(이름이 비었으면) 닫을 수 없음 */
export function NamingSheet({ open, current, kind, lastName, onSave, onClose }: {
  open: boolean; current: string; kind: number; lastName?: string;
  onSave: (name: string) => void; onClose: () => void;
}) {
  const first = !current;
  const [v, setV] = useState(current);
  return (
    <Sheet open={open} onClose={first ? () => { } : onClose}>
      <div className="space-y-4 text-center">
        <TreeArt stage={0} kind={kind} mini className="w-28 mx-auto" />
        <h3 className="text-xl font-black text-slate-900">{first ? `${kindOf(kind).n} 씨앗을 심었어요!` : '나무 이름 바꾸기'}</h3>
        <p className="text-sm text-slate-500 font-medium break-keep">
          {first
            ? (lastName ? `${J(lastName, '은', '는')} 생각 숲으로 갔어요. 새 ${kindOf(kind).n}의 이름을 지어 주세요.` : '문제를 맞히면 물을 줄 수 있어요. 나무 이름을 지어 주세요.')
            : '새 이름을 지어 주세요. 언제든 다시 바꿀 수 있어요.'}
        </p>
        <input className="w-full text-center text-2xl font-black border-[3px] border-brand-200 focus:border-brand-500 rounded-2xl p-3 outline-none"
          maxLength={8} placeholder="예: 쑥쑥이" value={v} onChange={e => setV(e.target.value)} autoComplete="off" />
        <div className="flex flex-wrap gap-2 justify-center">
          {['쑥쑥이', '튼튼이', '반짝이', '생각이', '초롱이'].map(x => (
            <button key={x} className="border border-slate-200 rounded-full px-4 py-1.5 font-bold text-slate-600" onClick={() => setV(x)}>{x}</button>
          ))}
        </div>
        <button className="btn-primary w-full py-4" disabled={!v.trim()} onClick={() => onSave(v.trim().slice(0, 8))}>이 이름으로 할래요</button>
      </div>
    </Sheet>
  );
}
