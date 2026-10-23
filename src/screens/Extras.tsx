/** 생각 숲 (다 키운 나무)과 전략 카드 목록 */
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../engine/store';
import { AREAS, TYPE_NAME } from '../engine/areas';
import { kindOf } from '../engine/tree';
import { TreeArt } from '../components/thinking';
import { J } from '../gen/generators.js';

const Back = ({ onBack, title }: { onBack: () => void; title: string }) => (
  <div className="flex items-center gap-3">
    <button onClick={onBack} aria-label="뒤로" className="w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 active:scale-90"><ChevronLeft size={22} /></button>
    <h2 className="text-2xl font-black text-slate-900">{title}</h2>
  </div>
);

export function Forest({ onBack }: { onBack: () => void }) {
  const { tree } = useStore();
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <Back onBack={onBack} title="🌲 생각 숲" />
        <p className="text-sm font-bold text-slate-500">열매 나무까지 키운 나무는 이 숲으로 옮겨 심어요. 그리고 새 씨앗을 심어 다른 나무를 키워요.</p>
        {tree.forest.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {tree.forest.map((t, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 p-3 text-center">
                <TreeArt stage={5} kind={t.kind} />
                <div className="font-black text-slate-800 font-display">{t.name}</div>
                <div className="text-xs font-bold text-slate-400">{kindOf(t.kind).n}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center space-y-2">
            <div className="text-5xl">🌱</div>
            <p className="font-bold text-slate-600">아직 숲이 비어 있어요. {J(tree.name || '생각나무', '을', '를')} 열매 나무까지 키우면 첫 나무가 심겨요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Cards({ onBack, onOpen }: { onBack: () => void; onOpen: (k: string) => void }) {
  const { seen } = useStore();
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Back onBack={onBack} title="📒 전략 카드" />
        <p className="text-sm font-bold text-slate-500">문제마다 어떻게 생각하면 좋은지 3장으로 보여 줘요. 문제를 풀다가도 「전략 카드」를 누르면 볼 수 있어요.</p>
        {AREAS.map(a => (
          <div key={a.id} className="bg-white rounded-3xl border border-slate-100 p-4 space-y-3">
            <h3 className="font-black text-slate-800">{a.ic} {a.name}</h3>
            <div className="flex flex-wrap gap-2">
              {a.types.map(k => (
                <button key={k} onClick={() => onOpen(k)}
                  className={`rounded-2xl px-4 py-2 font-bold border-2 active:scale-95 ${seen[k] ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                  {TYPE_NAME[k]}
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="text-xs text-slate-400">색이 있는 카드는 이미 만난 문제예요.</p>
      </div>
    </div>
  );
}
